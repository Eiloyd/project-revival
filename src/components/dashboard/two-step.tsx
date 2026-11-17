import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const codeOk = (c: string) => /^\d{6}$/.test(c);

/** True when this account has an authenticator app but this sign-in has not entered its code yet. */
let knownOk = false; // this tab already passed the check for the current sign-in, so moving between dashboards does not flash
export function useNeedsTwoStep(enabled: boolean) {
  const [state, setRaw] = useState<'checking' | 'needed' | 'ok'>(() => knownOk ? 'ok' : 'checking');
  const setState = (v: 'checking' | 'needed' | 'ok') => { knownOk = v === 'ok'; setRaw(v); };
  useEffect(() => {
    if (!enabled) { setState('ok'); return; }
    let live = true;
    const check = async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (live) setState(data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2' ? 'needed' : 'ok');
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === 'SIGNED_IN' || e === 'MFA_CHALLENGE_VERIFIED' || e === 'SIGNED_OUT') { knownOk = false; void check(); } });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, [enabled]);
  return { state, done: () => setState('ok') };
}

/** Asks for the 6-digit code from the authenticator app after the normal sign-in. */
export function TwoStepChallenge({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!codeOk(code)) { setMsg('Enter the 6-digit code from your authenticator app.'); return; }
    setBusy(true);
    const { data: f } = await supabase.auth.mfa.listFactors();
    const factor = f?.totp?.[0];
    if (!factor) { setBusy(false); onDone(); return; }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setBusy(false);
    if (error) setMsg('That code did not match. Use the newest code shown in the app.'); else onDone();
  };
  return <form onSubmit={submit} className="dash-card grid gap-4 p-5">
    <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />2-step verification</p>
    <p className="text-sm text-muted-foreground">Open your authenticator app (Google Authenticator, Microsoft Authenticator or Authy) and type the 6-digit code for RILOYD.</p>
    <div className="grid gap-2"><Label htmlFor="mfa-code">Code</Label><Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="tracking-[0.3em]" /></div>
    {msg && <p role="status" className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{msg}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Verify'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void supabase.auth.signOut()}>Sign out</Button></div>
  </form>;
}

/** Account security: set up / remove the authenticator app and sign out of every device. */
export function AccountSecurity({ allowTwoStep }: { allowTwoStep: boolean }) {
  const qc = useQueryClient();
  const factors = useQuery({ queryKey: ['mfa-factors'], queryFn: async () => { const { data, error } = await supabase.auth.mfa.listFactors(); if (error) throw error; return data; } });
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const active = factors.data?.totp ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['mfa-factors'] });

  const start = async () => {
    setMsg(null); setBusy(true);
    // Drop any half-finished setup first so a fresh QR code can be made.
    for (const f of factors.data?.all ?? []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${new Date().toLocaleDateString('en-IN')}` });
    setBusy(false);
    if (error) { setMsg(/disabled|not enabled/i.test(error.message) ? 'Authenticator apps are switched off in Supabase (Authentication → Multi-Factor). Ask the admin.' : error.message); return; }
    setSetup({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }); setCode('');
  };
  const confirm = async () => {
    if (!setup) return; setMsg(null);
    if (!codeOk(code)) { setMsg('Enter the 6-digit code shown in the app.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: setup.id, code });
    setBusy(false);
    if (error) { setMsg('That code did not match. Wait for the next code and try again.'); return; }
    setSetup(null); setMsg('2-step verification is on. Next time you sign in you will be asked for a code.'); void refresh();
  };
  const remove = async (id: string) => {
    if (!window.confirm('Turn off 2-step verification for your account?')) return;
    setBusy(true); const { error } = await supabase.auth.mfa.unenroll({ factorId: id }); setBusy(false);
    setMsg(error ? (/aal2/i.test(error.message) ? 'Sign out and sign in again with your code, then turn it off.' : error.message) : '2-step verification is off.'); void refresh();
  };
  const signOutEverywhere = async () => {
    if (!window.confirm('Sign out on every phone and computer, including this one?')) return;
    await supabase.auth.signOut({ scope: 'global' });
  };

  return <div className="grid gap-4">
    {(allowTwoStep || active.length > 0) && <section className="grid gap-3">
      <h3 className="text-sm font-bold">2-step verification</h3>
      <p className="text-sm text-muted-foreground">After your password or email code, you also type a code from an authenticator app on your phone. Someone who learns your password still cannot get in.</p>
      {factors.isPending ? <p className="text-sm text-muted-foreground">Loading…</p>
        : active.length ? active.map(f => <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"><span><ShieldCheck className="mr-1 inline size-4 text-[var(--dash-success)]" />On · {f.friendly_name || 'Authenticator app'}</span><Button size="sm" variant="outline" disabled={busy} onClick={() => void remove(f.id)}>Turn off</Button></div>)
        : setup ? <div className="grid gap-3 rounded-lg border border-border p-3">
            <p className="text-sm">1. Scan this QR code with your authenticator app.</p>
            <img src={setup.qr} alt="QR code for the authenticator app" className="size-44 rounded bg-background p-2" />
            <p className="break-all text-xs text-muted-foreground">Can't scan? Type this key in the app: <span className="font-mono text-foreground">{setup.secret}</span></p>
            <div className="grid gap-2"><Label htmlFor="mfa-setup">2. Type the 6-digit code the app shows</Label><Input id="mfa-setup" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="tracking-[0.3em]" /></div>
            <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void confirm()}>Turn on</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { const id = setup.id; setSetup(null); void supabase.auth.mfa.unenroll({ factorId: id }).then(refresh); }}>Cancel</Button></div>
          </div>
        : allowTwoStep ? <Button size="sm" className="justify-self-start" disabled={busy} onClick={() => void start()}>Set up authenticator app</Button> : null}
    </section>}
    <section className="grid gap-2">
      <h3 className="text-sm font-bold">Signed-in devices</h3>
      <p className="text-sm text-muted-foreground">Lost a phone or used a shared computer? Sign out everywhere at once.</p>
      <Button size="sm" variant="outline" className="justify-self-start" onClick={() => void signOutEverywhere()}>Sign out on all devices</Button>
    </section>
    {msg && <p role="status" className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{msg}</p>}
  </div>;
}
