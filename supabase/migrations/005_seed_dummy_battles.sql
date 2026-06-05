-- ============================================
-- KUBU Seed Data
-- Migration: 005_seed_dummy_battles
-- Description: 5 example battles with dummy data
-- ============================================

-- Note: This seed assumes you have at least one user in the users table
-- If not, we'll create a dummy user first

-- Create dummy users for battles (if not exists)
INSERT INTO users (id, tier, points, stats, title)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'elite', 500, '{"wins": 15, "losses": 5, "votes_cast": 120}'::jsonb, 'Battle Master'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'free', 150, '{"wins": 8, "losses": 12, "votes_cast": 85}'::jsonb, 'Voter Pro'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'elite', 320, '{"wins": 22, "losses": 8, "votes_cast": 200}'::jsonb, 'Champion'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'free', 80, '{"wins": 3, "losses": 7, "votes_cast": 45}'::jsonb, 'Rookie'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'free', 200, '{"wins": 10, "losses": 10, "votes_cast": 100}'::jsonb, 'Balanced Warrior')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BATTLE 1: Tech Giants Battle (ACTIVE - Hot topic!)
-- ============================================
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'iPhone vs Android',
  'Mana yang lebih worth it untuk HP flagship di 2026?',
  'iPhone 18 Pro',
  'Samsung Galaxy S26 Ultra',
  'active',
  156,  -- 78 votes
  142,  -- 71 votes
  NOW() + INTERVAL '23 hours',
  NOW() - INTERVAL '1 hour'
);

-- ============================================
-- BATTLE 2: Indonesian Food Battle (ACTIVE - Classic debate!)
-- ============================================
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Indomie vs Mi Sedaap',
  'Perang abadi mie instan Indonesia! Mana juaranya?',
  'Indomie Goreng',
  'Mi Sedaap Goreng',
  'active',
  284,  -- 142 votes - Indomie cult is strong!
  98,   -- 49 votes
  NOW() + INTERVAL '18 hours',
  NOW() - INTERVAL '6 hours'
);

-- ============================================
-- BATTLE 3: Gaming Console Battle (ACTIVE - Gamers assemble!)
-- ============================================
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid,
  'PS5 Pro vs Xbox Series X2',
  'Console war 2026! Siapa yang menang?',
  'PlayStation 5 Pro',
  'Xbox Series X2',
  'active',
  178,  -- 89 votes
  166,  -- 83 votes - Neck to neck!
  NOW() + INTERVAL '12 hours',
  NOW() - INTERVAL '12 hours'
);

-- ============================================
-- BATTLE 4: Coffee Shop Battle (QUEUE - Waiting for votes!)
-- ============================================
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'Starbucks vs Kopi Kenangan',
  'Coffee shop mana yang jadi favorit anak muda?',
  'Starbucks',
  'Kopi Kenangan',
  'queue',
  12,  -- 6 votes - Still incubating
  8,   -- 4 votes
  NOW() + INTERVAL '48 hours',
  NOW() - INTERVAL '30 minutes'
);

-- ============================================
-- BATTLE 5: Transportation Battle (CLOSED - Finished battle!)
-- ============================================
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000005'::uuid,
  'Gojek vs Grab',
  'Ojol legend! Mana yang lebih reliable?',
  'Gojek',
  'Grab',
  'closed',
  312,  -- 156 votes - Winner!
  288,  -- 144 votes
  NOW() - INTERVAL '2 hours',  -- Already ended
  NOW() - INTERVAL '26 hours'
);

-- ============================================
-- ADD SAMPLE VOTES FOR ACTIVE BATTLES
-- ============================================

-- Votes for Battle 1 (iPhone vs Android)
INSERT INTO votes (user_id, battle_id, side, amount, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'left', 2, NOW() - INTERVAL '45 minutes'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'right', 2, NOW() - INTERVAL '30 minutes'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'left', 2, NOW() - INTERVAL '20 minutes'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'right', 2, NOW() - INTERVAL '10 minutes')
ON CONFLICT (user_id, battle_id) DO NOTHING;

-- Votes for Battle 2 (Indomie vs Mi Sedaap)
INSERT INTO votes (user_id, battle_id, side, amount, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'left', 2, NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'left', 2, NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'right', 2, NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'left', 2, NOW() - INTERVAL '2 hours')
ON CONFLICT (user_id, battle_id) DO NOTHING;

-- Votes for Battle 3 (PS5 vs Xbox)  
INSERT INTO votes (user_id, battle_id, side, amount, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid, 'left', 2, NOW() - INTERVAL '11 hours'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid, 'right', 2, NOW() - INTERVAL '10 hours'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid, 'left', 2, NOW() - INTERVAL '8 hours'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid, 'right', 2, NOW() - INTERVAL '6 hours')
ON CONFLICT (user_id, battle_id) DO NOTHING;

