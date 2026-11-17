import { createFileRoute } from "@tanstack/react-router";
import { fillServerEnvAliases } from "@/lib/server-env";
import { contactFromLeadFields, leadgenIdsFromWebhook, metaLeadSourceId, verifyMetaSignature, type MetaLeadField } from "@/lib/meta-leads";

/**
 * Meta Lead Ads webhook → CRM.
 * GET: Meta's one-time subscription check (hub.verify_token must equal META_VERIFY_TOKEN).
 * POST: every delivery must carry a valid X-Hub-Signature-256 made with META_APP_SECRET; each new lead is
 * read from the Graph API with META_PAGE_ACCESS_TOKEN and added to the CRM (duplicates are ignored).
 */
const GRAPH = "https://graph.facebook.com/v21.0";

async function verify({ request }: { request: Request }) {
  fillServerEnvAliases(process.env as Record<string, string | undefined>);
  const url = new URL(request.url);
  const { integrationCredentials } = await import("@/lib/integrations/store.server");
  const expected = (await integrationCredentials("meta_leads"))?.['verify_token'] || process.env["META_VERIFY_TOKEN"];
  if (url.searchParams.get("hub.mode") === "subscribe" && expected && url.searchParams.get("hub.verify_token") === expected) {
    const challenge = url.searchParams.get("hub.challenge") ?? "";
    if (/^[A-Za-z0-9_-]{1,200}$/.test(challenge)) return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

async function receive({ request }: { request: Request }) {
  fillServerEnvAliases(process.env as Record<string, string | undefined>);
  // Credentials are managed in Admin → Integrations (project secrets are the fallback).
  const { integrationCredentials, reportIntegration } = await import("@/lib/integrations/store.server");
  const creds = await integrationCredentials("meta_leads");
  const secret = creds?.['app_secret'];
  const token = creds?.['page_access_token'];
  if (!secret || !token) { console.error("Meta leads: not configured in Admin → Integrations"); await reportIntegration("meta_leads", false, "A lead arrived but Meta Lead Ads is not configured or is disabled."); return new Response("Not configured", { status: 503 }); }
  const raw = await request.text();
  if (raw.length > 200_000 || !(await verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), secret))) return new Response("Forbidden", { status: 403 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }
  const ids = leadgenIdsFromWebhook(body);
  if (!ids.length) return new Response("OK", { status: 200 });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let failed = 0;
  for (const id of ids) {
    try {
      const res = await fetch(`${GRAPH}/${id}?fields=field_data,created_time,ad_name,campaign_name,form_id`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { failed++; console.error(`Meta leads: Graph API ${res.status} for lead ${id}: ${(await res.text()).slice(0, 500)}`); continue; }
      const lead = await res.json() as { field_data?: MetaLeadField[]; ad_name?: string; campaign_name?: string };
      const contact = contactFromLeadFields(lead.field_data);
      const title = `Meta Ads lead${lead.campaign_name ? ` · ${lead.campaign_name}` : lead.ad_name ? ` · ${lead.ad_name}` : ""}${contact.city ? ` · ${contact.city}` : ""}`;
      const { error } = await supabaseAdmin.rpc("crm_route_submission", {
        _source: "meta_ads", _source_id: await metaLeadSourceId(id), _full_name: contact.fullName, _email: contact.email, _phone: contact.phone,
        _company: contact.company, _title: title.slice(0, 200), _code: contact.referralCode, _acknowledgement: "", _amount: 0,
      } as never);
      if (error) { failed++; console.error(`Meta leads: CRM save failed for lead ${id}: ${error.code ?? ""} ${error.message}`); }
    } catch (e) { failed++; console.error(`Meta leads: lead ${id} failed`, e instanceof Error ? e.message : e); }
  }
  if (failed) await reportIntegration("meta_leads", false, `${failed} of ${ids.length} Meta lead(s) could not be saved; Meta will retry.`);
  // A non-2xx answer makes Meta retry the delivery later; duplicates are ignored on retry.
  return new Response(failed ? "Retry" : "OK", { status: failed ? 500 : 200 });
}

export const Route = createFileRoute("/api/public/meta-leads")({
  staticData: { sitemap: false },
  server: { handlers: { GET: verify, POST: receive } },
});
