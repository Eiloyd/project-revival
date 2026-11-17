// Browser-safe: copies of this site served from other hosts send scholarship form actions to this project's
// published Lovable site, so every response reaches this project's database and Google Sheet.

/** Published Lovable address of this project; empty until the remix is published (then every host saves directly). */
export const HOME_ORIGIN = "";

export type EducationAction = "start" | "payment" | "lookup" | "progress" | "submit" | "referral";

const lovableHost = (host: string) => host === "localhost" || host === "127.0.0.1" || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com") || host.endsWith(".lovable.dev");

/** "" when this build is served by this project; otherwise the published Lovable address. */
export function homeBaseFor(host: string, home: string = HOME_ORIGIN): string {
  if (lovableHost(host) || !home) return "";
  return home;
}
export function educationHomeBase(): string {
  if (typeof window === "undefined") return "";
  return homeBaseFor(window.location.hostname);
}

export async function callEducationHome<R>(base: string, action: EducationAction, data: unknown): Promise<R> {
  let res: Response;
  try { res = await fetch(`${base}/api/public/education/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }); }
  catch { throw new Error("Could not connect. Please check your internet and try again."); }
  const body = (await res.json().catch(() => null)) as { result?: R; error?: string } | null;
  if (!res.ok || !body || !("result" in body)) throw new Error(body?.error || "Please try again in a few minutes.");
  return body.result as R;
}

/** Wraps a server function so builds outside this project send the same call to the published Lovable site. */
export function viaHome<A, R>(fn: (opts: { data: A }) => Promise<R>, action: EducationAction): (opts: { data: A }) => Promise<R> {
  return opts => {
    const base = educationHomeBase();
    return base ? callEducationHome<R>(base, action, opts.data) : fn(opts);
  };
}
