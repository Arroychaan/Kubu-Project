-- ============================================
-- KUBU Row Level Security Policies
-- Migration: 002_rls_policies
-- Description: Secure access patterns for all tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Anyone can view user profiles (for leaderboard, battle creator info)
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  USING (true);

-- Users can only update their own non-sensitive fields
-- IMPORTANT: points cannot be updated directly!
CREATE POLICY "users_update_own_profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Points must remain unchanged (use RPC for point operations)
    AND points = (SELECT points FROM users WHERE id = auth.uid())
    -- Stats must remain unchanged (use RPC for stat updates)
    AND stats = (SELECT stats FROM users WHERE id = auth.uid())
  );

-- No direct insert (handled by trigger on auth.users)
CREATE POLICY "users_insert_denied"
  ON users FOR INSERT
  WITH CHECK (false);

-- No direct delete
CREATE POLICY "users_delete_denied"
  ON users FOR DELETE
  USING (false);

-- ============================================
-- BATTLES TABLE POLICIES
-- ============================================

-- Anyone can view battles
CREATE POLICY "battles_select_public"
  ON battles FOR SELECT
  USING (true);

-- Authenticated users can create battles (incubation checked in RPC)
CREATE POLICY "battles_insert_authenticated"
  ON battles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = creator_id
  );

-- Only battle creator can update (but not pools - those are RPC only)
CREATE POLICY "battles_update_creator"
  ON battles FOR UPDATE
  USING (auth.uid() = creator_id AND status = 'queue')
  WITH CHECK (
    auth.uid() = creator_id
    -- Cannot change pools directly
    AND pool_left = (SELECT pool_left FROM battles WHERE id = battles.id)
    AND pool_right = (SELECT pool_right FROM battles WHERE id = battles.id)
    -- Cannot change status directly (only via RPC)
    AND status = (SELECT status FROM battles WHERE id = battles.id)
  );

-- Creators can delete only queued battles
CREATE POLICY "battles_delete_creator_queue"
  ON battles FOR DELETE
  USING (auth.uid() = creator_id AND status = 'queue');

-- ============================================
-- VOTES TABLE POLICIES
-- ============================================

-- Users can view all votes (for transparency)
CREATE POLICY "votes_select_public"
  ON votes FOR SELECT
  USING (true);

-- NO direct insert - must use vote_transaction RPC
CREATE POLICY "votes_insert_denied"
  ON votes FOR INSERT
  WITH CHECK (false);

-- No updates to votes
CREATE POLICY "votes_update_denied"
  ON votes FOR UPDATE
  USING (false);

-- No deletes
CREATE POLICY "votes_delete_denied"
  ON votes FOR DELETE
  USING (false);

-- ============================================
-- POINT TRANSACTIONS TABLE POLICIES
-- ============================================

-- Users can only view their own transaction history
CREATE POLICY "point_transactions_select_own"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- NO direct insert - only via RPC functions
CREATE POLICY "point_transactions_insert_denied"
  ON point_transactions FOR INSERT
  WITH CHECK (false);

-- No updates
CREATE POLICY "point_transactions_update_denied"
  ON point_transactions FOR UPDATE
  USING (false);

-- No deletes
CREATE POLICY "point_transactions_delete_denied"
  ON point_transactions FOR DELETE
  USING (false);

-- ============================================
-- COMMENTS TABLE POLICIES
-- ============================================

-- Anyone can view comments
CREATE POLICY "comments_select_public"
  ON comments FOR SELECT
  USING (true);

-- Authenticated users can insert (through Edge Function)
CREATE POLICY "comments_insert_authenticated"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "comments_delete_own"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- No updates to comments
CREATE POLICY "comments_update_denied"
  ON comments FOR UPDATE
  USING (false);

-- ============================================
-- SERVICE ROLE BYPASS
-- For RPC functions running as SECURITY DEFINER
-- ============================================
-- Note: RPC functions with SECURITY DEFINER bypass RLS
-- This is intentional for atomic operations like vote_transaction
