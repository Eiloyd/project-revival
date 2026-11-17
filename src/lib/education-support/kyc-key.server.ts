// The secret that locks bank/Aadhaar text before it is stored (server only).
// EDUCATION_KYC_ENCRYPTION_KEY wins; otherwise a key derived from the server-only database secret is used,
// so hosts that never set the dedicated key (e.g. Vercel) still store details encrypted, never in plain text.
export function kycKey(env: Record<string, string | undefined> = process.env): string | null {
  const own = env["EDUCATION_KYC_ENCRYPTION_KEY"];
  if (own) return own;
  const db = env["SUPABASE_SERVICE_ROLE_KEY"] || env["SUPABASE_SECRET_KEY"];
  return db ? `riloyd-kyc-v1:${db}` : null;
}
