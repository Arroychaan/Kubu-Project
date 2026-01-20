-- ============================================
-- Migration: 010_update_costs_and_rewards
-- Description: 
-- 1. Reduce Create Battle cost to 10 PTS
-- 2. Simplify Win Reward to Fixed +5 PTS (Stake + 5)
-- ============================================

-- 1. UPDATE CREATE BATTLE (Cost 50 -> 10)
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
  v_user_points INTEGER;
  v_cost INTEGER := 10; -- UPDATED: Cost reduced to 10
  v_battle_id UUID;
  v_ends_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;

  -- Validate inputs (simplified)
  IF LENGTH(TRIM(p_title)) < 3 THEN RAISE EXCEPTION 'Title too short'; END IF;

  -- Check Incubation & Balance
  SELECT COALESCE((stats->>'votes_cast')::int, 0), points 
  INTO v_votes_cast, v_user_points
  FROM users
  WHERE id = v_user_id;

  IF v_votes_cast < 10 THEN
    RAISE EXCEPTION 'Need 10 votes to create battle.';
  END IF;

  IF v_user_points < v_cost THEN
    RAISE EXCEPTION 'Insufficient points. Cost: % pts. You have %.', v_cost, v_user_points;
  END IF;

  -- Deduct Fee
  UPDATE users SET points = points - v_cost WHERE id = v_user_id;
  
  -- Log Fee
  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (v_user_id, -v_cost, 'battle_fee', 'Created Battle: ' || p_title);

  -- Create Battle
  v_ends_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
  
  INSERT INTO battles (creator_id, title, description, left_side, right_side, status, ends_at)
  VALUES (v_user_id, p_title, p_description, p_left_side, p_right_side, 'active', v_ends_at)
  RETURNING id INTO v_battle_id;

  RETURN jsonb_build_object('success', true, 'battle_id', v_battle_id);
END;
$$;

-- 2. UPDATE SETTLE BATTLE (Reward = Stake + 5)
CREATE OR REPLACE FUNCTION settle_battle(p_battle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
  v_winning_side TEXT;
  v_voter RECORD;
  v_payout INTEGER;
  v_total_distributed INTEGER := 0;
  v_winner_count INTEGER := 0;
BEGIN
  -- Lock and get battle
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle IS NULL THEN RAISE EXCEPTION 'Battle not found'; END IF;
  IF v_battle.status = 'closed' THEN RAISE EXCEPTION 'Battle already closed'; END IF;

  -- Determine Winner
  IF v_battle.pool_left > v_battle.pool_right THEN
    v_winning_side := 'left';
  ELSIF v_battle.pool_right > v_battle.pool_left THEN
    v_winning_side := 'right';
  ELSE
    v_winning_side := 'tie';
  END IF;

  -- Distribute
  FOR v_voter IN (
    SELECT user_id, side, amount FROM votes WHERE battle_id = p_battle_id
  ) LOOP
    IF v_winning_side = 'tie' THEN
       -- Refund
       v_payout := v_voter.amount;
       UPDATE users SET points = points + v_payout WHERE id = v_voter.user_id;
       INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
       VALUES (v_voter.user_id, v_payout, 'battle_refund', p_battle_id, 'Tie Refund');
    ELSIF v_voter.side = v_winning_side THEN
       -- WINNER: Stake + 5 Bonus
       v_payout := v_voter.amount + 5; -- UPDATED: Exact +5 profit logic
       v_winner_count := v_winner_count + 1;
       v_total_distributed := v_total_distributed + v_payout;
       
       UPDATE users 
       SET points = points + v_payout,
           stats = jsonb_set(stats, '{wins}', to_jsonb(COALESCE((stats->>'wins')::int, 0) + 1))
       WHERE id = v_voter.user_id;

       INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
       VALUES (v_voter.user_id, v_payout, 'battle_won', p_battle_id, 'Won Battle (+5 Bonus)');
    ELSE
       -- LOSER: 0 (Already paid)
       UPDATE users 
       SET stats = jsonb_set(stats, '{losses}', to_jsonb(COALESCE((stats->>'losses')::int, 0) + 1))
       WHERE id = v_voter.user_id;
       
       INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
       VALUES (v_voter.user_id, 0, 'battle_lost', p_battle_id, 'Lost Battle');
    END IF;
  END LOOP;

  -- Close Battle
  UPDATE battles SET status = 'closed' WHERE id = p_battle_id;

  RETURN jsonb_build_object(
    'success', true, 
    'winning_side', v_winning_side,
    'winners', v_winner_count,
    'distributed', v_total_distributed
  );
END;
$$;
