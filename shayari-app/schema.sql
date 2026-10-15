-- Shayari app: schema, triggers, RLS
-- Run in Supabase Dashboard -> SQL Editor (as a single script).

-- ============ TABLES ============

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  bio          text check (char_length(bio) <= 300),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.shayari (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 1000),
  tags         text[] not null default '{}',
  language     text not null default 'hi' check (language in ('hi', 'ur', 'en')), -- hi=Devanagari, ur=Urdu, en=Roman
  poet_credit  text check (char_length(poet_credit) <= 100),                      -- null = original work
  like_count   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  shayari_id uuid not null references public.shayari(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shayari_id)
);

create index shayari_created_idx on public.shayari (created_at desc);
create index shayari_top_idx     on public.shayari (like_count desc, created_at desc);
create index shayari_author_idx  on public.shayari (author_id, created_at desc);
create index likes_shayari_idx   on public.likes (shayari_id);

-- ============ TRIGGERS ============

-- 1. Auto-create a profile when someone signs up with Google
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Keep shayari.like_count in sync with the likes table
create function public.sync_like_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.shayari set like_count = like_count + 1 where id = new.shayari_id;
  elsif tg_op = 'DELETE' then
    update public.shayari set like_count = greatest(like_count - 1, 0) where id = old.shayari_id;
  end if;
  return null;
end;
$$;

create trigger likes_count_sync
  after insert or delete on public.likes
  for each row execute function public.sync_like_count();

-- 3. Simple rate limit: max 20 posts per user per 24h
create function public.limit_posts()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from public.shayari
      where author_id = new.author_id
        and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily post limit reached';
  end if;
  return new;
end;
$$;

create trigger shayari_rate_limit
  before insert on public.shayari
  for each row execute function public.limit_posts();

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.shayari  enable row level security;
alter table public.likes    enable row level security;

-- profiles: public read, owner-only update (insert is done by the trigger)
create policy "profiles are public"
  on public.profiles for select using (true);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- shayari: public read, owner-only write
create policy "shayari are public"
  on public.shayari for select using (true);

create policy "insert own shayari"
  on public.shayari for insert
  with check (auth.uid() = author_id);

create policy "update own shayari"
  on public.shayari for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "delete own shayari"
  on public.shayari for delete
  using (auth.uid() = author_id);

-- likes: public read, you can only like/unlike as yourself
create policy "likes are public"
  on public.likes for select using (true);

create policy "like as yourself"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "unlike as yourself"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ============ COLUMN-LEVEL LOCKDOWN ============
-- RLS controls which rows; this controls which columns.
-- Stops users from editing like_count, author_id, created_at, etc.

revoke update on public.shayari  from authenticated, anon;
grant  update (body, tags, language, poet_credit) on public.shayari to authenticated;

revoke update on public.profiles from authenticated, anon;
grant  update (username, display_name, bio, avatar_url) on public.profiles to authenticated;

-- ============ FEED VIEW ============
-- security_invoker makes the view obey the caller's RLS, so auth.uid() works.

create view public.feed
with (security_invoker = true) as
select
  s.id,
  s.author_id,
  s.body,
  s.tags,
  s.language,
  s.poet_credit,
  s.like_count,
  s.created_at,
  p.username,
  p.display_name,
  p.avatar_url,
  exists (
    select 1 from public.likes l
    where l.shayari_id = s.id and l.user_id = auth.uid()
  ) as liked_by_me
from public.shayari s
join public.profiles p on p.id = s.author_id;

grant select on public.feed to anon, authenticated;
