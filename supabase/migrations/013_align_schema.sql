-- ============================================
-- Migration: 013_align_schema
-- Description: 
--   1. Rename tabel lama secara aman (users, battles, votes) ke *_old
--   2. Buat tabel skema baru (profiles, polls, votes, app_settings, audit_logs)
--   3. Salin data dari *_old ke tabel baru
--   4. Buat trigger, view, dan RPC increment_user_points baru
--   5. Terapkan RLS policies
-- ============================================

-- ============================================
-- 1. RENAME TABEL LAMA SECARA AMAN
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'votes') THEN
        ALTER TABLE public.votes RENAME TO votes_old;
        RAISE NOTICE 'Tabel votes berhasil diganti nama menjadi votes_old';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'battles') THEN
        ALTER TABLE public.battles RENAME TO battles_old;
        RAISE NOTICE 'Tabel battles berhasil diganti nama menjadi battles_old';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users RENAME TO users_old;
        RAISE NOTICE 'Tabel users berhasil diganti nama menjadi users_old';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        ALTER TABLE public.comments RENAME TO comments_old;
        RAISE NOTICE 'Tabel comments berhasil diganti nama menjadi comments_old';
    END IF;
END $$;

-- ============================================
-- 2. BUAT STRUKTUR SKEMA BARU
-- ============================================

-- A. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  daily_post_count INT DEFAULT 0,
  last_post_date TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  points INT DEFAULT 50 NOT NULL CHECK (points >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Profil pengguna untuk platform KUBU';

-- B. POLLS TABLE
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false
);

COMMENT ON TABLE public.polls IS 'Jajak pendapat / polling buatan admin maupun komunitas';

-- C. VOTES TABLE
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  choice TEXT CHECK (choice in ('a', 'b')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_id, user_id)
);

COMMENT ON TABLE public.votes IS 'Daftar pilihan suara pengguna pada polling';

-- D. APP_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. INPUT CONFIGS & MIGRASI DATA LAMA
-- ============================================

INSERT INTO public.app_settings (key, value)
VALUES ('daily_poll_limit', '2')
ON CONFLICT (key) DO NOTHING;

-- A. Migrasi data users_old ke profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users_old') THEN
        INSERT INTO public.profiles (id, username, avatar_url, points, is_admin, created_at, updated_at)
        SELECT 
            id, 
            COALESCE(title, 'user_' || SUBSTR(id::text, 1, 6)),
            NULL, 
            points, 
            false,
            created_at, 
            updated_at
        FROM public.users_old
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Migrasi data pengguna dari users_old ke profiles selesai';
    END IF;
END $$;

-- B. Migrasi data battles_old ke polls
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'battles_old') THEN
        INSERT INTO public.polls (id, created_at, creator_id, question, option_a, option_b, is_official)
        SELECT 
            id,
            created_at,
            creator_id,
            title, -- judul battle sebagai pertanyaan
            left_side, -- option_a
            right_side, -- option_b
            (status = 'active' AND creator_id IN (SELECT id FROM public.profiles WHERE is_admin = true))
        FROM public.battles_old
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Migrasi data dari battles_old ke polls selesai';
    END IF;
END $$;

-- C. Migrasi data votes_old ke votes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'votes_old') THEN
        INSERT INTO public.votes (poll_id, user_id, choice, created_at)
        SELECT 
            battle_id,
            user_id,
            CASE WHEN side = 'left' THEN 'a' ELSE 'b' END,
            created_at
        FROM public.votes_old
        ON CONFLICT (poll_id, user_id) DO NOTHING;
        RAISE NOTICE 'Migrasi data dari votes_old ke votes selesai';
    END IF;
END $$;

-- ============================================
-- 4. CLEANUP TRIGGER PADA TABEL LAMA
-- ============================================
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users_old;
DROP TRIGGER IF EXISTS check_points_not_negative ON public.users_old;
DROP TRIGGER IF EXISTS validate_battle_before_insert ON public.battles_old;

-- ============================================
-- 5. DAFTARKAN RPC, TRIGGERS & VIEWS BARU
-- ============================================

-- A. Helper: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = uid), false);
$$;

-- B. Trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_taken BOOLEAN;
BEGIN
  base_username := NULLIF(SPLIT_PART(new.email, '@', 1), '');
  IF base_username IS NULL THEN
    base_username := 'user';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = base_username) INTO username_taken;
  IF username_taken THEN
    final_username := base_username || '_' || SUBSTR(md5(new.id::text), 1, 6);
  ELSE
    final_username := base_username;
  END IF;

  INSERT INTO public.profiles (id, username, avatar_url, points)
  VALUES (new.id, final_username, null, 50)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- C. View poll_stats
CREATE OR REPLACE VIEW public.poll_stats AS
SELECT 
  poll_id,
  COUNT(*) FILTER (WHERE choice = 'a') AS count_a,
  COUNT(*) FILTER (WHERE choice = 'b') AS count_b
