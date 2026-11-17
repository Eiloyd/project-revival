// Fills the backend variable names this app reads from the names other hosts provide
// (for example the Vercel Supabase integration). Only fills a name that is missing; never overwrites.
// Called from server request middleware with process.env; holds no values itself.

export const SERVER_ENV_ALIASES: Record<string, readonly string[]> = {
  SUPABASE_URL: ["NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"],
  SUPABASE_PUBLISHABLE_KEY: [
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ],
  SUPABASE_SERVICE_ROLE_KEY: ["SUPABASE_SECRET_KEY"],
  SUPABASE_PROJECT_ID: ["VITE_SUPABASE_PROJECT_ID"],
  // Vercel Cron sends its CRON_SECRET as the Bearer token for scheduled jobs.
  LOVABLE_CRON_SECRET: ["CRON_SECRET"],
};

/** Returns the names that were filled (names only, never values). */
export function fillServerEnvAliases(env: Record<string, string | undefined>): string[] {
  const filled: string[] = [];
  for (const [name, sources] of Object.entries(SERVER_ENV_ALIASES)) {
    if (env[name]) continue;
    const source = sources.find((s) => env[s]);
    if (source) {
      env[name] = env[source];
      filled.push(name);
    }
  }
  return filled;
}
