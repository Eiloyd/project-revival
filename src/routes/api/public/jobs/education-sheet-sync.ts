import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { fillServerEnvAliases } from "@/lib/server-env";

/** Scheduled: copies scholarship answers that only reached the Google Sheet into the database once it is available. */
// Lovable's scheduler sends POST; Vercel Cron sends GET with "Authorization: Bearer <CRON_SECRET>". Both need the secret.
async function run({ request }: { request: Request }) {
  fillServerEnvAliases(process.env as Record<string, string | undefined>);
  const authFailure = await authenticateCronRequest(request);
  if (authFailure) return authFailure;
  const { syncWithSheet } = await import("@/lib/education-support/registration-store.server");
  try {
    const result = await syncWithSheet();
    if (result.imported || result.updated || result.appended || result.skipped.length)
      console.log("Education sheet sync", JSON.stringify(result));
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("Education sheet sync failed; will retry on the next run", e);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Sync failed" },
      { status: 503 },
    );
  }
}

export const Route = createFileRoute("/api/public/jobs/education-sheet-sync")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: run,
      POST: run,
    },
  },
});
