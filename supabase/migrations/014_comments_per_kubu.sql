-- ============================================
-- Migration: 014_comments_per_kubu
-- Description: 
--   1. Buat tabel comments dengan constraint UNIQUE (poll_id, user_id)
--   2. Hubungkan FK ke public.votes(poll_id, user_id) demi integritas pilihan
--   3. Tambahkan trigger pembanding pilihan suara
--   4. Terapkan RLS policies
-- ============================================

-- A. CREATE COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  choice TEXT CHECK (choice IN ('a', 'b')) NOT NULL,
  text TEXT NOT NULL,
  is_toxic BOOLEAN DEFAULT false,
  toxicity_score NUMERIC(4,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Batasan unik: Satu user hanya bisa memberi satu komentar di satu polling
  CONSTRAINT comments_poll_user_unique UNIQUE (poll_id, user_id),
  
  -- Pastikan pengguna harus sudah memilih kubu terlebih dahulu sebelum memberi komentar
  CONSTRAINT comments_vote_fk FOREIGN KEY (poll_id, user_id) 
    REFERENCES public.votes(poll_id, user_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.comments IS 'Komentar/argumen pengguna per kubu pilihan opini';

-- B. CREATE TRIGGER FOR CHOICE MATCH VALIDATION
CREATE OR REPLACE FUNCTION public.check_comment_choice_matches_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vote_choice TEXT;
BEGIN
  -- Dapatkan suara yang diberikan pengguna untuk polling ini
  SELECT choice INTO v_vote_choice
  FROM public.votes
  WHERE poll_id = NEW.poll_id AND user_id = NEW.user_id;

  IF v_vote_choice IS NULL THEN
    RAISE EXCEPTION 'User has not voted in this poll.';
  END IF;

  -- Validasi agar pilihan komentar sama dengan pilihan suara
  IF v_vote_choice != NEW.choice THEN
    RAISE EXCEPTION 'Comment choice must match the voted choice. Vote: %, Comment: %', v_vote_choice, NEW.choice;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_comment_choice ON public.comments;
CREATE TRIGGER trigger_check_comment_choice
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_comment_choice_matches_vote();

-- C. ENABLE RLS & POLICIES
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comment." ON public.comments;
CREATE POLICY "Users can insert own comment." ON public.comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment." ON public.comments;
CREATE POLICY "Users can delete own comment." ON public.comments 
  FOR DELETE USING (auth.uid() = user_id);
