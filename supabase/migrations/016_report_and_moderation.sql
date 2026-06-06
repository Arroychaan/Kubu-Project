-- ============================================
-- Migration: 016_report_and_moderation
-- Description:
--   1. Tambahkan kolom is_hidden pada public.polls dan public.comments
--   2. Perbarui RLS SELECT policies agar menyembunyikan konten tersembunyi dari non-admin
--   3. Buat tabel public.reports untuk laporan konten
--   4. Aktifkan RLS & buat kebijakan akses untuk public.reports
-- ============================================

-- 1. ADD COLUMN TO POLLS & COMMENTS
ALTER TABLE public.polls 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN public.polls.is_hidden IS 'Menandakan jika polling disembunyikan oleh moderator';
COMMENT ON COLUMN public.comments.is_hidden IS 'Menandakan jika komentar disembunyikan oleh moderator';

-- 2. UPDATE RLS SELECT POLICIES
-- A. Polls Select Policy
DROP POLICY IF EXISTS "Polls are viewable by everyone." ON public.polls;
CREATE POLICY "Polls are viewable by everyone." ON public.polls 
  FOR SELECT USING (is_hidden = false OR public.is_admin(auth.uid()));

-- B. Comments Select Policy
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments 
  FOR SELECT USING (is_hidden = false OR public.is_admin(auth.uid()));

-- 3. CREATE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type TEXT CHECK (target_type IN ('poll', 'comment')) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT CHECK (reason IN ('spam', 'ujaran_kebencian', 'pelecehan', 'informasi_menyesatkan', 'konten_tidak_pantas', 'lainnya')) NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ignored', 'hidden', 'deleted')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.reports IS 'Laporan konten berupa polling atau komentar/opini';
COMMENT ON COLUMN public.reports.target_type IS 'Tipe target laporan: poll atau comment';
COMMENT ON COLUMN public.reports.target_id IS 'ID dari target yang dilaporkan (poll_id atau comment_id)';
COMMENT ON COLUMN public.reports.reason IS 'Kategori alasan pelaporan';
COMMENT ON COLUMN public.reports.status IS 'Status laporan: pending, ignored (diabaikan), hidden (konten disembunyikan), deleted (konten dihapus)';

-- 4. ENABLE RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR REPORTS
DROP POLICY IF EXISTS "Admins can view all reports." ON public.reports;
CREATE POLICY "Admins can view all reports." ON public.reports
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert reports." ON public.reports;
CREATE POLICY "Users can insert reports." ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can update reports." ON public.reports;
CREATE POLICY "Admins can update reports." ON public.reports
  FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete reports." ON public.reports;
CREATE POLICY "Admins can delete reports." ON public.reports
  FOR DELETE USING (public.is_admin(auth.uid()));
