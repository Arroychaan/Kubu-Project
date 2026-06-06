-- ============================================
-- Migration: 015_notifications_v1
-- Description: 
--   1. Tambahkan kolom parent_id ke public.comments
--   2. Buat tabel notifications dengan kolom read_at
--   3. Buat trigger notify_on_comment untuk new_comment & comment_reply
--   4. Terapkan RLS policies & Realtime pub
-- ============================================

-- 1. ADD COLUMN TO COMMENTS
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.comments.parent_id IS 'ID komentar induk yang dibalas (mendukung threaded replies)';

-- 2. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('comment_reply', 'new_comment')) NOT NULL,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.notifications IS 'Daftar notifikasi aktivitas pengguna';

-- 3. CREATE TRIGGER FUNCTION FOR NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll_creator UUID;
  v_parent_author UUID;
  v_actor_username TEXT;
  v_poll_question TEXT;
BEGIN
  -- Dapatkan username aktor yang menulis komentar
  SELECT username INTO v_actor_username 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  v_actor_username := COALESCE(v_actor_username, 'Seseorang');

  -- Dapatkan detail polling pembuat & pertanyaan
  SELECT question, creator_id INTO v_poll_question, v_poll_creator 
  FROM public.polls 
  WHERE id = NEW.poll_id;
  
  v_poll_question := COALESCE(v_poll_question, 'polling');
  
  -- Persingkat judul pertanyaan jika terlalu panjang agar muat di notifikasi
  IF length(v_poll_question) > 30 THEN
    v_poll_question := substr(v_poll_question, 1, 27) || '...';
  END IF;

  -- A. JIKA INI KOMENTAR BARU (parent_id IS NULL)
  IF NEW.parent_id IS NULL THEN
    -- Kirim notifikasi ke pembuat polling jika pembuat polling bukan si komentator sendiri
    IF v_poll_creator IS NOT NULL AND v_poll_creator != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, poll_id, actor_id, message)
      VALUES (
        v_poll_creator,
        'new_comment',
        NEW.poll_id,
        NEW.user_id,
        v_actor_username || ' menulis alasan baru di polling buatanmu "' || v_poll_question || '"'
      );
    END IF;
  
  -- B. JIKA INI BALASAN KOMENTAR (parent_id IS NOT NULL)
  ELSE
    -- Dapatkan pembuat komentar induk
    SELECT user_id INTO v_parent_author 
    FROM public.comments 
    WHERE id = NEW.parent_id;
    
    -- Kirim notifikasi ke penulis komentar induk jika penulis komentar induk bukan pembuat balasan sendiri
    IF v_parent_author IS NOT NULL AND v_parent_author != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, poll_id, actor_id, message)
      VALUES (
        v_parent_author,
        'comment_reply',
        NEW.poll_id,
        NEW.user_id,
        v_actor_username || ' membalas alasanmu di polling "' || v_poll_question || '"'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. BIND TRIGGER
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- 5. ENABLE RLS & POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications." ON public.notifications;
CREATE POLICY "Users can view own notifications." ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications." ON public.notifications;
CREATE POLICY "Users can update own notifications." ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications." ON public.notifications;
CREATE POLICY "Users can delete own notifications." ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 6. ADD TO REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
