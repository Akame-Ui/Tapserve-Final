-- TapServe administrator schema
-- Run this AFTER supabase/0001_init.sql.
--
-- It adds:
--   • profiles.role ('guest' | 'admin') and a safe is_admin() helper
--   • events managed by administrators
--   • audit_logs for system records / reports
--   • admin RLS policies for users, bookings, events and logs
--   • an admin_list_users() RPC (emails live in auth.users, not public.profiles)
--
-- To promote the first administrator, first create the account through the app,
-- then run the promotion statement at the bottom of this file. After
-- 0004_single_admin.sql, only one administrator is allowed; use
-- public.transfer_admin(target_user_id) to hand the role over instead.

-- ─────────────────────────────────────────────────────────────
-- 1. Roles
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'guest';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('guest', 'admin'));

-- Make sure every existing auth user has a profile row.
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(u.email, '@', 1)
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Guest snapshot on bookings (for admin purchase views)
-- ─────────────────────────────────────────────────────────────
alter table public.bookings add column if not exists guest_name text;
alter table public.bookings add column if not exists guest_email text;

update public.bookings b
set
  guest_email = coalesce(b.guest_email, u.email),
  guest_name = coalesce(b.guest_name, p.full_name)
from auth.users u
left join public.profiles p on p.id = u.id
where b.user_id = u.id
  and (b.guest_email is null or b.guest_name is null);

-- ─────────────────────────────────────────────────────────────
-- 3. Profile policies
--    Guests can no longer edit profiles directly, so nobody can
--    promote themselves to admin. Only admins may update rows.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Defense in depth: even if the old self-update policy is recreated,
-- a guest can never change their own role.
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

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update of role on public.profiles
  for each row execute procedure public.guard_profile_role();

-- ─────────────────────────────────────────────────────────────
-- 4. Booking policies for administrators
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Admins can view all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all bookings" on public.bookings;
create policy "Admins can update all bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete bookings" on public.bookings;
create policy "Admins can delete bookings"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 5. Events
-- ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  capacity integer check (capacity is null or capacity > 0),
  price numeric(10, 2) not null default 0 check (price >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  image_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_event_date_idx on public.events (event_date);

alter table public.events enable row level security;

drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can view all events" on public.events;
create policy "Admins can view all events"
  on public.events for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can create events" on public.events;
create policy "Admins can create events"
  on public.events for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete
  to authenticated
  using (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 6. Audit log (system records / reports)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_mail text;
  row_id text;
  payload jsonb;
begin
  select u.email into actor_mail
  from auth.users u
  where u.id = actor;

  if tg_op = 'DELETE' then
    row_id := old.id::text;
    payload := to_jsonb(old);
  else
    row_id := new.id::text;
    payload := to_jsonb(new);
  end if;

  insert into public.audit_logs (
    actor_id, actor_email, action, entity_type, entity_id, details
  )
  values (
    actor, actor_mail, lower(tg_op), tg_table_name, row_id, payload
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_audit on public.bookings;
create trigger bookings_audit
  after insert or update or delete on public.bookings
  for each row execute procedure public.log_activity();

drop trigger if exists events_audit on public.events;
create trigger events_audit
  after insert or update or delete on public.events
  for each row execute procedure public.log_activity();

drop trigger if exists profiles_audit on public.profiles;
create trigger profiles_audit
  after insert or update or delete on public.profiles
  for each row execute procedure public.log_activity();

-- ─────────────────────────────────────────────────────────────
-- 7. Admin user directory
--    auth.users is not exposed through the API, so this
--    security-definer function returns it only to admins.
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  tier text,
  points integer,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    p.full_name,
    coalesce(p.role, 'guest'::text),
    p.tier,
    p.points,
    coalesce(p.created_at, u.created_at),
    u.last_sign_in_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where public.is_admin()
  order by u.created_at desc;
$$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. Grants
-- ─────────────────────────────────────────────────────────────
revoke all on public.events from anon;
revoke all on public.events from authenticated;
revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
revoke all on sequence public.audit_logs_id_seq from anon;
revoke all on sequence public.audit_logs_id_seq from authenticated;

grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant select on public.audit_logs to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 9. Promote the first Administrator
--    Create the account through the app first, then replace the
--    email below and run this statement. This only works while no
--    administrator exists. After 0004_single_admin.sql, use:
--      select public.transfer_admin('<target-user-uuid>');
-- ─────────────────────────────────────────────────────────────
-- update public.profiles
-- set role = 'admin',
--     full_name = 'Administrator'
-- where id = (
--   select id from auth.users where email = 'admin@your-domain.com'
-- )
-- returning id, role;

-- Ask PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
