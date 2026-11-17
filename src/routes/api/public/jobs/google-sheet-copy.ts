import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { fillServerEnvAliases } from "@/lib/server-env";

/** Scheduled: copies new and changed form records to the Google Sheet and uploaded documents to Google Drive. */
// Lovable's scheduler sends POST; Vercel Cron sends GET with "Authorization: Bearer <CRON_SECRET>". Both need the secret.
async function run({ request }: { request: Request }) {
  fillServerEnvAliases(process.env as Record<string, string | undefined>);
  const authFailure = await authenticateCronRequest(request);
  if (authFailure) return authFailure;
  const { runGoogleMirror } = await import("@/lib/google-mirror.server");
  try {
    const result = await runGoogleMirror();
    if (result.rows || result.documents || result.failures.length)
      console.log("Google sheet copy", JSON.stringify(result));
    if (result.failures.length) {
      const { reportIntegration } = await import("@/lib/integrations/store.server");
      await reportIntegration("google_sheets", false, `Google Sheet / Drive copy failed for ${result.failures.length} item(s): ${String(JSON.stringify(result.failures)).slice(0, 300)}`);
    }
    return Response.json(
      { ok: result.failures.length === 0, ...result },
      { status: result.failures.length ? 503 : 200 },
    );
  } catch (e) {
    console.error("Google sheet copy failed; will retry on the next run", e);
    const { reportIntegration } = await import("@/lib/integrations/store.server");
    await reportIntegration("google_sheets", false, `Google Sheet / Drive copy stopped: ${e instanceof Error ? e.message : "unknown error"}`);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Copy failed" },
      { status: 503 },
    );
  }
}

export const Route = createFileRoute("/api/public/jobs/google-sheet-copy")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: run,
      POST: run,
    },
  },
});
