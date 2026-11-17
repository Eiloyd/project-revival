// Server-only: integration credentials are AES-GCM encrypted with INTEGRATIONS_ENCRYPTION_KEY and never sent to a browser.
const enc = new TextEncoder(); const dec = new TextDecoder();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function key() {
  const raw = process.env['INTEGRATIONS_ENCRYPTION_KEY'];
  if (!raw) throw new Error('INTEGRATIONS_ENCRYPTION_KEY is not set on the server.');
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`riloyd-integrations-v1:${raw}`));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function encryptSecrets(values: Record<string, string>): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), enc.encode(JSON.stringify(values)));
  return `v1:${b64(iv)}:${b64(ct)}`;
}
export async function decryptSecrets(cipher: string): Promise<Record<string, string>> {
  if (!cipher) return {};
  const [v, iv, ct] = cipher.split(':');
  if (v !== 'v1' || !iv || !ct) throw new Error('Saved integration keys are unreadable.');
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await key(), unb64(ct)))) as Record<string, string>;
}

type Admin = (typeof import('@/integrations/supabase/client.server'))['supabaseAdmin'];
export async function loadIntegration(db: Admin, provider: string) {
  const { data } = await db.from('integration_connections').select('*').eq('provider', provider).maybeSingle();
  if (!data) return null;
  return { ...data, config: (data.config ?? {}) as Record<string, string>, secrets: await decryptSecrets(data.secret_cipher) };
}

/** Credentials for a server route: the Admin-saved connection wins; project secrets are the fallback. */
export async function integrationCredentials(provider: 'meta_leads' | 'zoho_invoice'): Promise<Record<string, string> | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const row = await loadIntegration(supabaseAdmin, provider).catch(() => null);
  if (row && row.enabled && row.status !== 'disconnected') return { ...row.config, ...row.secrets };
  if (row && !row.enabled) return null;
  if (provider === 'meta_leads') {
    const s = process.env['META_APP_SECRET'], t = process.env['META_PAGE_ACCESS_TOKEN'];
    return s && t ? { app_secret: s, page_access_token: t, verify_token: process.env['META_VERIFY_TOKEN'] ?? '' } : null;
  }
  return null;
}

export async function reportIntegration(provider: string, ok: boolean, message = '', items = 0) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.rpc('integration_report', { _provider: provider, _ok: ok, _message: message.slice(0, 500), _items: items });
  } catch (e) { console.error('Integration report failed', e); }
}
