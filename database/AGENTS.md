- `schema.sql` + `seed.sql` are a snapshot export of the live structure (no personal data) for importing into another Postgres project; regenerate them after schema changes so the export does not go stale.
- `schema.sql` must end with explicit table/sequence GRANTs (service_role all, authenticated CRUD, anon only for tables with anon policies) and `reset.sql` must stay a clean-slate companion, because new Supabase projects grant nothing by default and forms fail with 42501 otherwise.

<!-- AGENT-MEMORY:BEGIN -->
- A fresh remix arrives with tables but no logins or settings: re-apply `restore-starter.sql` then `restore-demo-accounts.sql` (idempotent, one transaction each via the data tool, not migrations), because the app's approval routes, fees, funding jury stages and test logins live in rows, not schema.
<!-- AGENT-MEMORY:END -->
