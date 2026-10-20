-- TapServe payment method
-- Run this AFTER supabase/0004_single_admin.sql.
--
-- Adds the guest's chosen payment method to every booking:
--   'card' — paid online with a credit/debit card
--   'cash' — pay at the front desk on arrival (payment stays pending)
--
-- Existing rows were card payments, so they default to 'card'.

alter table public.bookings
  add column if not exists payment_method text not null default 'card';

alter table public.bookings
  drop constraint if exists bookings_payment_method_check;

alter table public.bookings
  add constraint bookings_payment_method_check
  check (payment_method in ('card', 'gcash', 'cash'));

comment on column public.bookings.payment_method is
  'Guest payment choice: card (online, paid), gcash (wallet), or cash (front desk, pending).';

-- Cash bookings stay pending until the front desk collects payment. Bring
-- existing unpaid reservations in line with that rule.
update public.bookings
set status = 'pending'
where payment_status = 'pending'
  and status = 'confirmed';

-- Ask PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
