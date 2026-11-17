import { Copy, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { generateTemporaryPassword, type LoginSetup } from '@/lib/accounts/logins';

/** Shared "Login for this person" block for every add-person form: optional temporary password + instant email verification. */
export function LoginSetupFields({ value, onChange, idPrefix, className = '' }: { value: LoginSetup; onChange: (v: LoginSetup) => void; idPrefix: string; className?: string }) {
  const pw = value.password ?? '';
  return <fieldset className={`grid gap-2 rounded-md border border-border p-3 ${className}`}>
    <legend className="px-1 text-sm font-semibold">Login for this person</legend>
    <label htmlFor={`${idPrefix}-pw`} className="text-sm">Temporary password <span className="text-muted-foreground">(optional)</span></label>
    <div className="flex gap-2">
      <input id={`${idPrefix}-pw`} autoComplete="off" spellCheck={false} className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground" value={pw} onChange={e => onChange({ ...value, password: e.target.value })} placeholder="Leave blank if they already have one" />
      <Button type="button" variant="outline" size="icon" aria-label="Make a temporary password" onClick={() => onChange({ ...value, password: generateTemporaryPassword() })}><Wand2 /></Button>
      <Button type="button" variant="outline" size="icon" aria-label="Copy temporary password" disabled={!pw} onClick={() => void navigator.clipboard.writeText(pw).then(() => toast.success('Password copied. Share it with them privately.'))}><Copy /></Button>
    </div>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={value.verify} onChange={e => onChange({ ...value, verify: e.target.checked })} />
      <span>Mark email as verified now <span className="block text-xs text-muted-foreground">They will not need to open a verification email. Tick only if you know this email belongs to them.</span></span></label>
    <p className="text-xs text-muted-foreground">With a temporary password they must choose their own password at first sign-in. Without one they can sign in with an email code.</p>
  </fieldset>;
}

export const emptyLoginSetup: LoginSetup = { password: '', verify: true };

/** Friendly summary after a login was prepared. */
export function loginDoneText(r: { created: boolean; verified: boolean; passwordSet: boolean }): string {
  return [r.created ? 'Login created.' : 'Existing login used.', r.verified ? 'Email verified.' : 'Email not verified yet.', r.passwordSet ? 'Share the temporary password privately; they set their own at first sign-in.' : ''].filter(Boolean).join(' ');
}
