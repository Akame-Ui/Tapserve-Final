-- Enable Supabase Realtime for bookings so the admin Revenue Reports page
-- updates the moment a booking is created, paid, cancelled, or changed.
--
-- Safe to re-run: only adds the table when it is not already published.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;
