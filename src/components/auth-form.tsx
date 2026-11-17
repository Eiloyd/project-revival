import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logActivity } from "@/lib/activity-log";
import { useAuthMethods } from "@/hooks/use-auth-methods";
import { enabledOAuthProviders, normalisePhone, type AuthOAuthProvider } from "@/lib/auth/methods";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const authSchema = z.object({ email: emailSchema, password: z.string().min(8, "Password must be at least 8 characters").max(72) });
/** Supabase codes are 6 digits by default; projects can raise it up to 10. */
const codeSchema = z.string().trim().regex(/^\d{6,10}$/, "Enter the code you received");

type Method = "email" | "password" | "phone";

export function AuthForm({ redirectPath = "/" }: { redirectPath?: string }) {
  const { settings: s } = useAuthMethods();
  const emailOn = s.auth_email_code || s.auth_magic_link;
  const available: Method[] = [...(emailOn ? ["email" as const] : []), ...(s.auth_password ? ["password" as const] : []), ...(s.auth_phone_code ? ["phone" as const] : [])];
  const oauth = enabledOAuthProviders(s);
  const canSignUp = s.auth_signup;

  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const current: Method = available.includes(method) ? method : available[0] ?? "password";
  const signingUp = mode === "up" && canSignUp;
  useEffect(() => { if (!canSignUp && mode === "up") setMode("in"); }, [canSignUp, mode]);
  const back = () => `${window.location.origin}${redirectPath}`;

  async function sendCode() {
    setMsg(null);
    let target: string; let error: { message: string } | null;
    setBusy(true);
    if (current === "phone") {
      const p = normalisePhone(phone);
      if (!p) { setBusy(false); setMsg("Enter a valid mobile number, for example 9876543210 or +919876543210."); return; }
      target = p; ({ error } = await supabase.auth.signInWithOtp({ phone: p, options: { shouldCreateUser: signingUp } }));
    } else {
      const p = emailSchema.safeParse(email);
      if (!p.success) { setBusy(false); setMsg(p.error.issues[0]?.message ?? "Enter a valid email"); return; }
      target = p.data; ({ error } = await supabase.auth.signInWithOtp({ email: p.data, options: { shouldCreateUser: signingUp, emailRedirectTo: back() } }));
    }
    setBusy(false);
    if (error) {
      setMsg(/signups? not allowed|user not found/i.test(error.message) ? `No account found for this ${current === "phone" ? "number" : "email"}.${canSignUp ? ' Choose "Create account" first, or ask your admin.' : " Ask your admin."}`
        : /phone.*(provider|disabled)|unsupported phone/i.test(error.message) ? "SMS sign-in is not set up yet. Please use email." : error.message);
      return;
    }
    setSentTo(target); setCode("");
    setMsg(current === "phone" ? `We've sent an SMS code to ${target}. Enter it below.`
      : s.auth_email_code && s.auth_magic_link ? `We've emailed ${target}. Click the link in the email, or type the code below.`
      : s.auth_magic_link ? `We've emailed a sign-in link to ${target}. Open the email and click the link.`
      : `We've emailed a login code to ${target}. Enter it below.`);
  }

  async function verifyCode() {
    setMsg(null);
    const c = codeSchema.safeParse(code);
    if (!c.success || !sentTo) { setMsg(c.success ? "Send a code first." : c.error.issues[0]?.message ?? "Enter the code"); return; }
    setBusy(true);
    const { error } = current === "phone"
      ? await supabase.auth.verifyOtp({ phone: sentTo, token: c.data, type: "sms" })
      : await supabase.auth.verifyOtp({ email: sentTo, token: c.data, type: "email" });
    setBusy(false);
    if (error) { setMsg(/expired|invalid/i.test(error.message) ? "This code is wrong or has expired. Check it or send a new code." : error.message); return; }
    void logActivity("login", { dashboard: redirectPath });
  }

  async function submitPassword() {
    setMsg(null);
    const p = authSchema.safeParse({ email, password });
    if (!p.success) { setMsg(p.error.issues[0]?.message ?? "Check the details"); return; }
    setBusy(true);
    if (!signingUp) {
      const { error } = await supabase.auth.signInWithPassword(p.data);
      if (error) setMsg(error.message); else void logActivity("login", { dashboard: redirectPath });
    } else {
      const { data, error } = await supabase.auth.signUp({ ...p.data, options: { emailRedirectTo: back() } });
      if (error) setMsg(error.message);
      else if (!data.session) { setConfirmationPending(true); setMsg("Check your email to confirm your account, then sign in here."); }
    }
    setBusy(false);
  }

  async function social(provider: AuthOAuthProvider) {
    setMsg(null); setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: back() } });
    if (error) { setBusy(false); setMsg(/not enabled|unsupported provider/i.test(error.message) ? "This sign-in option is not set up yet. Please use email." : error.message); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (current === "password") void submitPassword();
    else if (sentTo && (current === "phone" || s.auth_email_code)) void verifyCode();
    else void sendCode();
  }

  function switchMethod(next: Method) { setMethod(next); setMsg(null); setSentTo(null); setCode(""); setConfirmationPending(false); }

  const linkBtn = "h-auto justify-start whitespace-normal px-0 py-1 text-left text-xs";
  const title = signingUp ? "Create account" : "Sign in";
  const methodLabel: Record<Method, string> = { email: s.auth_email_code ? "Email code" : "Email link", password: "Password", phone: "Mobile SMS" };
  const showCodeBox = !!sentTo && (current === "phone" || s.auth_email_code);
  const submitLabel = current === "password" ? title : showCodeBox ? "Verify code & sign in" : sentTo ? "Send again" : current === "phone" ? "Send SMS code" : s.auth_email_code ? "Send login code" : "Email me a sign-in link";
  const hint = current === "password" ? "Sign in with your email and password." : current === "phone" ? "We'll send a one-time code to your mobile." : s.auth_email_code ? "We'll email you a one-time login code." : "We'll email you a link that signs you in.";

  return <form onSubmit={submit} className="mt-4 grid w-full min-w-0 max-w-md gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:mt-8 sm:p-6">
    <div className="grid gap-1">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
    {available.length > 1 && !sentTo && <div role="tablist" aria-label="Sign-in method" className="grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${available.length}, minmax(0, 1fr))` }}>
      {available.map(m => <button key={m} type="button" role="tab" aria-selected={current === m} onClick={() => switchMethod(m)} className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${current === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{methodLabel[m]}</button>)}
    </div>}
    {current === "phone"
      ? <div className="grid gap-2"><Label htmlFor="a-phone">Mobile number</Label><Input id="a-phone" type="tel" inputMode="tel" placeholder="9876543210" value={phone} disabled={!!sentTo} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></div>
      : <div className="grid gap-2"><Label htmlFor="a-email">Email</Label><Input id="a-email" type="email" value={email} disabled={!!sentTo} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>}
    {current === "password" && <div className="grid gap-2"><Label htmlFor="a-pass">Password</Label><Input id="a-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signingUp ? "new-password" : "current-password"} /></div>}
    {showCodeBox && <div className="grid gap-2"><Label htmlFor="a-code">{current === "phone" ? "SMS code" : "Login code"}</Label><Input id="a-code" inputMode="numeric" autoComplete="one-time-code" maxLength={10} autoFocus placeholder="Enter the code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="tracking-[0.3em]" /></div>}
    {msg && <p role="status" aria-live="polite" className="break-words rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{msg}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Please wait…" : submitLabel}</Button>
    {sentTo && <div className="flex flex-wrap gap-x-4">
      {showCodeBox && <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={() => void sendCode()}>Resend code</Button>}
      <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={() => { setSentTo(null); setCode(""); setMsg(null); }}>{current === "phone" ? "Use a different number" : "Use a different email"}</Button>
    </div>}
    {current === "password" && confirmationPending && <Button type="button" variant="outline" disabled={busy} onClick={async () => { setBusy(true); const {error} = await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:back()}}); setMsg(error ? error.message : 'Verification email sent.'); setBusy(false); }}>Resend verification email</Button>}
    {current === "password" && !signingUp && s.auth_password_reset && <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={async () => {
      // Moved accounts keep their email but not their old password: this link verifies the email and lets them choose a new one.
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) { setMsg("Enter your email above first."); return; }
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password?next=${encodeURIComponent(redirectPath)}` });
      setMsg(error ? error.message : "If an account exists for this email, we've sent a link to set a new password.");
      setBusy(false);
    }}>Forgot password or first sign-in on the new site? Set a new password</Button>}
    {oauth.length > 0 && !sentTo && <div className="grid gap-2">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></p>
      <div className="grid grid-cols-2 gap-2">{oauth.map(o => <Button key={o.provider} type="button" variant="outline" size="sm" disabled={busy} onClick={() => void social(o.provider)}>{o.label}</Button>)}</div>
    </div>}
    {canSignUp && !sentTo && <Button type="button" variant="link" className={linkBtn} onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); setConfirmationPending(false); }}>{mode === "in" ? "No account yet? Create one" : "Already have an account? Sign in"}</Button>}
  </form>;
}
