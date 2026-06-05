-- Migration 008: Topup Function
-- Description: Function to allow users to add points (Simulated Purchase)

CREATE OR REPLACE FUNCTION topup_points(
  p_amount INTEGER,
  p_pack_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_points INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check Authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock User Row
  SELECT points INTO v_current_points
  FROM users
  WHERE id = v_user_id
  FOR UPDATE;

  -- Calculate
  v_new_balance := v_current_points + p_amount;

  -- Update User
  UPDATE users
  SET 
    points = v_new_balance,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Log Transaction
  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (
    v_user_id, 
    p_amount, 
    'admin_adjustment', -- Using admin_adjustment or create new type 'topup'
    'Purchased: ' || p_pack_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'message', 'Successfully recharged ' || p_amount || ' points!'
  );
END;
$$;
