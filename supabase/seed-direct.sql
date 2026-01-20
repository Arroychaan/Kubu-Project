-- ============================================
-- KUBU Seed Battles - Direct SQL Insert (v2)
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard > SQL Editor)
-- ============================================

-- ============================================
-- STEP 1: Create dummy auth users (if not exists)
-- ============================================
DO $$
BEGIN
  INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    instance_id,
    aud,
    role
  )
  VALUES 
    ('00000000-0000-0000-0000-000000000001', 'dummy1@kubu.id', '', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000002', 'dummy2@kubu.id', '', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000003', 'dummy3@kubu.id', '', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000004', 'dummy4@kubu.id', '', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000005', 'dummy5@kubu.id', '', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'auth.users insert skipped: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Insert dummy users into public.users
-- ============================================
INSERT INTO users (id, tier, points, stats, title)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'elite', 500, '{"wins": 15, "losses": 5, "votes_cast": 120}'::jsonb, 'Battle Master'),
  ('00000000-0000-0000-0000-000000000002', 'free', 150, '{"wins": 8, "losses": 12, "votes_cast": 85}'::jsonb, 'Voter Pro'),
  ('00000000-0000-0000-0000-000000000003', 'elite', 320, '{"wins": 22, "losses": 8, "votes_cast": 200}'::jsonb, 'Champion'),
  ('00000000-0000-0000-0000-000000000004', 'free', 80, '{"wins": 3, "losses": 7, "votes_cast": 45}'::jsonb, 'Rookie'),
  ('00000000-0000-0000-0000-000000000005', 'free', 200, '{"wins": 10, "losses": 10, "votes_cast": 100}'::jsonb, 'Balanced Warrior')
ON CONFLICT (id) DO UPDATE SET
  tier = EXCLUDED.tier,
  points = EXCLUDED.points,
  stats = EXCLUDED.stats,
  title = EXCLUDED.title;

