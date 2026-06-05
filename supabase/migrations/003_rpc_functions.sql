-- ============================================
-- KUBU Core RPC Functions
-- Migration: 003_rpc_functions
-- Description: Atomic functions for voting, settlement, and battle creation
-- ============================================

-- ============================================
-- VOTE TRANSACTION
-- Atomic function to place a vote
-- ============================================
CREATE OR REPLACE FUNCTION vote_transaction(
  p_battle_id UUID,
  p_side TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS for atomic operation
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_points INTEGER;
  v_battle RECORD;
  v_stake INTEGER := 2;
  v_new_balance INTEGER;
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate side parameter
  IF p_side NOT IN ('left', 'right') THEN
    RAISE EXCEPTION 'Invalid side: must be "left" or "right"';
  END IF;

  -- Lock user row and get current balance
  SELECT points INTO v_user_points
  FROM users
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_user_points IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check sufficient balance
  IF v_user_points < v_stake THEN
    RAISE EXCEPTION 'Insufficient balance. Required: % points, Available: % points', v_stake, v_user_points;
  END IF;

  -- Lock battle row and get details
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;

  IF v_battle.status != 'active' THEN
    RAISE EXCEPTION 'Battle is not active. Current status: %', v_battle.status;
  END IF;

  IF v_battle.ends_at <= NOW() THEN
    RAISE EXCEPTION 'Battle has ended';
  END IF;

  -- Check for existing vote (double voting prevention)
  IF EXISTS (
    SELECT 1 FROM votes 
    WHERE user_id = v_user_id AND battle_id = p_battle_id
  ) THEN
    RAISE EXCEPTION 'You have already voted on this battle';
  END IF;

  -- Calculate new balance
  v_new_balance := v_user_points - v_stake;

  -- 1. Deduct points from user
  UPDATE users
  SET 
    points = v_new_balance,
    stats = jsonb_set(
      stats, 
      '{votes_cast}', 
      to_jsonb(COALESCE((stats->>'votes_cast')::int, 0) + 1)
    ),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- 2. Add to battle pool
  IF p_side = 'left' THEN
    UPDATE battles 
    SET pool_left = pool_left + v_stake 
    WHERE id = p_battle_id;
  ELSE
    UPDATE battles 
    SET pool_right = pool_right + v_stake 
    WHERE id = p_battle_id;
  END IF;

  -- 3. Record the vote
  INSERT INTO votes (user_id, battle_id, side, amount)
  VALUES (v_user_id, p_battle_id, p_side, v_stake);

  -- 4. Log transaction in audit table
  INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
  VALUES (
    v_user_id, 
    -v_stake, 
    'vote_placed', 
    p_battle_id, 
    format('Voted %s on battle: %s', p_side, v_battle.title)
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vote placed successfully',
    'data', jsonb_build_object(
      'battle_id', p_battle_id,
      'side', p_side,
      'amount', v_stake,
      'new_balance', v_new_balance
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with context
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

COMMENT ON FUNCTION vote_transaction IS 'Atomic vote placement: checks balance, deducts points, updates pool, records vote';

-- ============================================
-- SETTLE BATTLE
-- Called by cron/scheduler to close and settle battles
-- ============================================
CREATE OR REPLACE FUNCTION settle_battle(p_battle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
  v_total_pool INTEGER;
  v_tax INTEGER;
  v_tax_rate NUMERIC := 0.05;  -- 5% platform tax
  v_net_pool INTEGER;
  v_winning_side TEXT;
  v_winning_pool INTEGER;
  v_losing_pool INTEGER;
  v_winner_count INTEGER;
  v_ratio NUMERIC;
  v_burn_rate NUMERIC := 0;
  v_burn_amount INTEGER := 0;
  v_share_per_winner NUMERIC;
  v_voter RECORD;
  v_payout INTEGER;
  v_total_distributed INTEGER := 0;
BEGIN
  -- Lock and get battle
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle IS NULL THEN
    RAISE EXCEPTION 'Battle not found: %', p_battle_id;
  END IF;

  IF v_battle.status = 'closed' THEN
    RAISE EXCEPTION 'Battle is already closed';
  END IF;

  IF v_battle.status = 'queue' THEN
    RAISE EXCEPTION 'Battle has not started yet';
  END IF;

  -- Calculate totals
  v_total_pool := v_battle.pool_left + v_battle.pool_right;
  
  -- Handle no votes case
  IF v_total_pool = 0 THEN
    UPDATE battles SET status = 'closed' WHERE id = p_battle_id;
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Battle closed with no votes',
      'data', jsonb_build_object('total_pool', 0)
    );
  END IF;

  -- ============================================
  -- Determine winning side (higher pool wins)
  -- ============================================
  IF v_battle.pool_left > v_battle.pool_right THEN
    v_winning_side := 'left';
    v_winning_pool := v_battle.pool_left;
    v_losing_pool := v_battle.pool_right;
  ELSIF v_battle.pool_right > v_battle.pool_left THEN
    v_winning_side := 'right';
    v_winning_pool := v_battle.pool_right;
    v_losing_pool := v_battle.pool_left;
  ELSE
    -- TIE: Refund everyone
    FOR v_voter IN (
      SELECT user_id, amount FROM votes WHERE battle_id = p_battle_id
    ) LOOP
      -- Refund stake
      UPDATE users 
      SET points = points + v_voter.amount,
          updated_at = NOW()
      WHERE id = v_voter.user_id;
      
      -- Log refund
      INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
      VALUES (v_voter.user_id, v_voter.amount, 'battle_won', p_battle_id, 'Tie - stake refunded');
    END LOOP;
    
    UPDATE battles SET status = 'closed' WHERE id = p_battle_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Battle tied - all stakes refunded',
      'data', jsonb_build_object(
        'result', 'tie',
        'total_pool', v_total_pool,
        'refunded', v_total_pool
      )
    );
  END IF;

  -- ============================================
  -- Calculate distributions
  -- ============================================
  
  -- 1. Platform tax (5%)
  v_tax := FLOOR(v_total_pool * v_tax_rate);
  v_net_pool := v_total_pool - v_tax;

  -- 2. KUBU Multiplier: Check ratio for burn
  v_ratio := (v_winning_pool::NUMERIC / v_total_pool) * 100;
  
  IF v_ratio > 90 THEN
    v_burn_rate := 0.50;  -- 50% profit burn when ratio > 90:10
  END IF;

  -- 3. Count winners
  SELECT COUNT(*) INTO v_winner_count
  FROM votes
  WHERE battle_id = p_battle_id AND side = v_winning_side;

  IF v_winner_count = 0 THEN
    -- Edge case: no winners (shouldn't happen, but safety check)
    UPDATE battles SET status = 'closed' WHERE id = p_battle_id;
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No winners found',
      'data', jsonb_build_object('tax_collected', v_tax)
    );
  END IF;

  -- 4. Calculate base share per winner
  v_share_per_winner := v_net_pool::NUMERIC / v_winner_count;

  -- 5. Apply burn to profit portion if applicable
  IF v_burn_rate > 0 THEN
    -- Each winner: stake (2) + (profit * (1 - burn_rate))
    -- profit = share - stake
    DECLARE
      v_profit_per_winner NUMERIC;
      v_burned_per_winner NUMERIC;
    BEGIN
      v_profit_per_winner := v_share_per_winner - 2;
      IF v_profit_per_winner > 0 THEN
        v_burned_per_winner := v_profit_per_winner * v_burn_rate;
        v_share_per_winner := 2 + (v_profit_per_winner - v_burned_per_winner);
        v_burn_amount := FLOOR(v_burned_per_winner * v_winner_count);
      END IF;
    END;
  END IF;

  -- ============================================
  -- Distribute to all voters
  -- ============================================
  FOR v_voter IN (
    SELECT user_id, side, amount
    FROM votes
    WHERE battle_id = p_battle_id
  ) LOOP
    IF v_voter.side = v_winning_side THEN
      -- WINNER: Give payout
      v_payout := FLOOR(v_share_per_winner);
      v_total_distributed := v_total_distributed + v_payout;
      
      UPDATE users 
      SET 
        points = points + v_payout,
        stats = jsonb_set(
          stats, 
          '{wins}', 
          to_jsonb(COALESCE((stats->>'wins')::int, 0) + 1)
        ),
        updated_at = NOW()
      WHERE id = v_voter.user_id;
      
      INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
      VALUES (
        v_voter.user_id, 
        v_payout, 
        'battle_won', 
        p_battle_id, 
        format('Won battle - payout: %s points (ratio: %s%%)', v_payout, ROUND(v_ratio, 1))
      );
    ELSE
      -- LOSER: Update stats only (points already deducted when voting)
      UPDATE users 
      SET 
        stats = jsonb_set(
          stats, 
          '{losses}', 
          to_jsonb(COALESCE((stats->>'losses')::int, 0) + 1)
        ),
        updated_at = NOW()
      WHERE id = v_voter.user_id;
      
      INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
      VALUES (
        v_voter.user_id, 
        0, 
        'battle_lost', 
        p_battle_id, 
        format('Lost battle - %s side won', v_winning_side)
      );
    END IF;
  END LOOP;

  -- Log tax (using battle creator as reference)
  INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
  VALUES (
    v_battle.creator_id,
    v_tax,
    'tax',
    p_battle_id,
    format('Platform 5%% tax collected: %s points', v_tax)
  );

  -- Log burn if applicable
  IF v_burn_amount > 0 THEN
    INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
    VALUES (
      v_battle.creator_id,
      v_burn_amount,
      'burn',
      p_battle_id,
      format('KUBU Multiplier burn (ratio %s%% > 90%%): %s points', ROUND(v_ratio, 1), v_burn_amount)
    );
  END IF;

  -- Close battle
  UPDATE battles SET status = 'closed' WHERE id = p_battle_id;

  -- Return settlement summary
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Battle settled successfully',
    'data', jsonb_build_object(
      'battle_id', p_battle_id,
      'winning_side', v_winning_side,
      'total_pool', v_total_pool,
      'tax', v_tax,
      'burn_rate', v_burn_rate,
      'burn_amount', v_burn_amount,
      'winners_count', v_winner_count,
      'ratio', ROUND(v_ratio, 2),
      'share_per_winner', FLOOR(v_share_per_winner),
      'total_distributed', v_total_distributed
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Settlement failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION settle_battle IS 'Settle a battle: calculate winnings, apply tax/burn, distribute to winners';

-- ============================================
-- CAN CREATE BATTLE (Incubation Check)
-- ============================================
CREATE OR REPLACE FUNCTION can_create_battle()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_votes_cast INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE((stats->>'votes_cast')::int, 0) INTO v_votes_cast
  FROM users
  WHERE id = v_user_id;

  RETURN COALESCE(v_votes_cast >= 10, FALSE);
END;
$$;

COMMENT ON FUNCTION can_create_battle IS 'Check if user has cast at least 10 votes (incubation requirement)';

-- ============================================
-- CREATE BATTLE
-- Wrapper with incubation validation
-- ============================================
CREATE OR REPLACE FUNCTION create_battle(
  p_title VARCHAR(30),
  p_description VARCHAR(100),
  p_left_side TEXT,
  p_right_side TEXT,
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_votes_cast INTEGER;
  v_battle_id UUID;
  v_ends_at TIMESTAMPTZ;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate inputs
  IF LENGTH(TRIM(p_title)) < 3 THEN
    RAISE EXCEPTION 'Title must be at least 3 characters';
  END IF;

  IF LENGTH(TRIM(p_left_side)) < 1 OR LENGTH(TRIM(p_right_side)) < 1 THEN
    RAISE EXCEPTION 'Both sides must have content';
  END IF;

  IF p_duration_hours < 1 OR p_duration_hours > 168 THEN  -- Max 1 week
    RAISE EXCEPTION 'Duration must be between 1 and 168 hours';
  END IF;

  -- Check incubation requirement
  SELECT COALESCE((stats->>'votes_cast')::int, 0) INTO v_votes_cast
  FROM users
  WHERE id = v_user_id;

  IF v_votes_cast < 10 THEN
    RAISE EXCEPTION 'Incubation requirement not met. You need at least 10 votes to create a battle. Current: % votes', v_votes_cast;
  END IF;

  -- Calculate end time
  v_ends_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;

  -- Create the battle
  INSERT INTO battles (
    creator_id, 
    title, 
    description, 
    left_side, 
    right_side, 
    status,
    ends_at
  )
  VALUES (
    v_user_id, 
    TRIM(p_title), 
    TRIM(p_description), 
    TRIM(p_left_side), 
    TRIM(p_right_side),
    'active',  -- Start as active immediately
    v_ends_at
  )
  RETURNING id INTO v_battle_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Battle created successfully',
    'data', jsonb_build_object(
      'battle_id', v_battle_id,
      'title', TRIM(p_title),
      'ends_at', v_ends_at,
      'duration_hours', p_duration_hours
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

COMMENT ON FUNCTION create_battle IS 'Create a new battle with incubation check (requires 10+ votes)';

-- ============================================
-- AUTO SETTLE EXPIRED BATTLES
-- Called by pg_cron or external scheduler
-- ============================================
CREATE OR REPLACE FUNCTION auto_settle_expired_battles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
  v_settled_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_battle_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Find and lock expired active battles
  FOR v_battle IN (
    SELECT id, title
    FROM battles 
    WHERE status = 'active' 
      AND ends_at <= NOW()
    FOR UPDATE SKIP LOCKED
    LIMIT 100  -- Process in batches
  ) LOOP
    BEGIN
      PERFORM settle_battle(v_battle.id);
      v_settled_count := v_settled_count + 1;
      v_battle_ids := array_append(v_battle_ids, v_battle.id);
    EXCEPTION
      WHEN OTHERS THEN
        v_failed_count := v_failed_count + 1;
        RAISE WARNING 'Failed to settle battle %: %', v_battle.id, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Settled %s battles, %s failed', v_settled_count, v_failed_count),
    'data', jsonb_build_object(
      'settled_count', v_settled_count,
      'failed_count', v_failed_count,
      'battle_ids', v_battle_ids
    )
  );
END;
$$;

COMMENT ON FUNCTION auto_settle_expired_battles IS 'Batch settle all expired battles - call via cron';

-- ============================================
-- GET USER STATS
-- Helper function to get formatted user stats
-- ============================================
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_user RECORD;
  v_rank INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required';
  END IF;

  SELECT * INTO v_user
  FROM users
  WHERE id = v_user_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate rank by points
  SELECT COUNT(*) + 1 INTO v_rank
  FROM users
  WHERE points > v_user.points;

  RETURN jsonb_build_object(
    'user_id', v_user.id,
    'tier', v_user.tier,
    'title', v_user.title,
    'points', v_user.points,
    'rank', v_rank,
    'wins', COALESCE((v_user.stats->>'wins')::int, 0),
    'losses', COALESCE((v_user.stats->>'losses')::int, 0),
    'votes_cast', COALESCE((v_user.stats->>'votes_cast')::int, 0),
    'win_rate', CASE 
      WHEN COALESCE((v_user.stats->>'wins')::int, 0) + COALESCE((v_user.stats->>'losses')::int, 0) > 0
      THEN ROUND(
        (COALESCE((v_user.stats->>'wins')::int, 0)::NUMERIC / 
        (COALESCE((v_user.stats->>'wins')::int, 0) + COALESCE((v_user.stats->>'losses')::int, 0))) * 100, 
        1
      )
      ELSE 0
    END,
    'can_create_battle', COALESCE((v_user.stats->>'votes_cast')::int, 0) >= 10
  );
END;
$$;

COMMENT ON FUNCTION get_user_stats IS 'Get comprehensive user statistics including rank and win rate';

-- ============================================
-- GET BATTLE DETAILS
-- Helper function for battle with vote counts
-- ============================================
CREATE OR REPLACE FUNCTION get_battle_details(p_battle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
  v_left_votes INTEGER;
  v_right_votes INTEGER;
  v_user_vote TEXT;
BEGIN
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id;

  IF v_battle IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;

  -- Count voters per side
  SELECT COUNT(*) INTO v_left_votes
  FROM votes WHERE battle_id = p_battle_id AND side = 'left';

  SELECT COUNT(*) INTO v_right_votes
  FROM votes WHERE battle_id = p_battle_id AND side = 'right';

  -- Get current user's vote if authenticated
  IF auth.uid() IS NOT NULL THEN
    SELECT side INTO v_user_vote
    FROM votes 
    WHERE battle_id = p_battle_id AND user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'id', v_battle.id,
    'title', v_battle.title,
    'description', v_battle.description,
    'left_side', v_battle.left_side,
    'right_side', v_battle.right_side,
    'status', v_battle.status,
    'pool_left', v_battle.pool_left,
    'pool_right', v_battle.pool_right,
    'total_pool', v_battle.pool_left + v_battle.pool_right,
    'votes_left', v_left_votes,
    'votes_right', v_right_votes,
    'ends_at', v_battle.ends_at,
    'created_at', v_battle.created_at,
    'creator_id', v_battle.creator_id,
    'user_vote', v_user_vote,
    'time_remaining', EXTRACT(EPOCH FROM (v_battle.ends_at - NOW()))::INTEGER
  );
END;
$$;

COMMENT ON FUNCTION get_battle_details IS 'Get battle with vote counts and user participation status';
