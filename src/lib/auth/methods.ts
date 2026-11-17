/**
 * Sign-in methods the admin can switch on/off (Admin → Sign-in & security).
 * Each switch is one boolean row in `global_settings` (key = setting key, readable by everyone)
 * so login pages can read them before anyone is signed in.
 */
export type AuthOAuthProvider = 'google' | 'azure' | 'github' | 'apple' | 'linkedin_oidc' | 'facebook';
export type AuthSettingKey =
  | 'auth_email_code' | 'auth_magic_link' | 'auth_password' | 'auth_phone_code'
  | 'auth_google' | 'auth_azure' | 'auth_github' | 'auth_apple' | 'auth_linkedin_oidc' | 'auth_facebook'
  | 'auth_signup' | 'auth_password_reset' | 'auth_mfa';

export type AuthSettingDef = { key: AuthSettingKey; label: string; description: string; group: 'Email & phone' | 'Social sign-in' | 'Accounts & safety'; defaultOn: boolean; provider?: AuthOAuthProvider; needsSupabase?: string };

export const authSettingDefs: AuthSettingDef[] = [
  { key: 'auth_email_code', group: 'Email & phone', label: 'Email login code (OTP)', description: 'A one-time code is emailed and typed on the sign-in page.', defaultOn: true, needsSupabase: 'Email template "Magic Link" must contain {{ .Token }}.' },
  { key: 'auth_magic_link', group: 'Email & phone', label: 'Email login link', description: 'A sign-in link is emailed; clicking it signs the person in.', defaultOn: false, needsSupabase: 'Email template "Magic Link" must contain {{ .ConfirmationURL }} and this site must be in Redirect URLs.' },
  { key: 'auth_password', group: 'Email & phone', label: 'Email + password', description: 'Classic email and password sign-in.', defaultOn: true },
  { key: 'auth_phone_code', group: 'Email & phone', label: 'Mobile SMS code', description: 'A one-time code is sent by SMS to the mobile number.', defaultOn: false, needsSupabase: 'Turn on the Phone provider with an SMS service (Twilio, MessageBird, Vonage or TextLocal).' },
  { key: 'auth_google', group: 'Social sign-in', provider: 'google', label: 'Google', description: 'Sign in with a Google / Gmail account.', defaultOn: false, needsSupabase: 'Turn on Google provider with its Client ID and Secret.' },
  { key: 'auth_azure', group: 'Social sign-in', provider: 'azure', label: 'Microsoft', description: 'Sign in with a Microsoft / Outlook / Office 365 account.', defaultOn: false, needsSupabase: 'Turn on Azure (Microsoft) provider.' },
  { key: 'auth_github', group: 'Social sign-in', provider: 'github', label: 'GitHub', description: 'Sign in with a GitHub account.', defaultOn: false, needsSupabase: 'Turn on GitHub provider.' },
  { key: 'auth_apple', group: 'Social sign-in', provider: 'apple', label: 'Apple', description: 'Sign in with an Apple ID.', defaultOn: false, needsSupabase: 'Turn on Apple provider.' },
  { key: 'auth_linkedin_oidc', group: 'Social sign-in', provider: 'linkedin_oidc', label: 'LinkedIn', description: 'Sign in with a LinkedIn account.', defaultOn: false, needsSupabase: 'Turn on LinkedIn (OIDC) provider.' },
  { key: 'auth_facebook', group: 'Social sign-in', provider: 'facebook', label: 'Facebook', description: 'Sign in with a Facebook account.', defaultOn: false, needsSupabase: 'Turn on Facebook provider.' },
  { key: 'auth_signup', group: 'Accounts & safety', label: 'New account sign-up', description: 'Show "Create account" on sign-in pages. When off, only existing accounts can sign in.', defaultOn: true, needsSupabase: 'To block sign-ups completely, also turn off "Allow new users to sign up".' },
  { key: 'auth_password_reset', group: 'Accounts & safety', label: 'Forgot password link', description: 'Let people set a new password by email.', defaultOn: true },
  { key: 'auth_mfa', group: 'Accounts & safety', label: '2-step verification (authenticator app)', description: 'People can protect their account with Google Authenticator, Microsoft Authenticator or Authy. Accounts that already set it up are always asked for the code.', defaultOn: true },
];

export type AuthSettings = Record<AuthSettingKey, boolean>;
export const emailSignInKeys: AuthSettingKey[] = ['auth_password', 'auth_email_code', 'auth_magic_link'];

/** Stored values merged with defaults. If every email-based way is off, password comes back on so nobody is locked out. */
export function readAuthSettings(stored: Record<string, unknown> | undefined | null): AuthSettings {
  const out = {} as AuthSettings;
  for (const d of authSettingDefs) { const v = stored?.[d.key]; out[d.key] = typeof v === 'boolean' ? v : d.defaultOn; }
  if (!emailSignInKeys.some(k => out[k])) out.auth_password = true;
  return out;
}

/** Why a switch change is refused (null = allowed). One email-based sign-in must stay on, or existing staff accounts could not sign in. */
export function authChangeProblem(current: AuthSettings, key: AuthSettingKey, value: boolean): string | null {
  if (!authSettingDefs.some(d => d.key === key)) return 'Unknown setting';
  const next = { ...current, [key]: value };
  if (!emailSignInKeys.some(k => next[k])) return 'Keep at least one of Email + password, Email login code or Email login link switched on, otherwise nobody can sign in.';
  return null;
}

export const enabledOAuthProviders = (s: AuthSettings) => authSettingDefs.filter(d => d.provider && s[d.key]).map(d => ({ provider: d.provider!, label: d.label }));

/** Phone numbers for SMS codes in international form; a bare 10-digit Indian mobile gets +91. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}

/** Portals where people may create their own account: job seekers, volunteers and institute partners. Admin and every employee dashboard never offer sign-up — those logins are created by an admin. */
export const selfSignupPortals = ['/candidate-portal', '/volunteer', '/become-a-volunteer', '/institute-portal'] as const;
export function signupAllowedFor(path: string): boolean {
  const clean = path.split(/[?#]/)[0]!.replace(/\/$/, '');
  return (selfSignupPortals as readonly string[]).includes(clean);
}
