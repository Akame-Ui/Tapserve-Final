-- TapServe single-administrator enforcement
-- Run this AFTER supabase/0001_init.sql, 0002_admin.sql and 0003_admin_signup.sql.
--
-- TapServe has exactly one administrator. This migration:
--   • keeps the earliest administrator if duplicates already exist
--   • adds a database-level unique index so a second admin cannot be created
--   • updates the role guard with a friendly "only one administrator" error
--   • adds transfer_admin(target_user_id) to hand the role to another account
--   • adds admin_count() so setup checks can verify the invariant

-- ─────────────────────────────────────────────────────────────
-- 1. Collapse any existing duplicate administrators
--    Keep the oldest admin profile; demote the rest to guest.
--    Run this in the Supabase SQL Editor (auth.uid() is null there,
--    so the role guard permits maintenance updates).
-- ─────────────────────────────────────────────────────────────
with ranked_admins as (
  select
    id,
    row_number() over (order by 
    created_at asc, id asc) as position
  from public.profiles
  where role = 'admin'
)
update public.profiles p
set role = 'guest'
from ranked_admins r
where p.id = r.id
  and r.position > 1;

-- ─────────────────────────────────────────────────────────────
-- 2. Hard guarantee: at most one row may have role = 'admin'
-- ─────────────────────────────────────────────────────────────
create unique index if not exists profiles_single_admin_idx
  on public.profiles (role)
  where role = 'admin';

-- ─────────────────────────────────────────────────────────────
-- 3. Friendly role guard
--    The unique index is the hard guarantee. This trigger gives
--    callers a clear message instead of a raw duplicate-key error.
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

  if new.role = 'admin'
     and old.role is distinct from 'admin'
     and exists (
       select 1
       from public.profiles
       where role = 'admin'
         and id <> old.id
     ) then
    raise exception 'Only one administrator is allowed. Transfer the role instead.';
  end if;

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. Transfer the administrator role atomically
--    The current admin is demoted first, then the target is
--    promoted, so the unique index is never violated.
-- ─────────────────────────────────────────────────────────────
create or replace function public.transfer_admin(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Sign in before transferring administrator access.';
  end if;

  -- Serialize transfers so two admins cannot race each other.
  perform pg_advisory_xact_lock(947232::bigint);

  if not public.is_admin() then
    raise exception 'Only the current administrator can transfer the role.';
  end if;

  if target_user_id is null or target_user_id = actor then
    raise exception 'Choose a different account to receive administrator access.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = target_user_id
  ) then
    raise exception 'That account does not have a TapServe profile.';
  end if;

  update public.profiles
  set role = 'guest'
  where id = actor
    and role = 'admin';

  update public.profiles
  set role = 'admin'
  where id = target_user_id;

  return true;
end;
$$;

revoke all on function public.transfer_admin(uuid) from public;
revoke all on function public.transfer_admin(uuid) from anon;
grant execute on function public.transfer_admin(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. Public count (boolean-like setup information only)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.profiles
  where role = 'admin';
$$;

revoke all on function public.admin_count() from public;
grant execute on function public.admin_count() to anon, authenticated;

-- Ask PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
