-- ============================================
-- Migration: 011_anti_bandwagon
-- Description: Implement "Time-Decay Rewards" to prevent last-minute bandwagoning.
-- Logic:
--   - Early Voters (First 50% of battle): Full Reward (+5 PTS)
--   - Mid Voters (50% - 90% of battle): Partial Reward (+2 PTS)
--   - Late Snipers (Last 10%): Minimal Reward (+1 PT)
-- ============================================

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
  v_bonus INTEGER;
  v_total_distributed INTEGER := 0;
  v_winner_count INTEGER := 0;
  
  -- Timing variables
  v_battle_duration INTERVAL;
  v_vote_relative_time INTERVAL;
  v_time_percent NUMERIC; -- 0.0 to 1.0 (Location of vote in timeline)

BEGIN
  -- Lock and owner check
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle IS NULL THEN RAISE EXCEPTION 'Battle not found'; END IF;
  IF v_battle.status = 'closed' THEN RAISE EXCEPTION 'Battle already closed'; END IF;

  -- 1. Determine Winning Side
  IF v_battle.pool_left > v_battle.pool_right THEN
    v_winning_side := 'left';
  ELSIF v_battle.pool_right > v_battle.pool_left THEN
    v_winning_side := 'right';
  ELSE
    v_winning_side := 'tie';
  END IF;

  -- Calculate Total Battle Duration
  v_battle_duration := v_battle.ends_at - v_battle.created_at;

  -- 2. Distribute Rewards with Anti-Bandwagon Logic
  FOR v_voter IN (
    SELECT user_id, side, amount, created_at FROM votes WHERE battle_id = p_battle_id
  ) LOOP
    
    -- Handle TIE (Refund)
    IF v_winning_side = 'tie' THEN
       v_payout := v_voter.amount;
       UPDATE users SET points = points + v_payout WHERE id = v_voter.user_id;
       INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
       VALUES (v_voter.user_id, v_payout, 'battle_refund', p_battle_id, 'Tie Refund');
    
    -- Handle WINNER
    ELSIF v_voter.side = v_winning_side THEN
       
       -- CALCULATE TIME BONUS (Anti-Bandwagon)
       -- How far into the battle did they vote?
       v_vote_relative_time := v_voter.created_at - v_battle.created_at;
       
       -- Safe division check
       IF EXTRACT(EPOCH FROM v_battle_duration) > 0 THEN
         v_time_percent := EXTRACT(EPOCH FROM v_vote_relative_time) / EXTRACT(EPOCH FROM v_battle_duration);
       ELSE
         v_time_percent := 0; -- Should not happen, but treat as early
       END IF;

       -- Determine Bonus based on timing
       IF v_time_percent <= 0.5 THEN
          v_bonus := 5; -- EARLY (First 50%): High Reward
       ELSIF v_time_percent <= 0.9 THEN
          v_bonus := 2; -- MID (50-90%): Medium Reward
       ELSE
          v_bonus := 1; -- LATE (Last 10%): Low Reward (Sniper Tax)
       END IF;

       v_payout := v_voter.amount + v_bonus;
       
       v_winner_count := v_winner_count + 1;
       v_total_distributed := v_total_distributed + v_payout;
       
       UPDATE users 
       SET points = points + v_payout,
           stats = jsonb_set(stats, '{wins}', to_jsonb(COALESCE((stats->>'wins')::int, 0) + 1))
       WHERE id = v_voter.user_id;

       -- Add context to the transaction log so user knows why
       INSERT INTO point_transactions (user_id, amount, type, battle_id, description)
       VALUES (
         v_voter.user_id, 
         v_payout, 
         'battle_won', 
         p_battle_id, 
         format('Won Battle (+%s Bonus) - Voted at %s%% duration', v_bonus, ROUND(v_time_percent * 100, 0))
       );

    -- Handle LOSER
    ELSE
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
