-- ============================================
-- KUBU Database Schema
-- Migration: 001_create_tables
-- Description: Core tables for KUBU voting platform
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Stores user profiles, tiers, points, and stats
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'elite')),
  points INTEGER NOT NULL DEFAULT 50 CHECK (points >= 0),
  stats JSONB NOT NULL DEFAULT '{"wins": 0, "losses": 0, "votes_cast": 0}'::jsonb,
  device_hash TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles for KUBU voting platform';
COMMENT ON COLUMN users.tier IS 'User tier: free or elite';
COMMENT ON COLUMN users.points IS 'User point balance, cannot go negative';
COMMENT ON COLUMN users.stats IS 'JSONB stats: wins, losses, votes_cast';
COMMENT ON COLUMN users.device_hash IS 'Device fingerprint for fraud prevention';
COMMENT ON COLUMN users.title IS 'Custom user title/badge';

-- ============================================
-- BATTLES TABLE
-- Stores voting battles with pools and lifecycle
-- ============================================
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(30) NOT NULL,
  description VARCHAR(100),
  left_side TEXT NOT NULL,
  right_side TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queue' CHECK (status IN ('queue', 'active', 'closed')),
  pool_left INTEGER NOT NULL DEFAULT 0 CHECK (pool_left >= 0),
  pool_right INTEGER NOT NULL DEFAULT 0 CHECK (pool_right >= 0),
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE battles IS 'Voting battles with two sides and point pools';
COMMENT ON COLUMN battles.status IS 'Battle lifecycle: queue -> active -> closed';
COMMENT ON COLUMN battles.pool_left IS 'Total points staked on left side';
COMMENT ON COLUMN battles.pool_right IS 'Total points staked on right side';

-- ============================================
-- VOTES TABLE
-- Records user votes with composite PK to prevent double voting
-- ============================================
CREATE TABLE votes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('left', 'right')),
  amount INTEGER NOT NULL DEFAULT 2 CHECK (amount = 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, battle_id)
);

COMMENT ON TABLE votes IS 'User votes on battles - composite PK prevents double voting';
COMMENT ON COLUMN votes.side IS 'Side voted for: left or right';
COMMENT ON COLUMN votes.amount IS 'Points staked, always 2';

-- ============================================
-- POINT TRANSACTIONS TABLE
-- Audit log for every point movement (mandatory)
-- ============================================
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vote_placed', 'battle_won', 'battle_lost', 'signup_bonus', 'tax', 'burn', 'admin_adjustment')),
  battle_id UUID REFERENCES battles(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE point_transactions IS 'Audit log for all point movements';
COMMENT ON COLUMN point_transactions.type IS 'Transaction type for categorization';
COMMENT ON COLUMN point_transactions.amount IS 'Positive for credit, negative for debit';

-- ============================================
-- COMMENTS TABLE (for Clown Filter)
-- Stores comments with toxicity filtering
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  displayed_text TEXT NOT NULL,
  is_toxic BOOLEAN NOT NULL DEFAULT FALSE,
  toxicity_score NUMERIC(4,3) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS 'Battle comments with clown filter applied';
COMMENT ON COLUMN comments.displayed_text IS 'Shows 🤡 if toxic, otherwise original_text';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_points ON users(points DESC);

CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_ends_at ON battles(ends_at) WHERE status = 'active';
CREATE INDEX idx_battles_creator ON battles(creator_id);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);

CREATE INDEX idx_votes_battle_id ON votes(battle_id);
CREATE INDEX idx_votes_side ON votes(battle_id, side);

CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_battle_id ON point_transactions(battle_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);

CREATE INDEX idx_comments_battle_id ON comments(battle_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
