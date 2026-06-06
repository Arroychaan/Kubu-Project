-- ============================================
-- KUBU Database Schema (Next.js Sync Schema)
-- ============================================

-- 1. Create Profiles Table (with points)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  daily_post_count INT DEFAULT 0,
  last_post_date TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  points INT DEFAULT 50 NOT NULL CHECK (points >= 0),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  creator_id UUID REFERENCES public.profiles(id),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false
);

-- 3. Create Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  choice TEXT CHECK (choice in ('a', 'b')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_id, user_id) -- Prevent double voting
);

-- 4. Helper Function: Check Admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = uid), false);
$$;

-- 5. Trigger: Auto-create profile on signup
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
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Create View for Stats (Real-time counts)
CREATE OR REPLACE VIEW public.poll_stats AS
SELECT 
  poll_id,
  COUNT(*) FILTER (WHERE choice = 'a') AS count_a,
  COUNT(*) FILTER (WHERE choice = 'b') AS count_b
FROM public.votes
GROUP BY poll_id;

-- App settings table (single source for limits)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.app_settings (key, value)
VALUES ('daily_poll_limit', '2')
ON CONFLICT (key) DO NOTHING;

-- Audit log table for moderation and important events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) null,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID null,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to insert audit log entries
CREATE OR REPLACE FUNCTION public.log_audit_entry(p_actor UUID, p_action TEXT, p_table TEXT, p_target UUID, p_details JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, actor_role, action, target_table, target_id, details)
  VALUES (p_actor, COALESCE((SELECT CASE WHEN is_admin THEN 'admin' else 'user' END FROM public.profiles WHERE id = p_actor), 'unknown'), p_action, p_table, p_target, p_details);
END;
$$;

-- Trigger for polls: enforce daily user-created poll limit
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
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_daily_poll_limit();

-- Trigger to log poll changes (insert/update/delete)
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
  FOR EACH ROW EXECUTE PROCEDURE public.poll_change_logger();

-- RPC Function: increment_user_points
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

-- 7. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id AND is_admin = false);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = public.is_admin(auth.uid()));

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

CREATE POLICY "Votes are viewable by everyone." ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can vote." ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read audit logs." ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "App settings are viewable by everyone." ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update app settings." ON public.app_settings FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 8. Create Comments Table & Policies (Segmentation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  choice TEXT CHECK (choice IN ('a', 'b')) NOT NULL,
  text TEXT NOT NULL,
  is_toxic BOOLEAN DEFAULT false,
  toxicity_score NUMERIC(4,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT comments_poll_user_unique UNIQUE (poll_id, user_id),
  CONSTRAINT comments_vote_fk FOREIGN KEY (poll_id, user_id) 
    REFERENCES public.votes(poll_id, user_id) ON DELETE CASCADE
);

-- Comments trigger
CREATE OR REPLACE FUNCTION public.check_comment_choice_matches_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vote_choice TEXT;
BEGIN
  SELECT choice INTO v_vote_choice
  FROM public.votes
  WHERE poll_id = NEW.poll_id AND user_id = NEW.user_id;

  IF v_vote_choice IS NULL THEN
    RAISE EXCEPTION 'User has not voted in this poll.';
  END IF;

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

-- Comments RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment." ON public.comments FOR DELETE USING (auth.uid() = user_id);