-- ============================================
-- ADD SAMPLE COMMENTS (BAKU HANTAM!)
-- ============================================

-- Comments for Battle 1 (iPhone vs Android)
INSERT INTO comments (id, user_id, battle_id, original_text, displayed_text, is_toxic, toxicity_score, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 
   'iPhone for the win! Ecosystem Apple ga ada lawan 🍎', 'iPhone for the win! Ecosystem Apple ga ada lawan 🍎', false, 0.05, NOW() - INTERVAL '40 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid,
   'Android lebih worth it sih, spec lebih tinggi dengan harga sama', 'Android lebih worth it sih, spec lebih tinggi dengan harga sama', false, 0.02, NOW() - INTERVAL '25 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid,
   'Yang penting bisa WA sama IG mah sama aja wkwk 🤣', 'Yang penting bisa WA sama IG mah sama aja wkwk 🤣', false, 0.01, NOW() - INTERVAL '15 minutes');

-- Comments for Battle 2 (Indomie vs Mi Sedaap)
INSERT INTO comments (id, user_id, battle_id, original_text, displayed_text, is_toxic, toxicity_score, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
   'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥', 'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥', false, 0.08, NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
   'Mi Sedaap lebih kenyal tbh, coba dulu baru judge', 'Mi Sedaap lebih kenyal tbh, coba dulu baru judge', false, 0.03, NOW() - INTERVAL '2 hours 30 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
   'Indomie = agama. Case closed. 🙏', 'Indomie = agama. Case closed. 🙏', false, 0.15, NOW() - INTERVAL '1 hour');

-- Comments for Battle 3 (PS5 vs Xbox) - With one toxic comment!
INSERT INTO comments (id, user_id, battle_id, original_text, displayed_text, is_toxic, toxicity_score, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
   'PS5 exclusive games nya ga ada lawan! God of War, Spider-Man, FF7 Rebirth 🎮', 'PS5 exclusive games nya ga ada lawan! God of War, Spider-Man, FF7 Rebirth 🎮', false, 0.04, NOW() - INTERVAL '10 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
   'Xbox Game Pass >>> Everything. Value for money banget!', 'Xbox Game Pass >>> Everything. Value for money banget!', false, 0.02, NOW() - INTERVAL '9 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
   'Yang pilih Xbox itu tolol semua, ga ngerti gaming!', '🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡', true, 0.89, NOW() - INTERVAL '5 hours');

-- ============================================
-- ADD POINT TRANSACTIONS FOR AUDIT TRAIL
-- ============================================

-- Signup bonuses for dummy users
INSERT INTO point_transactions (id, user_id, amount, type, description, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 50, 'signup_bonus', 'Welcome bonus!', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002'::uuid, 50, 'signup_bonus', 'Welcome bonus!', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, 50, 'signup_bonus', 'Welcome bonus!', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004'::uuid, 50, 'signup_bonus', 'Welcome bonus!', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005'::uuid, 50, 'signup_bonus', 'Welcome bonus!', NOW() - INTERVAL '10 days');

-- Vote transactions (deductions)
INSERT INTO point_transactions (id, user_id, amount, type, battle_id, description, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002'::uuid, -2, 'vote_placed', 'b0000000-0000-0000-0000-000000000001'::uuid, 'Voted on iPhone vs Android', NOW() - INTERVAL '45 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, -2, 'vote_placed', 'b0000000-0000-0000-0000-000000000001'::uuid, 'Voted on iPhone vs Android', NOW() - INTERVAL '30 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, -2, 'vote_placed', 'b0000000-0000-0000-0000-000000000002'::uuid, 'Voted on Indomie vs Mi Sedaap', NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, -2, 'vote_placed', 'b0000000-0000-0000-0000-000000000002'::uuid, 'Voted on Indomie vs Mi Sedaap', NOW() - INTERVAL '4 hours');

-- Battle win for closed battle
INSERT INTO point_transactions (id, user_id, amount, type, battle_id, description, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 8, 'battle_won', 'b0000000-0000-0000-0000-000000000005'::uuid, 'Won Gojek vs Grab battle! 🎉', NOW() - INTERVAL '2 hours');

-- ============================================
-- VERIFICATION QUERIES (Optional - run to verify)
-- ============================================
-- SELECT * FROM battles ORDER BY created_at DESC;
-- SELECT * FROM users WHERE id LIKE '00000000%';
-- SELECT * FROM votes;
-- SELECT * FROM comments;
-- SELECT * FROM point_transactions ORDER BY created_at DESC LIMIT 10;