-- ============================================
-- STEP 3: Insert 5 dummy battles
-- NOTE: ALL battles use FUTURE end times to pass trigger validation
-- We'll update the closed battle's status separately
-- ============================================
INSERT INTO battles (id, creator_id, title, description, left_side, right_side, status, pool_left, pool_right, ends_at, created_at)
VALUES 
  -- BATTLE 1: Tech Giants Battle (ACTIVE)
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'iPhone vs Android',
    'Mana yang lebih worth it untuk HP flagship di 2026?',
    'iPhone 18 Pro',
    'Samsung Galaxy S26 Ultra',
    'active',
    156, 142,
    NOW() + INTERVAL '23 hours',
    NOW() - INTERVAL '1 hour'
  ),
  -- BATTLE 2: Indonesian Food Battle (ACTIVE)
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Indomie vs Mi Sedaap',
    'Perang abadi mie instan Indonesia! Mana juaranya?',
    'Indomie Goreng',
    'Mi Sedaap Goreng',
    'active',
    284, 98,
    NOW() + INTERVAL '18 hours',
    NOW() - INTERVAL '6 hours'
  ),
  -- BATTLE 3: Gaming Console Battle (ACTIVE)
  (
    'b0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'PS5 Pro vs Xbox Series X2',
    'Console war 2026! Siapa yang menang?',
    'PlayStation 5 Pro',
    'Xbox Series X2',
    'active',
    178, 166,
    NOW() + INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  ),
  -- BATTLE 4: Coffee Shop Battle (QUEUE - incubating)
  (
    'b0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'Starbucks vs Kopi Kenangan',
    'Coffee shop mana yang jadi favorit anak muda?',
    'Starbucks',
    'Kopi Kenangan',
    'queue',
    12, 8,
    NOW() + INTERVAL '48 hours',
    NOW() - INTERVAL '30 minutes'
  ),
  -- BATTLE 5: Transportation Battle (will be CLOSED - insert with future time first)
  (
    'b0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    'Gojek vs Grab',
    'Ojol legend! Mana yang lebih reliable?',
    'Gojek',
    'Grab',
    'active',  -- Insert as active first
    312, 288,
    NOW() + INTERVAL '1 hour',  -- Future time to pass validation
    NOW() - INTERVAL '26 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  left_side = EXCLUDED.left_side,
  right_side = EXCLUDED.right_side,
  pool_left = EXCLUDED.pool_left,
  pool_right = EXCLUDED.pool_right;

-- ============================================
-- STEP 4: Update Battle 5 to CLOSED status
-- (This bypasses the insert trigger since it's an UPDATE)
-- ============================================
UPDATE battles 
SET status = 'closed', ends_at = NOW() - INTERVAL '2 hours'
WHERE id = 'b0000000-0000-0000-0000-000000000005';

-- ============================================
-- STEP 5: Insert sample votes
-- ============================================
INSERT INTO votes (user_id, battle_id, side, amount, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'left', 2, NOW() - INTERVAL '45 minutes'),
  ('00000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'right', 2, NOW() - INTERVAL '30 minutes'),
  ('00000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'left', 2, NOW() - INTERVAL '20 minutes'),
  ('00000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'right', 2, NOW() - INTERVAL '10 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'left', 2, NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'left', 2, NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'right', 2, NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'left', 2, NOW() - INTERVAL '11 hours'),
  ('00000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'right', 2, NOW() - INTERVAL '10 hours')
ON CONFLICT (user_id, battle_id) DO NOTHING;

-- ============================================
-- STEP 6: Insert sample comments (with Clown Filter demo!)
-- ============================================
INSERT INTO comments (user_id, battle_id, original_text, displayed_text, is_toxic, toxicity_score, created_at)
VALUES
  -- Battle 1 comments
  ('00000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 
   'iPhone for the win! Ecosystem Apple ga ada lawan 🍎', 
   'iPhone for the win! Ecosystem Apple ga ada lawan 🍎', false, 0.05, NOW() - INTERVAL '40 minutes'),
  ('00000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'Android lebih worth it sih, spec lebih tinggi dengan harga sama', 
   'Android lebih worth it sih, spec lebih tinggi dengan harga sama', false, 0.02, NOW() - INTERVAL '25 minutes'),
  ('00000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Yang penting bisa WA sama IG mah sama aja wkwk 🤣', 
   'Yang penting bisa WA sama IG mah sama aja wkwk 🤣', false, 0.01, NOW() - INTERVAL '15 minutes'),
  -- Battle 2 comments
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
   'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥', 
   'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥', false, 0.08, NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'Indomie = agama. Case closed. 🙏', 
   'Indomie = agama. Case closed. 🙏', false, 0.15, NOW() - INTERVAL '1 hour'),
  -- Battle 3 comments (including TOXIC one!)
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
   'PS5 exclusive games nya ga ada lawan! God of War, Spider-Man 🎮', 
   'PS5 exclusive games nya ga ada lawan! God of War, Spider-Man 🎮', false, 0.04, NOW() - INTERVAL '10 hours'),
  ('00000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003',
   'Xbox Game Pass >>> Everything. Value for money banget!', 
   'Xbox Game Pass >>> Everything. Value for money banget!', false, 0.02, NOW() - INTERVAL '9 hours'),
  -- 🤡 CLOWN FILTERED COMMENT! 🤡
  ('00000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
   'Yang pilih Xbox itu tolol semua, ga ngerti gaming!', 
   '🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡', true, 0.89, NOW() - INTERVAL '5 hours');

-- ============================================
-- ✅ VERIFICATION: Check inserted data
-- ============================================
SELECT 'Users' as table_name, COUNT(*) as count FROM users WHERE id::text LIKE '00000000%'
UNION ALL
SELECT 'Battles' as table_name, COUNT(*) as count FROM battles WHERE id::text LIKE 'b0000000%'
UNION ALL
SELECT 'Votes' as table_name, COUNT(*) as count FROM votes WHERE battle_id::text LIKE 'b0000000%'
UNION ALL
SELECT 'Comments' as table_name, COUNT(*) as count FROM comments WHERE battle_id::text LIKE 'b0000000%';

-- ✅ DONE! 5 dummy battles seeded successfully.