FROM public.votes
GROUP BY poll_id;

-- D. Audit log logger
CREATE OR REPLACE FUNCTION public.log_audit_entry(p_actor UUID, p_action TEXT, p_table TEXT, p_target UUID, p_details JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, actor_role, action, target_table, target_id, details)
  VALUES (p_actor, COALESCE((SELECT CASE WHEN is_admin THEN 'admin' else 'user' END FROM public.profiles WHERE id = p_actor), 'unknown'), p_action, p_table, p_target, p_details);
END;
$$;

-- E. Trigger enforce daily poll limit
CREATE OR REPLACE FUNCTION public.enforce_daily_poll_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  limit_allowed INT := 2;
END;
$$;

-- F. Enforce daily limit (Updated logic)
CREATE OR REPLACE FUNCTION public.enforce_daily_poll_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  limit_allowed INT := 2;
BEGIN
  IF (COALESCE(new.is_official, false)) THEN
    RETURN new;
  END IF;

  SELECT COALESCE((SELECT value::int FROM public.app_settings WHERE key = 'daily_poll_limit'), 2)
  INTO limit_allowed;

  SELECT COUNT(*) INTO user_count FROM public.polls
    WHERE creator_id = new.creator_id
      AND created_at >= date_trunc('day', timezone('utc', now()))
      AND created_at < date_trunc('day', timezone('utc', now())) + INTERVAL '1 day';

  IF user_count >= limit_allowed THEN
    PERFORM public.log_audit_entry(new.creator_id, 'blocked_poll_create', 'polls', null, jsonb_build_object('reason','daily_limit_exceeded'));
    RAISE EXCEPTION 'daily_poll_limit_exceeded' USING HINT = 'You have reached the daily poll creation limit.';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_daily_limit ON public.polls;
CREATE TRIGGER trigger_enforce_daily_limit
  BEFORE INSERT ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_poll_limit();

-- G. Poll change logger
CREATE OR REPLACE FUNCTION public.poll_change_logger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  payload JSONB;
BEGIN
  IF (tg_op = 'INSERT') THEN
    payload := to_jsonb(new.*);
    PERFORM public.log_audit_entry(actor, 'insert', 'polls', new.id, payload);
    RETURN new;
  ELSIF (tg_op = 'UPDATE') THEN
    payload := jsonb_build_object('old', to_jsonb(old.*), 'new', to_jsonb(new.*));
    PERFORM public.log_audit_entry(actor, 'update', 'polls', new.id, payload);
    RETURN new;
  ELSIF (tg_op = 'DELETE') THEN
    payload := to_jsonb(old.*);
    PERFORM public.log_audit_entry(actor, 'delete', 'polls', old.id, payload);
    RETURN old;
  END IF;
  RETURN null;
END;
$$;

DROP TRIGGER IF EXISTS trigger_poll_change_logger ON public.polls;
CREATE TRIGGER trigger_poll_change_logger
  AFTER INSERT OR UPDATE OR DELETE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.poll_change_logger();

-- H. Trigger set updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- I. Trigger prevent negative points
CREATE OR REPLACE FUNCTION public.prevent_negative_points_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.points < 0 THEN
    RAISE EXCEPTION 'Points cannot be negative. Attempted: %', new.points;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS check_profiles_points_not_negative ON public.profiles;
CREATE TRIGGER check_profiles_points_not_negative
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_negative_points_profiles();

-- J. RPC: increment_user_points (Dibutuhkan Next.js frontend)
CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id UUID, p_amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET points = COALESCE(points, 50) + p_amount
  where id = p_user_id;
END;
$$;

-- ============================================
-- 6. AKTIFKAN RLS DAN POLICIES BARU
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id AND is_admin = false);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = public.is_admin(auth.uid()));

-- Policies for polls
CREATE POLICY "Polls are viewable by everyone." ON public.polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls." ON public.polls FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND (is_official = false OR public.is_admin(auth.uid()))
  );
CREATE POLICY "Users can update own polls." ON public.polls FOR UPDATE
  USING (auth.uid() = creator_id AND is_official = false)
  WITH CHECK (auth.uid() = creator_id AND is_official = false);
CREATE POLICY "Users can delete own polls." ON public.polls FOR DELETE
  USING (auth.uid() = creator_id AND is_official = false);
CREATE POLICY "Admins can create polls." ON public.polls FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = creator_id);
CREATE POLICY "Admins can update polls." ON public.polls FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete polls." ON public.polls FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Policies for votes
CREATE POLICY "Votes are viewable by everyone." ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can vote." ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for audit logs
CREATE POLICY "Admins can read audit logs." ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Policies for app settings
CREATE POLICY "App settings are viewable by everyone." ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update app settings." ON public.app_settings FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
