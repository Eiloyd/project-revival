- `schema.sql` + `seed.sql` are a snapshot export of the live structure (no personal data) for importing into another Postgres project; regenerate them after schema changes so the export does not go stale.
- `schema.sql` must end with explicit table/sequence GRANTs (service_role all, authenticated CRUD, anon only for tables with anon policies) and `reset.sql` must stay a clean-slate companion, because new Supabase projects grant nothing by default and forms fail with 42501 otherwise.

<!-- AGENT-MEMORY:BEGIN -->
- A fresh remix arrives with tables but no logins or settings: re-apply `restore-starter.sql` (idempotent, one transaction via the data tool, not migrations), because the app's approval routes, fees and funding jury stages live in rows, not schema. The project ships no test or demo logins; never add a file with shared passwords.
<!-- AGENT-MEMORY:END -->
