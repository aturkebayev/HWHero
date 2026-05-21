-- Герой домашки v2 — multi-user with Supabase Auth + family/child invites.
-- Run in the Supabase SQL editor. Safe to re-run (drops & recreates).

-- ============================================================
-- 0. Clean slate — drop any v1 / partial objects.
--    Safe for dev: there is no production data yet.
-- ============================================================

drop table if exists public.tasks    cascade;
drop table if exists public.heroes   cascade;
drop table if exists public.hero     cascade;  -- v1 singleton table
drop table if exists public.profiles cascade;
drop table if exists public.families cascade;

-- Drop functions too: CREATE OR REPLACE cannot change a return type.
drop function if exists public.bootstrap_parent(text);
drop function if exists public.join_family_as_child(text, text);
drop function if exists public.regenerate_invite_code(uuid);

-- ============================================================
-- 1. Tables
-- ============================================================

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text default 'Моя семья',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null check (role in ('parent','child')),
  family_id uuid references public.families(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id  uuid not null references public.profiles(id)  on delete cascade,
  parent_id uuid not null references public.profiles(id)  on delete set null,
  subject text not null,
  description text not null,
  deadline timestamptz not null,
  xp_reward int not null default 100,
  status text not null default 'active'
    check (status in ('active','submitted','approved','rejected')),
  time_spent_sec int not null default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  parent_comment text,
  bonus_coins int,
  created_at timestamptz not null default now()
);

-- Per-child hero stats. PK = child profile id.
create table if not exists public.heroes (
  child_id uuid primary key references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null default 'Герой',
  level int not null default 1,
  xp int not null default 0,
  coins int not null default 0,
  streak_days int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

create index if not exists tasks_family_idx on public.tasks(family_id);
create index if not exists tasks_child_idx  on public.tasks(child_id);
create index if not exists profiles_family_idx on public.profiles(family_id);

-- ============================================================
-- 2. Helpers
-- ============================================================

-- Random 6-char invite code (A-Z, 0-9, no ambiguous chars).
create or replace function public.gen_invite_code() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out_code text := '';
  i int;
begin
  for i in 1..6 loop
    out_code := out_code || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
  end loop;
  return out_code;
end;
$$;

-- "Current user is parent in family F" — used by RLS.
create or replace function public.is_parent_of(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'parent' and family_id = f
  );
$$;

create or replace function public.is_member_of(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and family_id = f
  );
$$;

-- Bootstrap parent on first sign-in: profile + family with invite code.
-- NOTE: RETURNS TABLE output columns are prefixed r_ so they never clash
-- with real table column names inside the function body (avoids 42702).
create or replace function public.bootstrap_parent(p_display_name text)
returns table (r_profile_id uuid, r_family_id uuid, r_invite_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_code text;
  v_email text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  -- If profile already exists, just return it.
  select p.family_id into v_family_id from public.profiles p where p.id = v_uid;
  if v_family_id is not null then
    select f.invite_code into v_code from public.families f where f.id = v_family_id;
    return query select v_uid, v_family_id, v_code;
    return;
  end if;

  -- Create family with a unique code.
  loop
    v_code := public.gen_invite_code();
    exit when not exists (
      select 1 from public.families f where f.invite_code = v_code
    );
  end loop;

  insert into public.families (owner_id, invite_code)
    values (v_uid, v_code) returning id into v_family_id;

  insert into public.profiles (id, email, display_name, role, family_id)
    values (v_uid, v_email, coalesce(p_display_name, split_part(v_email,'@',1)), 'parent', v_family_id);

  return query select v_uid, v_family_id, v_code;
end;
$$;

-- Join family as child by invite code.
create or replace function public.join_family_as_child(p_invite_code text, p_display_name text)
returns table (r_profile_id uuid, r_family_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_email text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select f.id into v_family_id from public.families f
    where f.invite_code = upper(trim(p_invite_code));
  if v_family_id is null then
    raise exception 'invalid invite code';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  insert into public.profiles (id, email, display_name, role, family_id)
    values (v_uid, v_email, coalesce(p_display_name, split_part(v_email,'@',1)), 'child', v_family_id)
  on conflict (id) do update
    set role = 'child', family_id = excluded.family_id, display_name = excluded.display_name;

  insert into public.heroes (child_id, family_id, name)
    values (v_uid, v_family_id, coalesce(p_display_name, 'Герой'))
  on conflict (child_id) do nothing;

  return query select v_uid, v_family_id;
end;
$$;

-- Regenerate invite code (parent only).
create or replace function public.regenerate_invite_code(p_family_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if not exists (
    select 1 from public.families f
    where f.id = p_family_id and f.owner_id = v_uid
  ) then
    raise exception 'not a family owner';
  end if;

  loop
    v_code := public.gen_invite_code();
    exit when not exists (
      select 1 from public.families f where f.invite_code = v_code
    );
  end loop;

  update public.families set invite_code = v_code where id = p_family_id;
  return v_code;
end;
$$;

-- ============================================================
-- 3. Row Level Security
-- ============================================================

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks    enable row level security;
alter table public.heroes   enable row level security;

-- families: members can read, only owner can update.
drop policy if exists families_read on public.families;
create policy families_read on public.families for select to authenticated
  using (public.is_member_of(id));

drop policy if exists families_update on public.families;
create policy families_update on public.families for update to authenticated
  using (owner_id = auth.uid());

-- profiles: a user can read their own profile + everyone in the same family.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member_of(family_id));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- tasks: anyone in family can read; parent can do anything; child can update only own (submit + time_spent).
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated
  using (public.is_member_of(family_id));

drop policy if exists tasks_parent_write on public.tasks;
create policy tasks_parent_write on public.tasks for all to authenticated
  using (public.is_parent_of(family_id))
  with check (public.is_parent_of(family_id));

drop policy if exists tasks_child_update on public.tasks;
create policy tasks_child_update on public.tasks for update to authenticated
  using (child_id = auth.uid())
  with check (child_id = auth.uid());

-- heroes: family members can read; child can update own; parent can update children's (for rewards via RPC).
drop policy if exists heroes_read on public.heroes;
create policy heroes_read on public.heroes for select to authenticated
  using (public.is_member_of(family_id));

drop policy if exists heroes_child_update on public.heroes;
create policy heroes_child_update on public.heroes for update to authenticated
  using (child_id = auth.uid()) with check (child_id = auth.uid());

drop policy if exists heroes_parent_update on public.heroes;
create policy heroes_parent_update on public.heroes for update to authenticated
  using (public.is_parent_of(family_id)) with check (public.is_parent_of(family_id));

drop policy if exists heroes_insert on public.heroes;
create policy heroes_insert on public.heroes for insert to authenticated
  with check (child_id = auth.uid() or public.is_parent_of(family_id));

-- ============================================================
-- 4. Realtime — add tables to the publication only if missing.
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['tasks','heroes','profiles','families'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
