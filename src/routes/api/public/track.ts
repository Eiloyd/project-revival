import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { classifySource, parseAgent } from "@/lib/site-analytics/rules";

/** Website analytics intake: page views and browser errors. Same-site only, sizes capped, no personal data stored. */
const str = (n: number) => z.string().trim().max(n);
const body = z.discriminatedUnion("type", [
  z.object({ type: z.literal("view"), sid: str(64).min(4), path: str(300).min(1), ref: str(500).optional(), utm: str(60).optional(), loadMs: z.number().int().min(0).max(120000).optional() }),
  z.object({ type: z.literal("error"), sid: str(64).optional(), path: str(300).min(1), kind: z.enum(["error", "unhandledrejection", "resource"]), name: str(120).optional(), message: str(600).min(1), source: str(300).optional() }),
]);

async function handle({ request }: { request: Request }) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== url.host) return new Response(null, { status: 403 });
  const text = await request.text();
  if (text.length > 4000) return new Response(null, { status: 413 });
  let parsed;
  try { parsed = body.safeParse(JSON.parse(text)); } catch { return new Response(null, { status: 400 }); }
  if (!parsed.success) return new Response(null, { status: 400 });
  const d = parsed.data;
  const ua = parseAgent(request.headers.get("user-agent") ?? "");
  if (/bot|crawl|spider|headless/i.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  const path = d.path.split("?")[0]!.split("#")[0]!;
  // Analytics is best-effort: with no database configured (e.g. preview after disconnecting), skip silently.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return new Response(null, { status: 204 });
  try {
    await record(d, path, request, url, ua);
  } catch (e) {
    console.error("[track] failed to record", e instanceof Error ? e.message : e);
  }
  return new Response(null, { status: 204 });
}

async function record(d: z.infer<typeof body>, path: string, request: Request, url: URL, ua: ReturnType<typeof parseAgent>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (d.type === "view") {
    let refHost: string | null = null;
    try { refHost = d.ref ? new URL(d.ref).host : null; } catch { refHost = null; }
    const source = classifySource(refHost, url.host, d.utm);
    if (source === "internal") refHost = null;
    await supabaseAdmin.from("site_page_views").insert({ session_id: d.sid, path, referrer_host: refHost, source, device: ua.device, browser: ua.browser, os: ua.os, country: (request.headers.get("cf-ipcountry") ?? "").slice(0, 8) || null, load_ms: d.loadMs ?? null });
  } else {
    await supabaseAdmin.from("site_errors").insert({ session_id: d.sid ?? null, path, kind: d.kind, name: d.name ?? null, message: d.message, source: d.source?.split("?")[0] ?? null, browser: ua.browser, device: ua.device });
  }
}

export const Route = createFileRoute("/api/public/track")({ staticData: { sitemap: false }, server: { handlers: { POST: handle } } });
