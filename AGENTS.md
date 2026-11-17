<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- WhatsApp share links and CSV export text come from `src/lib/share/whatsapp.ts` (tested), so every screen escapes messages and spreadsheet formulas the same way.

- Database changes go through the Lovable migration tool (recorded in `drizzle/migrations/`); storage buckets are created with the storage tool, never SQL. All buckets stay private and files are served by signed URLs, because the workspace blocks public buckets.
- In PL/pgSQL triggers shared across tables, read table-specific `NEW.<column>` only inside an `IF TG_TABLE_NAME = ...` branch: conditions are not short-circuited, so a combined `AND` crashes on other tables.
- New database work ships as a re-runnable SQL file in `database/` for the owner to apply to his own database; never apply it to Lovable Cloud, and app code must keep working when those tables or functions are absent (show a setup note instead of breaking the screen).
- Help Centre answers, topics and per-dashboard tour text live only in `src/lib/help/content.ts` (tested in `help.test.ts`); the shared dashboard shell adds the Help button and first-login tour, and tour steps target menu items by `data-tour-item` key, so new dashboards get help by adding content, not screen code.
- `src/integrations/supabase/types.ts` must describe the full app schema built by the `database/` SQL; if a regeneration from a connected database that has not run that SQL shrinks it, restore the full version, because the code is typed against every table.
- Sign-in method switches are boolean `auth_*` rows in `global_settings` (public read), defined and tested in `src/lib/auth/methods.ts` and written only by the admin-checked `saveAuthSetting` server function; every login page reads them through the shared `AuthForm`, and `DashboardShell` asks for the authenticator code before any dashboard opens, so one switch changes every portal.
- Self sign-up exists only on the candidate, volunteer and institute portals (`signupAllowedFor` in `src/lib/auth/methods.ts`, tested); admin and employee logins are made by their creator through `ensureLogin` (`src/lib/accounts/`), and `DashboardShell` forces a new password while `app_metadata.must_change_password` is set, so nobody can self-register into a staff dashboard and temporary passwords never stay in use.
- Admin gets every staff dashboard via `withAdminAccess` (`src/lib/dashboards.ts`, tested) merged over `my_dashboards()`, and dashboard-specific gates also accept admin, so nothing is hidden from Admin even before the database update is run.
- Every public form uses the shared `ReferralCodeField` (submits `coordinatorCode`; a `?ref=` link code is locked, a typed code is looked up by `getReferralCoordinator` across staff, employees, coordinators and active volunteers), so code lookup and locking behave the same on every form.
- Paid programme forms other than the scholarship (Young Innovators, Prototype Funding, Funding Programme) share `ProgrammePaymentBox`: the admin's `payment_options` embed code/link, then a transaction ID saved by the public `submitProgrammePayment` into `programme_payments` (rules tested in `lib/programme-payments/rules.ts`, one ID used once across all forms) and verified only by admins in Admin → Programme payments, so every paid form collects money the same way.
- BDE/BDM access is linked both ways in the server functions (saving referral access adds a CRM membership; saving a CRM BDE/BDM adds referral access) and `routeAfterLogin` opens the CRM first for non-admin CRM users, because the CRM holds My Work and the referrals panel for them.
- Lead distribution rules (who may receive leads, equal round-robin split) live in tested `lib/crm/distribute.ts`; writes go through `crm_reassign_leads` (logged with reason) or `crm_assign_lead` for an admin keeping leads, so the database still enforces team limits.
