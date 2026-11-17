import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { integrationDef } from './integrations/catalog';

const providerSchema = z.enum(['zoho_invoice', 'meta_leads', 'zoho_books', 'razorpay', 'zoho_payments']);

async function requireAdmin(context: { supabase: { rpc: (fn: 'has_role', args: { _user_id: string; _role: 'admin' }) => PromiseLike<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!data) throw new Error('Only an admin can manage integrations.');
}

async function testConnection(provider: string, creds: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  try {
    if (provider === 'zoho_invoice') {
      const { zohoAccessToken } = await import('./integrations/zoho.server');
      const token = await zohoAccessToken(creds);
      const dc = ['in', 'com', 'eu'].includes(creds['data_center'] ?? '') ? creds['data_center'] : 'in';
      const res = await fetch(`https://www.zohoapis.${dc}/invoice/v3/invoices?organization_id=${encodeURIComponent(creds['organization_id'] ?? '')}&per_page=1`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
      const text = await res.text();
      return res.ok && JSON.parse(text).code === 0 ? { ok: true, message: 'Connected to Zoho Invoice (read-only).' } : { ok: false, message: `Zoho Invoice [${res.status}]: ${text.slice(0, 200)}` };
    }
    if (provider === 'meta_leads') {
      const res = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name`, { headers: { Authorization: `Bearer ${creds['page_access_token'] ?? ''}` } });
      const text = await res.text();
      return res.ok ? { ok: true, message: `Connected to Meta as ${JSON.parse(text).name ?? 'page'}.` } : { ok: false, message: `Meta [${res.status}]: ${text.slice(0, 200)}` };
    }
    if (provider === 'zoho_books') {
      const { zohoAccessToken } = await import('./integrations/zoho.server');
      const token = await zohoAccessToken(creds);
      const dc = ['in', 'com', 'eu'].includes(creds['data_center'] ?? '') ? creds['data_center'] : 'in';
      const res = await fetch(`https://www.zohoapis.${dc}/books/v3/organizations`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
      const text = await res.text();
      return res.ok && JSON.parse(text).code === 0 ? { ok: true, message: 'Connected to Zoho Books.' } : { ok: false, message: `Zoho Books [${res.status}]: ${text.slice(0, 200)}` };
    }
    if (provider === 'zoho_payments') {
      const { zohoAccessToken } = await import('./integrations/zoho.server');
      await zohoAccessToken(creds);
      return { ok: true, message: 'Zoho Payments keys accepted by Zoho.' };
    }
    if (provider === 'razorpay') {
      const res = await fetch('https://api.razorpay.com/v1/payments?count=1', { headers: { Authorization: `Basic ${btoa(`${creds['key_id'] ?? ''}:${creds['key_secret'] ?? ''}`)}` } });
      const text = await res.text();
      return res.ok ? { ok: true, message: 'Connected to Razorpay.' } : { ok: false, message: `Razorpay [${res.status}]: ${text.slice(0, 200)}` };
    }
    return { ok: false, message: 'Unknown integration.' };
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Connection test failed.' }; }
}

/** Save configuration and (optionally) new keys. Blank key fields keep the saved key. Keys are never returned. */
export const saveIntegration = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ provider: providerSchema, config: z.record(z.string(), z.string().max(300)), secrets: z.record(z.string(), z.string().max(4000)) }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const def = integrationDef(data.provider)!;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { loadIntegration, encryptSecrets } = await import('./integrations/store.server');
    const prev = await loadIntegration(supabaseAdmin, data.provider);
    const config = Object.fromEntries(def.fields.filter(f => !f.secret).map(f => [f.key, (data.config[f.key] ?? prev?.config[f.key] ?? '').trim()]));
    const secrets = { ...(prev?.secrets ?? {}) };
    for (const f of def.fields.filter(x => x.secret)) { const v = data.secrets[f.key]?.trim(); if (v) secrets[f.key] = v; }
    const test = await testConnection(data.provider, { ...config, ...secrets });
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('integration_connections').upsert({ provider: data.provider, config, secret_cipher: await encryptSecrets(secrets), status: test.ok ? 'connected' : 'error', last_error: test.ok ? '' : test.message,
      last_tested_at: now, connected_at: test.ok ? (prev?.connected_at ?? now) : prev?.connected_at ?? null, connected_by: context.userId, updated_by: context.userId, updated_at: now, enabled: prev?.enabled ?? true });
    if (error) throw new Error(`Saving failed: ${error.message}`);
    await supabaseAdmin.from('integration_sync_logs').insert({ provider: data.provider, action: 'save & test', ok: test.ok, message: test.message, actor_id: context.userId });
    return test;
  });

export const integrationAction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ provider: providerSchema, action: z.enum(['test', 'sync', 'enable', 'disable', 'disconnect']) }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { loadIntegration } = await import('./integrations/store.server');
    const row = await loadIntegration(supabaseAdmin, data.provider);
    if (!row) throw new Error('Configure this integration first.');
    const now = new Date().toISOString();
    const log = (ok: boolean, message: string, items = 0) => supabaseAdmin.from('integration_sync_logs').insert({ provider: data.provider, action: data.action, ok, message, items, actor_id: context.userId });
    if (data.action === 'enable' || data.action === 'disable') {
      await supabaseAdmin.from('integration_connections').update({ enabled: data.action === 'enable', updated_by: context.userId, updated_at: now }).eq('provider', data.provider);
      await log(true, data.action === 'enable' ? 'Enabled' : 'Disabled'); return { ok: true, message: data.action === 'enable' ? 'Enabled.' : 'Disabled — the website stops using it.' };
    }
    if (data.action === 'disconnect') {
      await supabaseAdmin.from('integration_connections').update({ status: 'disconnected', secret_cipher: '', updated_by: context.userId, updated_at: now }).eq('provider', data.provider);
      await log(true, 'Disconnected; saved keys removed'); return { ok: true, message: 'Disconnected and saved keys removed.' };
    }
    const creds = { ...row.config, ...row.secrets };
    if (data.action === 'test') {
      const t = await testConnection(data.provider, creds);
      await supabaseAdmin.from('integration_connections').update({ status: t.ok ? 'connected' : 'error', last_error: t.ok ? '' : t.message, last_tested_at: now }).eq('provider', data.provider);
      await log(t.ok, t.message); return t;
    }
    if (data.provider !== 'zoho_invoice') throw new Error('Only Zoho Invoice has a manual sync.');
    try {
      const { syncZoho } = await import('./integrations/zoho.server');
      const n = await syncZoho(creds); await log(true, `${n} invoice(s) synced`, n); return { ok: true, message: `${n} invoice(s) synced from Zoho.` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed';
      await supabaseAdmin.from('integration_connections').update({ status: 'error', last_error: msg }).eq('provider', data.provider);
      const { reportIntegration } = await import('./integrations/store.server'); await reportIntegration('zoho_invoice', false, msg);
      return { ok: false, message: msg };
    }
  });
