import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeFirstPasswordChange } from '@/lib/accounts/logins.functions';
import { mustChangePassword, temporaryPasswordProblem } from '@/lib/accounts/logins';

let knownDone = false; // this tab already confirmed no change is due, so switching dashboards does not flash
/** True when the account was given a temporary password by an admin/creator and has not chosen its own yet. */
export function useMustChangePassword() {
  const [state, setRaw] = useState<'checking' | 'needed' | 'ok'>(() => knownDone ? 'ok' : 'checking');
  const setState = (v: 'checking' | 'needed' | 'ok') => { knownDone = v === 'ok'; setRaw(v); };
  useEffect(() => {
    let live = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (live) setState(data.user && mustChangePassword(data.user.app_metadata) ? 'needed' : 'ok');
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange(e => { if (e === 'SIGNED_IN' || e === 'SIGNED_OUT') { knownDone = false; void check(); } });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);
  return { state, done: () => setState('ok') };
}

/** Shown before any dashboard opens when a temporary password is still in use. */
export function FirstPasswordChange({ onDone }: { onDone: () => void }) {
  const save = useServerFn(completeFirstPasswordChange);
  const [pw, setPw] = useState(''); const [again, setAgain] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    const problem = temporaryPasswordProblem(pw); if (problem) { setMsg(problem.replace('Temporary password', 'Password')); return; }
    if (pw !== again) { setMsg('The two passwords do not match.'); return; }
    setBusy(true);
    try { await save({ data: { password: pw } }); await supabase.auth.refreshSession(); onDone(); }
    catch (er) { setMsg(er instanceof Error ? er.message : 'Your password could not be saved. Please try again.'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="dash-card grid gap-4 p-5">
    <p className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4 text-primary" />Set your own password</p>
    <p className="text-sm text-muted-foreground">You signed in with a temporary password given to you. Choose your own password now — only you will know it. From next time, sign in with the new one.</p>
    <div className="grid gap-2"><Label htmlFor="fp-new">New password</Label><Input id="fp-new" type="password" autoComplete="new-password" autoFocus value={pw} onChange={e => setPw(e.target.value)} /></div>
    <div className="grid gap-2"><Label htmlFor="fp-again">Type it again</Label><Input id="fp-again" type="password" autoComplete="new-password" value={again} onChange={e => setAgain(e.target.value)} /></div>
    <p className="text-xs text-muted-foreground">At least 8 characters, with a letter and a number.</p>
    {msg && <p role="alert" className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{msg}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save my password'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void supabase.auth.signOut()}>Sign out</Button></div>
  </form>;
}
