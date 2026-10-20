-- TapServe first-administrator signup
-- Run this AFTER supabase/0001_init.sql and supabase/0002_admin.sql.
--
-- It adds a safe, one-time bootstrap flow:
--   • admin_exists()       → lets the UI know whether setup is still needed
--   • claim_first_admin()  → promotes the signed-in user ONLY if no admin exists
--
-- Once the first administrator has been created, the signup form disappears
-- and claim_first_admin() always returns false.

-- ─────────────────────────────────────────────────────────────
-- 1. Replace the role guard so the one-time claim can pass
--    while still blocking guests once an admin exists.
-- ─────────────────────────────────────────────────────────────
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin()
     and exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'Only administrators may change profile roles.';
  end if;

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Public setup-status check (returns only a boolean)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where role = 'admin'
  );
$$;

revoke all on function public.admin_exists() from public;
grant execute on function public.admin_exists() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. One-time first-admin claim
-- ─────────────────────────────────────────────────────────────
create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  display_name text;
begin
  if uid is null then
    raise exception 'Sign in before claiming administrator access.';
  end if;

  -- Serialize concurrent claims so only one account can win.
  perform pg_advisory_xact_lock(947231::bigint);

  if exists (select 1 from public.profiles where role = 'admin') then
    return false;
  end if;

  select coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Administrator'
  )
  into display_name
  from auth.users u
  where u.id = uid;

  update public.profiles
  set role = 'admin',
      full_name = coalesce(nullif(full_name, ''), display_name, 'Administrator')
  where id = uid;

  if not found then
    insert into public.profiles (id, full_name, role)
    values (uid, coalesce(display_name, 'Administrator'), 'admin');
  end if;

  return true;
end;
$$;

revoke all on function public.claim_first_admin() from public;
revoke all on function public.claim_first_admin() from anon;
grant execute on function public.claim_first_admin() to authenticated;

-- Refresh PostgREST so the new RPCs are available immediately.
notify pgrst, 'reload schema';
