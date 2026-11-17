import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Panel } from '@/components/work/common';
import { AccountSecurity } from '@/components/dashboard/two-step';
import { useAuthMethods } from '@/hooks/use-auth-methods';
import { authSettingDefs, type AuthSettingDef, type AuthSettingKey } from '@/lib/auth/methods';
import { saveAuthSetting } from '@/lib/auth/settings.functions';

const ref = String(import.meta.env['VITE_SUPABASE_PROJECT_ID'] || (String(import.meta.env['VITE_SUPABASE_URL'] ?? '').match(/https:\/\/([^.]+)\./)?.[1] ?? ''));
const dash = (path: string) => `https://supabase.com/dashboard/project/${ref}/${path}`;
const groups: AuthSettingDef['group'][] = ['Email & phone', 'Social sign-in', 'Accounts & safety'];

/** Admin → Sign-in & security: switch every sign-in method on or off for all login pages. */
export function AuthMethodsAdmin() {
  const { settings, loading } = useAuthMethods();
  const qc = useQueryClient(); const save = useServerFn(saveAuthSetting);
  const [busy, setBusy] = useState<AuthSettingKey | null>(null); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const toggle = async (key: AuthSettingKey, value: boolean) => {
    setBusy(key); setMsg(null);
    try { await save({ data: { key, value } }); await qc.invalidateQueries({ queryKey: ['auth-methods'] }); void qc.invalidateQueries({ queryKey: ['global-settings-admin'] }); setMsg({ ok: true, text: `${authSettingDefs.find(d => d.key === key)?.label} switched ${value ? 'on' : 'off'}.` }); }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save. Please try again.' }); }
    finally { setBusy(null); }
  };
  return <div className="grid gap-5">
    <p className="text-sm text-muted-foreground">Choose how people sign in on every login page (employees, admins, volunteers and all portals). Changes apply straight away and are recorded in Change history. Some options also need a one-time setup in Supabase — shown under each switch.</p>
    {msg && <p role="status" className={`rounded-md border px-3 py-2 text-sm ${msg.ok ? 'border-border text-[var(--dash-success)]' : 'border-destructive/40 text-destructive'}`}>{msg.text}</p>}
    {groups.map(g => <Panel key={g} title={g}><ul className="grid gap-3">{authSettingDefs.filter(d => d.group === g).map(d => <li key={d.key} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0"><p className="text-sm font-semibold">{d.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{d.description}</p>{d.needsSupabase && <p className="mt-1 text-xs text-muted-foreground">Supabase setup: {d.needsSupabase}</p>}</div>
      <Switch aria-label={d.label} checked={settings[d.key]} disabled={loading || busy !== null} onCheckedChange={v => void toggle(d.key, v)} />
    </li>)}</ul></Panel>)}
    <Panel title="Supabase shortcuts">
      <p className="text-sm text-muted-foreground">A switch here shows or hides the option on the sign-in pages. To fully block a method for everyone, also turn it off in Supabase.</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">{[['Sign-in providers', 'auth/providers'], ['Email templates', 'auth/templates'], ['Redirect URLs', 'auth/url-configuration'], ['2-step (MFA)', 'auth/mfa'], ['Users', 'auth/users']].map(([l, p]) => <a key={p} href={dash(p!)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">{l}<ExternalLink className="size-3.5" /></a>)}</div>
    </Panel>
    <Panel title="Your account security"><AccountSecurity allowTwoStep={settings.auth_mfa} /></Panel>
  </div>;
}
