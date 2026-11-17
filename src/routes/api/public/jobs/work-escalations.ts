import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { fillServerEnvAliases } from "@/lib/server-env";

/** Scheduled hourly (at :05): escalates requests past their allowed hours, sends overdue reminders, and refreshes Zoho invoices every 6 hours. */
async function run({ request }: { request: Request }) {
  fillServerEnvAliases(process.env as Record<string, string | undefined>);
  const authFailure = await authenticateCronRequest(request);
  if (authFailure) return authFailure;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { reportIntegration, integrationCredentials } = await import("@/lib/integrations/store.server");
  const out: Record<string, unknown> = {};
  const { data: enabled } = await supabaseAdmin.rpc("escalation_enabled");
  if (enabled !== false) {
    const { data, error } = await supabaseAdmin.rpc("run_request_escalations");
    if (error) { console.error("Escalations failed", error); return Response.json({ ok: false, error: error.message }, { status: 500 }); }
    out['escalations'] = data;
  } else out['escalations'] = "switched off in Global settings";
  const { data: zoho } = await supabaseAdmin.from("integration_connections").select("status,enabled,last_sync_at").eq("provider", "zoho_invoice").maybeSingle();
  if (zoho?.enabled && zoho.status !== "disconnected" && (!zoho.last_sync_at || Date.now() - Date.parse(zoho.last_sync_at) > 6 * 3_600_000)) {
    try {
      const creds = await integrationCredentials("zoho_invoice");
      if (creds) { const { syncZoho } = await import("@/lib/integrations/zoho.server"); out['zoho'] = await syncZoho(creds); await reportIntegration("zoho_invoice", true, "Scheduled sync", Number(out['zoho'])); }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Zoho sync failed";
      await supabaseAdmin.from("integration_connections").update({ status: "error", last_error: msg }).eq("provider", "zoho_invoice");
      await reportIntegration("zoho_invoice", false, msg); out['zoho'] = msg;
    }
  }
  return Response.json({ ok: true, ...out });
}

export const Route = createFileRoute("/api/public/jobs/work-escalations")({
  staticData: { sitemap: false },
  server: { handlers: { GET: run, POST: run } },
});
