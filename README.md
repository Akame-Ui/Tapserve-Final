# TapServe

A luxury hotel landing page and booking flow built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. Authentication and reservations are backed by [Supabase](https://supabase.com).

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4 + shadcn/base-ui
- framer-motion, react-day-picker, lucide-react
- Supabase Auth + Postgres (with Row Level Security)

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find both under **Supabase Dashboard → Project Settings → API**. Only the **anon** key belongs in the browser — never use the `service_role` key in this app. Restart the dev server after changing env values.

## Supabase setup

1. Create a project at [app.supabase.com](https://app.supabase.com).
2. Open **SQL Editor** and run these files in order:
   - `supabase/0001_init.sql` — profiles, bookings, triggers, RLS
   - `supabase/0002_admin.sql` — admin roles, events, audit logs, admin policies
   - `supabase/0003_admin_signup.sql` — one-time first-administrator signup
   - `supabase/0004_single_admin.sql` — exactly one administrator + role transfer
   - `supabase/0005_payment_method.sql` — cash or online payment choice on bookings
   - `supabase/0006_realtime_bookings.sql` — live admin revenue reports via Supabase Realtime
3. For local development, disable email confirmation:
   **Authentication → Providers → Email → Confirm email = off**.
   If you leave it on, the register dialog will ask the user to confirm by email before signing in.
4. Optionally set **Authentication → URL Configuration → Site URL** to `http://localhost:5173` for local testing.

### Administrator access

**First administrator (recommended):**

1. Run `supabase/0003_admin_signup.sql` and `supabase/0004_single_admin.sql` if you have not already done so.
2. Open **`/#/admin`**.
3. When no administrator exists, the page shows a **Create administrator** form. Register the account there.
4. After registration, click **Claim administrator access**. The first account to claim becomes the Administrator.
5. Once an administrator exists, the signup form disappears and `claim_first_admin()` returns `false` for everyone else.

**Handing over the administrator role:**

TapServe allows exactly one administrator. Sign in as the current administrator, open **Admin → Users**, and use **Transfer admin** on the account that should take over. The current administrator is demoted and the selected account is promoted atomically.

If you are migrating an older project that already has multiple administrators, run `supabase/0004_single_admin.sql` in the Supabase **SQL Editor**. It keeps the earliest administrator and demotes the rest before installing the unique index.

The new administrator may need to sign out and back in before **`/#/admin`** reflects the role. The previous administrator loses access immediately after the transfer.

The console provides:

- **Users** — search all auth accounts and transfer the single administrator role
- **Events** — create, edit, publish, and delete guest experiences
- **Purchases** — inspect every booking and payment record with CSV export
- **Revenue Reports** — realtime monthly revenue records, expandable room breakdowns, top rooms by revenue, and CSV export

Access is enforced in the database, not just the UI: `public.is_admin()` and RLS policies block non-admin reads and writes. Guests can no longer update their own profile rows, which prevents role escalation. A partial unique index on `profiles(role)` prevents a second administrator from existing.

### What the schema enforces

- Guests can only read, create, update, and delete their own bookings (`auth.uid() = user_id`).
- Guests can cancel their own confirmed or pending bookings from **My Account → Bookings**; the booking is kept with status `cancelled` for the record instead of being deleted.
- Guests can only read their own profile; administrators can view and update all profiles.
- Admins can view/update all bookings, manage events, and read audit logs.
- Anonymous users can only read **published** events.
- The first administrator can be claimed only while no admin exists; later role changes are admin-only.
- Exactly one administrator is allowed. A partial unique index enforces the limit, and `transfer_admin()` hands the role over transactionally.
- A `profiles` row is created automatically on sign-up from `raw_user_meta_data.full_name`.
- Profile inserts/updates are logged to `audit_logs`; bookings and events are audited on every insert/update/delete.
- Only `card_last4` is stored. The payment form is a UI placeholder and does not process real payments.
- Guests choose **Online payment** (card details required, booking confirmed and marked paid) or **Cash payment** (no card details, booking created as **pending** with payment pending until the front desk collects it). `bookings.payment_method` records the choice.

### Deploying to Netlify

`netlify.toml` already builds with `npm run build` and publishes `dist`.

Add the same two variables in **Site settings → Environment variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Vite embeds these at build time, so redeploy after changing them.

## Project structure

```
src/
  admin/               # administrator console (users, events, purchases, reports)
  components/          # landing page sections, auth dialogs, booking dialog
  context/
    AuthContext.tsx    # Supabase session, role hydration, sign-in/up/out
    BookingsContext.tsx# Booking CRUD against Supabase
  lib/supabase.ts      # Supabase client + configuration guard
supabase/
  0001_init.sql        # base schema, triggers, RLS
  0002_admin.sql       # admin roles, events, audit logs, admin policies
  0003_admin_signup.sql# one-time first-administrator bootstrap
  0004_single_admin.sql# exactly one administrator + transfer RPC
  0005_payment_method.sql# cash or card payment method on bookings
  0006_realtime_bookings.sql# realtime admin revenue reports
```

If the environment variables are missing, the site still renders but auth and booking actions show a configuration message instead of failing silently. In development a small notice appears in the bottom-left corner; run `npm run check:supabase` to verify the connection after adding your keys.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | TypeScript only |
| `npm run check:supabase` | Verify the URL/key and reachable schema |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |

## Current limitations

- Checkout is simulated: no payment provider is integrated.
- Room data is static in `RoomsSection.tsx` and `ConfirmBookingDialog.tsx`; the two lists should eventually come from one `rooms` table.
- Deleting auth accounts requires the Supabase Admin API with a `service_role` key, so account deletion is handled from the Supabase dashboard.
- The `profiles` table is created and populated, but the guest-facing UI still derives points and membership tier from bookings.
