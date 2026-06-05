-- 1. Create Profiles Table (if not exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  daily_post_count int default 0,
  last_post_date timestamp with time zone,
  is_admin boolean default false,
  updated_at timestamp with time zone
);

-- 2. Create Polls Table
create table if not exists public.polls (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  creator_id uuid references public.profiles(id),
  question text not null,
  option_a text not null,
  option_b text not null,
  is_official boolean default false
);

-- 3. Create Votes Table
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  choice text check (choice in ('a', 'b')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poll_id, user_id) -- Prevent double voting
);

-- 4. Helper Function: Check Admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- 5. Trigger: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  username_taken boolean;
begin
  base_username := nullif(split_part(new.email, '@', 1), '');
  if base_username is null then
    base_username := 'user';
  end if;

  select exists(select 1 from public.profiles where username = base_username) into username_taken;
  if username_taken then
    final_username := base_username || '_' || substr(md5(new.id::text), 1, 6);
  else
    final_username := base_username;
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, final_username, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 6. Create View for Stats (Real-time counts)
create or replace view public.poll_stats as
select 
  poll_id,
  count(*) filter (where choice = 'a') as count_a,
  count(*) filter (where choice = 'b') as count_b
from public.votes
group by poll_id;

-- App settings table (single source for limits)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.app_settings (key, value)
values ('daily_poll_limit', '2')
on conflict (key) do nothing;

-- Audit log table for moderation and important events
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references auth.users(id) null,
  actor_role text,
  action text not null,
  target_table text not null,
  target_id uuid null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to insert audit log entries
create or replace function public.log_audit_entry(p_actor uuid, p_action text, p_table text, p_target uuid, p_details jsonb)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, actor_role, action, target_table, target_id, details)
  values (p_actor, coalesce((select case when is_admin then 'admin' else 'user' end from public.profiles where id = p_actor), 'unknown'), p_action, p_table, p_target, p_details);
end;
$$;

-- Trigger for polls: enforce daily user-created poll limit (for non-official polls)
create or replace function public.enforce_daily_poll_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
  limit_allowed int := 2;
begin
  -- Only apply to community polls (not official)
  if (coalesce(new.is_official, false)) then
    return new;
  end if;

  select coalesce((select value::int from public.app_settings where key = 'daily_poll_limit'), 2)
  into limit_allowed;

  -- Count polls created today by the same creator
  select count(*) into user_count from public.polls
    where creator_id = new.creator_id
      and created_at >= date_trunc('day', timezone('utc', now()))
      and created_at < date_trunc('day', timezone('utc', now())) + interval '1 day';

  if user_count >= limit_allowed then
    perform public.log_audit_entry(new.creator_id, 'blocked_poll_create', 'polls', null, jsonb_build_object('reason','daily_limit_exceeded'));
    raise exception 'daily_poll_limit_exceeded' using hint = 'You have reached the daily poll creation limit.';
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_enforce_daily_limit on public.polls;
create trigger trigger_enforce_daily_limit
before insert on public.polls
for each row execute procedure public.enforce_daily_poll_limit();

-- Trigger to log poll changes (insert/update/delete)
create or replace function public.poll_change_logger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  payload jsonb;
begin
  if (tg_op = 'INSERT') then
    payload := to_jsonb(new.*);
    perform public.log_audit_entry(actor, 'insert', 'polls', new.id, payload);
    return new;
  elsif (tg_op = 'UPDATE') then
    payload := jsonb_build_object('old', to_jsonb(old.*), 'new', to_jsonb(new.*));
    perform public.log_audit_entry(actor, 'update', 'polls', new.id, payload);
    return new;
  elsif (tg_op = 'DELETE') then
    payload := to_jsonb(old.*);
    perform public.log_audit_entry(actor, 'delete', 'polls', old.id, payload);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trigger_poll_change_logger on public.polls;
create trigger trigger_poll_change_logger
after insert or update or delete on public.polls
for each row execute procedure public.poll_change_logger();

-- 7. Enable RLS (Security)
alter table public.profiles enable row level security;
alter table public.polls enable row level security;
alter table public.votes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id and is_admin = false);
create policy "Users can update own profile." on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = public.is_admin(auth.uid()));

create policy "Polls are viewable by everyone." on public.polls for select using (true);
create policy "Users can create polls." on public.polls for insert
  with check (
    auth.uid() = creator_id
    and (is_official = false or public.is_admin(auth.uid()))
  );
create policy "Users can update own polls." on public.polls for update
  using (auth.uid() = creator_id and is_official = false)
  with check (auth.uid() = creator_id and is_official = false);
create policy "Users can delete own polls." on public.polls for delete
  using (auth.uid() = creator_id and is_official = false);
create policy "Admins can create polls." on public.polls for insert
  with check (public.is_admin(auth.uid()) and auth.uid() = creator_id);
create policy "Admins can update polls." on public.polls for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
create policy "Admins can delete polls." on public.polls for delete
  using (public.is_admin(auth.uid()));

create policy "Votes are viewable by everyone." on public.votes for select using (true);
create policy "Users can vote." on public.votes for insert with check (auth.uid() = user_id);

create policy "Admins can read audit logs." on public.audit_logs for select
  using (public.is_admin(auth.uid()));

create policy "App settings are viewable by everyone." on public.app_settings for select
  using (true);
create policy "Admins can update app settings." on public.app_settings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
