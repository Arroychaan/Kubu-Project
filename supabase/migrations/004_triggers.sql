-- ============================================
-- KUBU Triggers & Automation
-- Migration: 004_triggers
-- Description: Auto-triggers for user creation, timestamps, etc.
-- ============================================

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- Triggered when a new user signs up via Supabase Auth
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile with default values
  INSERT INTO public.users (
    id, 
    tier, 
    points, 
    stats,
    device_hash,
    title
  )
  VALUES (
    NEW.id,
    'free',
    50,  -- Signup bonus
    '{"wins": 0, "losses": 0, "votes_cast": 0}'::jsonb,
    NULL,
    NULL
  );
  
  -- Log signup bonus in transaction history
  INSERT INTO public.point_transactions (
    user_id, 
    amount, 
    type, 
    description
  )
  VALUES (
    NEW.id, 
    50, 
    'signup_bonus', 
    'Welcome bonus - 50 points'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Auto-create user profile with 50 point bonus on signup';

-- ============================================
-- AUTO-UPDATE UPDATED_AT TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to users table
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VALIDATE BATTLE BEFORE INSERT
-- Ensure battle has valid data
-- ============================================
CREATE OR REPLACE FUNCTION validate_battle_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure ends_at is in the future
  IF NEW.ends_at <= NOW() THEN
    RAISE EXCEPTION 'Battle end time must be in the future';
  END IF;
  
  -- Ensure title is not empty
  IF LENGTH(TRIM(NEW.title)) < 3 THEN
    RAISE EXCEPTION 'Battle title must be at least 3 characters';
  END IF;
  
  -- Ensure both sides have content
  IF LENGTH(TRIM(NEW.left_side)) < 1 OR LENGTH(TRIM(NEW.right_side)) < 1 THEN
    RAISE EXCEPTION 'Both battle sides must have content';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_battle_before_insert ON battles;
CREATE TRIGGER validate_battle_before_insert
  BEFORE INSERT ON battles
  FOR EACH ROW
  EXECUTE FUNCTION validate_battle_insert();

-- ============================================
-- PREVENT NEGATIVE POINTS
-- Extra safety layer
-- ============================================
CREATE OR REPLACE FUNCTION prevent_negative_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.points < 0 THEN
    RAISE EXCEPTION 'Points cannot be negative. Attempted: %', NEW.points;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_points_not_negative ON users;
CREATE TRIGGER check_points_not_negative
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_negative_points();

-- ============================================
-- AUTO-ACTIVATE QUEUED BATTLES
-- Optional: Move battles from queue to active
-- ============================================
CREATE OR REPLACE FUNCTION activate_queued_battle(p_battle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
BEGIN
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;
  
  IF v_battle IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;
  
  IF v_battle.status != 'queue' THEN
    RAISE EXCEPTION 'Battle is not in queue status';
  END IF;
  
  UPDATE battles
  SET status = 'active'
  WHERE id = p_battle_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Battle activated',
    'battle_id', p_battle_id
  );
END;
$$;

-- ============================================
-- REALTIME SUBSCRIPTIONS SETUP
-- Enable realtime for specific tables
-- ============================================

-- Enable realtime for battles (for live pool updates)
ALTER PUBLICATION supabase_realtime ADD TABLE battles;

-- Enable realtime for comments (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Note: votes table is intentionally NOT added to realtime
-- to prevent vote manipulation visibility
