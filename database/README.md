# Database setup (your own Supabase project)

| File | What it does |
|------|--------------|
| `reset.sql` | **Deletes** every website table, function and rule in the `public` schema (and old leftover migration history) so you can start clean. Login accounts and uploaded files are not touched. |
| `schema.sql` | Creates the full structure: 34 tables, access rules (RLS), acknowledgement-number / CRM / Google-copy functions, triggers, the 3 private file buckets, and the **table permissions (GRANTs)** the website needs to save forms. No personal data. |
| `seed.sql` | Starting counters, so each form's first acknowledgement number ends in `00001`. |
| `update-2026-11-15-admin-controls.sql` | For databases set up **before 15 Nov 2026**: adds admin fees, payment embed codes, hero pictures per theme and the admin role for abhinav@riloyd.in. Safe to run more than once. (A fresh `schema.sql` already includes the first two parts; still run section 3 for the admin role.) |
| `update-2026-11-15-volunteers.sql` | Volunteer programme: volunteers owned by the employee who created them, payout details, commission per form (max 10%), commission ledger, withdrawals (minimum ₹3,000, admin-only approval), tickets, notifications and private photo/KYC buckets. Run after `schema.sql`; safe to run more than once. |
| `update-2026-11-15-remove-festive.sql` | Retires the Festive theme: deletes festive hero pictures and allows only `dark` / `light` themes. Run once on databases set up before this change. |
| `update-2026-11-17-sales-pay-volunteer-rewards.sql` | Sales pay + volunteer rewards: daily attendance and daily wage granted only on verified collection days, the "remove your zero" reminder before 12:00 PM, volunteer revenue counted for team targets but never for direct incentive, volunteer reward schemes (Admin / BDM / BDE can launch them), fixed volunteer incentives with a monthly settlement, and the minimum withdrawal floor. Run after `schema.sql` and `update-2026-11-15-volunteers.sql`; safe to run more than once. |
| `fix-2026-11-17-admin-role-check.sql` | Removes a duplicate text version of `has_role` that made every admin check fail ("Access could not be checked"). One line, safe to run more than once; already included at the end of `complete-setup-existing-database.sql`. |

## Existing database with data: ONE file
Paste `complete-setup-existing-database.sql` in Supabase → SQL Editor and Run (enable pg_cron first). It adds every module the app needs, keeps current rows, and is safe to run again. Do not run `reset.sql` or `seed.sql` on a database with data.

## Run it (Supabase Dashboard → SQL Editor)

1. **Only if this project already has tables from an earlier attempt** (for example the 3 Drizzle migrations or an older `schema.sql`): paste and run `reset.sql`. Skip on a brand-new project.
2. Paste and run `schema.sql` (one run, top to bottom).
3. Paste and run `seed.sql`.
4. Check: run `select form_code, last_serial from public.ack_form_counters;` — six rows (01–06) with `0`. (If seed.sql is skipped, counters are created on first use, so numbers still start at 00001.)

### Before running `update-2026-11-17-sales-pay-volunteer-rewards.sql`

Turn on **pg_cron** first (Supabase Dashboard → Database → Extensions → search `pg_cron` → Enable). It sends the "Remove your zero" bell alert every 20 minutes before 12:00 PM IST to BDE/BDM with ₹0 collection. Without it the red banner in the CRM still works; enable pg_cron later and run the file again to add the bell alerts.

Why forms failed before: a new Supabase project gives the website no permission on new tables. Without the GRANT lines at the end of `schema.sql`, every save fails with `permission denied` (error code `42501`). If you ran an older `schema.sql`, run all three steps above again.

### What each role may do
- `service_role` (server only, used by every form): full access; bypasses RLS.
- `authenticated` (signed-in users): table access, but RLS lets them see only what their role allows (admins see everything, staff see their own/team data).
- `anon` (visitors): may read only announced programme fees, configured payment links and permitted people profiles. All other tables are closed to visitors.

## After setup
- The first account that signs up at `/admin` can claim admin (only while no admin exists).
- Login accounts and passwords are never exported; people sign up again.
- To copy existing rows from another database, export CSV per table and import with Table Editor → Import CSV.
- Optional: to create a `profiles` row for every new login, enable the commented trigger at the end of `schema.sql`.

Tested on a blank Postgres 17 database with Supabase-style roles: reset → schema → seed ran without errors, one test record per form was saved and read back with acknowledgement numbers ending in `00001`, and visitors were refused access to private form tables.

Regenerate these files after future database changes.

## Update 18 Nov 2026 — Admin full access, admin sign-up closed

Run `update-2026-11-18-admin-access.sql` once in the Supabase SQL editor (safe to run again, changes no data). After it:
- Admin gets every dashboard in the switcher (the website already shows them, this makes the database agree);
- Admin can open My Volunteers;
- nobody can make themself Admin from the website — add new admins from an existing admin account or in the database.

## Update 18 Nov 2026 — Transaction IDs on Young Innovators, Prototype and Funding Programme forms

Run `update-2026-11-18-programme-payments.sql` (safe to run again). It makes sure the `programme_payments` table exists and that one transaction ID can be used only once. Payments then appear in Admin → Programme payments.

## Update 18 Nov 2026 — BDE/BDM get CRM and referrals by default

Run `update-2026-11-18-bde-bdm-default-access.sql` once (safe to run again). Older BDE/BDM accounts that had only referral access get the Employee CRM, and CRM BDE/BDM get referral access. New accounts get both automatically.
