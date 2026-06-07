-- ============================================
-- Migration: 017_homepage_eligibility
-- Description:
--   1. Tambahkan kolom kurasi is_featured dan is_hidden_from_home
--   2. Sembunyikan polling sampah/uji coba secara otomatis
--   3. Masukkan data seed jajak pendapat berkualitas tinggi beserta opini awal
-- ============================================

-- 1. Tambahkan kolom kurasi ke tabel public.polls
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS is_hidden_from_home BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.polls.is_featured IS 'Menandakan jika polling ini ditonjolkan di homepage';
COMMENT ON COLUMN public.polls.is_hidden_from_home IS 'Menandakan jika polling disembunyikan dari homepage publik';

-- 2. Sembunyikan polling sampah/uji coba yang ada secara otomatis
UPDATE public.polls 
SET is_hidden_from_home = true 
WHERE question ILIKE 'test%' 
   OR question ILIKE 'ad%' 
   OR question = 'ad' 
   OR question = 'sds'
   OR question = 'asd'
   OR length(trim(question)) < 10 
   OR length(trim(option_a)) < 2 
   OR length(trim(option_b)) < 2;

-- 3. Masukkan profil dummy kreator berkualitas jika belum ada
INSERT INTO public.profiles (id, username, avatar_url, points, is_admin)
VALUES 
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'analis_opini', null, 350, false),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'budi_wicaksono', null, 120, false),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'siti_rahma', null, 420, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Masukkan seed data jajak pendapat berkualitas tinggi baru jika belum ada

-- Seed Poll 1: Kerja Remote vs WFO
INSERT INTO public.polls (id, created_at, creator_id, question, option_a, option_b, is_official, is_featured)
VALUES (
  'p0000000-0000-0000-0000-000000000001'::uuid,
  NOW() - INTERVAL '4 hours',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Apakah menurutmu kerja remote (WFH) jauh lebih baik untuk produktivitas jangka panjang dibanding kerja kantor (WFO)?',
  'Mending Remote (WFH)',
  'Lebih Baik Kantor (WFO)',
  false,
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Poll 2: AI Label
INSERT INTO public.polls (id, created_at, creator_id, question, option_a, option_b, is_official, is_featured)
VALUES (
  'p0000000-0000-0000-0000-000000000002'::uuid,
  NOW() - INTERVAL '3 hours',
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Apakah semua konten gambar dan video buatan AI wajib diberi label watermark khusus?',
  'Wajib Diberi Label AI',
  'Bebas Tanpa Label khusus',
  false,
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Poll 3: Skill vs Ijazah
INSERT INTO public.polls (id, created_at, creator_id, question, option_a, option_b, is_official, is_featured)
VALUES (
  'p0000000-0000-0000-0000-000000000003'::uuid,
  NOW() - INTERVAL '2 hours',
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'Di dunia kerja modern sekarang, apakah skill praktis portofolio jauh lebih menentukan dibanding ijazah formal?',
  'Skill & Portofolio Utama',
  'Ijazah Formal Tetap Kunci',
  false,
  true
) ON CONFLICT (id) DO NOTHING;

-- 5. Masukkan vote records agar data integritas komentar terjaga
-- Poll 1 (Kerja Remote) votes
INSERT INTO public.votes (poll_id, user_id, choice, created_at)
VALUES 
  ('p0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'a', NOW() - INTERVAL '3 hours'),
  ('p0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'b', NOW() - INTERVAL '2.5 hours')
ON CONFLICT (poll_id, user_id) DO NOTHING;

-- Poll 2 (AI Label) votes
INSERT INTO public.votes (poll_id, user_id, choice, created_at)
VALUES 
  ('p0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'a', NOW() - INTERVAL '2 hours'),
  ('p0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'b', NOW() - INTERVAL '1.8 hours')
ON CONFLICT (poll_id, user_id) DO NOTHING;

-- Poll 3 (Skill vs Ijazah) votes
INSERT INTO public.votes (poll_id, user_id, choice, created_at)
VALUES 
  ('p0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'a', NOW() - INTERVAL '1 hour'),
  ('p0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'b', NOW() - INTERVAL '45 minutes')
ON CONFLICT (poll_id, user_id) DO NOTHING;

-- 6. Masukkan opini argumentatif teratas (comments)
-- Poll 1 comments
INSERT INTO public.comments (id, poll_id, user_id, choice, text, is_toxic, toxicity_score, created_at)
VALUES 
  (gen_random_uuid(), 'p0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'a', 'Kerja remote menghemat waktu perjalanan (commuting) yang melelahkan sehingga waktu produktif dan istirahat jauh lebih seimbang.', false, 0.01, NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), 'p0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'b', 'Interaksi tatap muka langsung di kantor mempermudah kolaborasi spontan dan membangun kultur tim yang solid.', false, 0.02, NOW() - INTERVAL '2.5 hours')
ON CONFLICT (poll_id, user_id) DO NOTHING;

-- Poll 2 comments
INSERT INTO public.comments (id, poll_id, user_id, choice, text, is_toxic, toxicity_score, created_at)
VALUES 
  (gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'a', 'Label AI sangat penting untuk mencegah penyebaran hoaks (deepfake) dan menjaga keaslian karya kreator manusia.', false, 0.01, NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'b', 'Pengawasan label ini akan sulit diterapkan dan membatasi ekspresi kreatif para pengguna tools generatif.', false, 0.03, NOW() - INTERVAL '1.8 hours')
ON CONFLICT (poll_id, user_id) DO NOTHING;

-- Poll 3 comments
INSERT INTO public.comments (id, poll_id, user_id, choice, text, is_toxic, toxicity_score, created_at)
VALUES 
  (gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'a', 'Portofolio riil membuktikan kemampuan eksekusi langsung dalam bekerja, tidak sekadar lulus ujian teori di kelas.', false, 0.01, NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'b', 'Ijazah formal membuktikan ketekunan jangka panjang dan pemahaman teori fundamental yang penting bagi pemecahan masalah kompleks.', false, 0.03, NOW() - INTERVAL '45 minutes')
ON CONFLICT (poll_id, user_id) DO NOTHING;
