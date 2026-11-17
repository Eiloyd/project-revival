// Server-only, read-only Zoho Invoice client: refreshes an access token and lists invoices. Never creates or edits invoices.
type Creds = Record<string, string>;
const dc = (c: Creds) => (['in', 'com', 'eu'].includes(c['data_center'] ?? '') ? c['data_center'] : 'in');

export async function zohoAccessToken(c: Creds): Promise<string> {
  const body = new URLSearchParams({ refresh_token: c['refresh_token'] ?? '', client_id: c['client_id'] ?? '', client_secret: c['client_secret'] ?? '', grant_type: 'refresh_token' });
  const res = await fetch(`https://accounts.zoho.${dc(c)}/oauth/v2/token`, { method: 'POST', body });
  const text = await res.text();
  if (!res.ok) throw new Error(`Zoho sign-in failed [${res.status}]: ${text.slice(0, 300)}`);
  const json = JSON.parse(text) as { access_token?: string; error?: string };
  if (!json.access_token) throw new Error(`Zoho sign-in failed: ${json.error ?? 'no access token'}`);
  return json.access_token;
}

export type ZohoInvoice = { invoice_id: string; invoice_number: string; customer_name: string; date: string; due_date: string; total: number; balance: number; status: string; currency_code: string };

export async function zohoInvoices(c: Creds, maxPages = 10): Promise<ZohoInvoice[]> {
  const token = await zohoAccessToken(c); const out: ZohoInvoice[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`https://www.zohoapis.${dc(c)}/invoice/v3/invoices?organization_id=${encodeURIComponent(c['organization_id'] ?? '')}&page=${page}&per_page=200&sort_column=date&sort_order=D`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    const text = await res.text();
    if (!res.ok) throw new Error(`Zoho Invoice request failed [${res.status}]: ${text.slice(0, 300)}`);
    const json = JSON.parse(text) as { code: number; message?: string; invoices?: ZohoInvoice[]; page_context?: { has_more_page?: boolean } };
    if (json.code !== 0) throw new Error(`Zoho Invoice: ${json.message ?? 'error'}`);
    out.push(...(json.invoices ?? []));
    if (!json.page_context?.has_more_page) break;
  }
  return out;
}

/** Copies invoices into the read-only zoho_invoices table and records the run. */
export async function syncZoho(c: Creds) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const list = await zohoInvoices(c);
  const rows = list.map(i => ({ zoho_id: i.invoice_id, invoice_number: i.invoice_number ?? '', customer_name: i.customer_name ?? '', invoice_date: i.date || null, due_date: i.due_date || null, total: Number(i.total ?? 0), balance: Number(i.balance ?? 0), status: i.status ?? '', currency: i.currency_code ?? 'INR', synced_at: new Date().toISOString() }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabaseAdmin.from('zoho_invoices').upsert(rows.slice(i, i + 500), { onConflict: 'zoho_id' });
    if (error) throw new Error(`Saving Zoho invoices failed: ${error.message}`);
  }
  await supabaseAdmin.from('integration_connections').update({ last_sync_at: new Date().toISOString(), last_error: '', status: 'connected' }).eq('provider', 'zoho_invoice');
  return rows.length;
}
