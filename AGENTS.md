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
