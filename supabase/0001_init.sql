-- TapServe initial schema
-- Run this in the Supabase dashboard SQL editor (or with the Supabase CLI).
--
-- Before testing sign-up, disable email confirmation for development:
--   Authentication → Providers → Email → turn off "Confirm email"
-- Re-enable it before going to production.

-- ─────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  tier text not null default 'Bronze',
  points integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for each TapServe guest.';

-- ─────────────────────────────────────────────────────────────
-- Bookings
-- ─────────────────────────────────────────────────────────────
create sequence if not exists public.booking_code_seq start 1000;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  booking_code text not null unique
    default ('B-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.booking_code_seq')::text, 4, '0')),
  room_id text not null,
  room_name text not null,
  room_image text,
  check_in date not null,
  check_out date not null,
  nights integer not null check (nights > 0),
  guests integer not null default 1 check (guests > 0),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'pending', 'completed', 'cancelled')),
  total numeric(10, 2) not null check (total >= 0),
  price_per_night numeric(10, 2) not null check (price_per_night >= 0),
  card_last4 text,
  payment_status text not null default 'paid'
    check (payment_status in ('pending', 'overdue', 'paid')),
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  constraint bookings_dates_valid check (check_out > check_in)
);

comment on table public.bookings is 'TapServe reservations owned by a guest.';

create index if not exists bookings_user_id_created_at_idx
  on public.bookings (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Auto-create a profile when someone signs up
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view their own bookings" on public.bookings;
create policy "Users can view their own bookings"
  on public.bookings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own bookings" on public.bookings;
create policy "Users can create their own bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bookings" on public.bookings;
create policy "Users can update their own bookings"
  on public.bookings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own bookings" on public.bookings;
create policy "Users can delete their own bookings"
  on public.bookings for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Grants (RLS still controls which rows are visible)
-- ─────────────────────────────────────────────────────────────
revoke all on public.profiles from anon;
revoke all on public.bookings from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant usage, select on sequence public.booking_code_seq to authenticated;
