-- ============================================
-- KUBU Seed Data Part 2
-- Migration: 009_more_dummy_battles
-- Description: 10 ADDITIONAL battles for testing vertical scroll & filtering
-- ============================================

-- Use existing dummy creator '00000000-0000-0000-0000-000000000001'

-- 1. Programming Languages
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 
  'React vs Vue', 'Battle of the frontend frameworks! Mana yang lebih enak DX-nya?', 
  'React', 'Vue', 'active', 
  310, 245, 
  NOW() + INTERVAL '5 days', NOW()
);

-- 2. Movies
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 
  'Marvel vs DC', 'Universe mana yang lebih solid story-nya?', 
  'Marvel MCU', 'DC Universe', 'active', 
  500, 120, 
  NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day'
);

-- 3. Sneakers
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 
  'Nike vs Adidas', 'Sneakerhead assemble! Swoosh or Stripes?', 
  'Nike', 'Adidas', 'active', 
  880, 810, 
  NOW() + INTERVAL '7 days', NOW() - INTERVAL '4 hours'
);

-- 4. Operating Systems
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 
  'Windows vs MacOS', 'OS War! Productivity vs Stability?', 
  'Windows 12', 'MacOS Sequoia', 'active', 
  120, 300, 
  NOW() + INTERVAL '12 hours', NOW() - INTERVAL '2 days'
);

-- 5. K-Pop
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 
  'BLACKPINK vs TWICE', 'Queen of K-Pop 3rd Gen? BLINK or ONCE?', 
  'BLACKPINK', 'TWICE', 'active', 
  1500, 1480, -- Intense battle
  NOW() + INTERVAL '48 hours', NOW() - INTERVAL '5 hours'
);

-- 6. Football
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 
  'Ronaldo vs Messi', 'The GOAT debate finalized. CR7 or LM10?', 
  'Cristiano Ronaldo', 'Lionel Messi', 'active', 
  2200, 2300, 
  NOW() + INTERVAL '10 days', NOW() - INTERVAL '12 hours'
);

-- 7. Gaming
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 
  'Valorant vs CS2', 'FPS supremacy. Ability shooter or tactical purity?', 
  'Valorant', 'Counter-Strike 2', 'active', 
  45, 60, -- New battle
  NOW() + INTERVAL '30 days', NOW() - INTERVAL '10 minutes'
);

-- 8. E-commerce
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 
  'Shopee vs Tokopedia', 'Tempat belanja online paling nyaman & murah?', 
  'Shopee', 'Tokopedia', 'active', 
  300, 450, 
  NOW() + INTERVAL '24 hours', NOW() - INTERVAL '3 days'
);

-- 9. Social Media
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 
  'Twitter vs Threads', 'Microblogging king? X/Twitter or Zuck''s clone?', 
  'Twitter (X)', 'Threads', 'active', 
  80, 20, 
  NOW() + INTERVAL '2 days', NOW() - INTERVAL '8 hours'
);

-- 10. Anime
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at) VALUES (
  'c0000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 
  'One Piece vs Naruto', 'Anime The Big Three showdown!', 
  'One Piece', 'Naruto', 'active', 
  1200, 1100, 
  NOW() + INTERVAL '1 week', NOW() - INTERVAL '5 days'
);
