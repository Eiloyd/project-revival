import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logActivity } from "@/lib/activity-log";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const authSchema = z.object({ email: emailSchema, password: z.string().min(8, "Password must be at least 8 characters").max(72) });
/** Supabase email codes are 6 digits by default; projects can raise it up to 10. */
const codeSchema = z.string().trim().regex(/^\d{6,10}$/, "Enter the code from your email");

export function AuthForm({ redirectPath = "/" }: { redirectPath?: string }) {
  const [method, setMethod] = useState<"otp" | "password">("otp");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  async function sendCode() {
    setMsg(null);
    const p = emailSchema.safeParse(email);
    if (!p.success) { setMsg(p.error.issues[0]?.message ?? "Enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: p.data, options: { shouldCreateUser: mode === "up", emailRedirectTo: `${window.location.origin}${redirectPath}` } });
    setBusy(false);
    if (error) {
      setMsg(/signups? not allowed|user not found/i.test(error.message) ? "No account found for this email. Choose \"Create account\" first, or ask your admin." : error.message);
      return;
    }
    setCodeSentTo(p.data); setCode("");
    setMsg(`We've emailed a login code to ${p.data}. Enter it below.`);
  }

  async function verifyCode() {
    setMsg(null);
    const c = codeSchema.safeParse(code);
    if (!c.success || !codeSentTo) { setMsg(c.success ? "Send a code first." : c.error.issues[0]?.message ?? "Enter the code"); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: codeSentTo, token: c.data, type: "email" });
    setBusy(false);
    if (error) { setMsg(/expired|invalid/i.test(error.message) ? "This code is wrong or has expired. Check the email or send a new code." : error.message); return; }
    void logActivity("login", { dashboard: redirectPath });
  }

  async function submitPassword() {
    setMsg(null);
    const p = authSchema.safeParse({ email, password });
    if (!p.success) { setMsg(p.error.issues[0]?.message ?? "Check the details"); return; }
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword(p.data);
      if (error) setMsg(error.message); else void logActivity("login", { dashboard: redirectPath });
    } else {
      const { data, error } = await supabase.auth.signUp({ ...p.data, options: { emailRedirectTo: `${window.location.origin}${redirectPath}` } });
      if (error) setMsg(error.message);
      else if (!data.session) { setConfirmationPending(true); setMsg("Check your email to confirm your account, then sign in here."); }
    }
    setBusy(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (method === "password") void submitPassword();
    else if (codeSentTo) void verifyCode();
    else void sendCode();
  }

  function switchMethod(next: "otp" | "password") { setMethod(next); setMsg(null); setCodeSentTo(null); setCode(""); setConfirmationPending(false); }

  const linkBtn = "h-auto justify-start whitespace-normal px-0 py-1 text-left text-xs";
  const title = mode === "in" ? "Sign in" : "Create account";

  return <form onSubmit={submit} className="mt-4 grid w-full min-w-0 max-w-md gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:mt-8 sm:p-6">
    <div className="grid gap-1">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="text-xs text-muted-foreground">{method === "otp" ? "We'll email you a one-time login code." : "Sign in with your email and password."}</p>
    </div>
    <div className="grid gap-2"><Label htmlFor="a-email">Email</Label><Input id="a-email" type="email" value={email} disabled={!!codeSentTo} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
    {method === "password" && <div className="grid gap-2"><Label htmlFor="a-pass">Password</Label><Input id="a-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} /></div>}
    {method === "otp" && codeSentTo && <div className="grid gap-2"><Label htmlFor="a-code">Login code</Label><Input id="a-code" inputMode="numeric" autoComplete="one-time-code" maxLength={10} autoFocus placeholder="Code from your email" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="tracking-[0.3em]" /></div>}
    {msg && <p role="status" aria-live="polite" className="break-words rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{msg}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Please wait…" : method === "password" ? title : codeSentTo ? "Verify code & sign in" : "Send login code"}</Button>
    {method === "otp" && codeSentTo && <div className="flex flex-wrap gap-x-4">
      <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={() => void sendCode()}>Resend code</Button>
      <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={() => { setCodeSentTo(null); setCode(""); setMsg(null); }}>Use a different email</Button>
    </div>}
    {method === "password" && confirmationPending && <Button type="button" variant="outline" disabled={busy} onClick={async () => { setBusy(true); const {error} = await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:`${window.location.origin}${redirectPath}`}}); setMsg(error ? error.message : 'Verification email sent.'); setBusy(false); }}>Resend verification email</Button>}
    {method === "password" && mode === "in" && <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={async () => {
      // Moved accounts keep their email but not their old password: this link verifies the email and lets them choose a new one.
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) { setMsg("Enter your email above first."); return; }
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password?next=${encodeURIComponent(redirectPath)}` });
      setMsg(error ? error.message : "If an account exists for this email, we've sent a link to set a new password.");
      setBusy(false);
    }}>Forgot password or first sign-in on the new site? Set a new password</Button>}
    <Button type="button" variant="link" className={linkBtn} disabled={busy} onClick={() => switchMethod(method === "otp" ? "password" : "otp")}>{method === "otp" ? "Use password instead" : "Sign in with an email code instead"}</Button>
    {!codeSentTo && <Button type="button" variant="link" className={linkBtn} onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); setConfirmationPending(false); }}>{mode === "in" ? "No account yet? Create one" : "Already have an account? Sign in"}</Button>}
  </form>;
}
