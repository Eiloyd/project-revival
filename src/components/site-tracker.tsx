import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Sends one page view per page opened and up to 10 browser errors per visit to Admin → Website analytics. */
function send(payload: object) {
  try {
    const b = JSON.stringify(payload);
    if (navigator.sendBeacon) navigator.sendBeacon("/api/public/track", new Blob([b], { type: "application/json" }));
    else void fetch("/api/public/track", { method: "POST", body: b, keepalive: true, headers: { "content-type": "application/json" } });
  } catch { /* never break the page */ }
}
function sid() {
  try { let s = sessionStorage.getItem("rl_sid"); if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("rl_sid", s); } return s; } catch { return "nosession"; }
}

export function SiteTracker() {
  const path = useRouterState({ select: s => s.location.pathname });
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current; first.current = false;
    const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    const utm = new URLSearchParams(location.search).get("utm_source") ?? undefined;
    send({ type: "view", sid: sid(), path, ref: isFirst ? document.referrer || undefined : undefined, utm: isFirst ? utm : undefined, loadMs: isFirst && nav ? Math.round(nav.duration) || undefined : undefined });
  }, [path]);
  useEffect(() => {
    let count = 0;
    const report = (kind: string, name: string | undefined, message: string, source?: string) => {
      if (count++ >= 10 || !message) return;
      send({ type: "error", sid: sid(), path: location.pathname, kind, name: name?.slice(0, 120), message: message.slice(0, 600), source: source?.slice(0, 300) });
    };
    const onError = (e: ErrorEvent | Event) => {
      if (e instanceof ErrorEvent) return report("error", e.error?.name, e.message || String(e.error), e.filename);
      const t = e.target as HTMLElement & { src?: string; href?: string };
      if (t && t !== (window as unknown) && (t.tagName === "IMG" || t.tagName === "SCRIPT" || t.tagName === "LINK" || t.tagName === "VIDEO")) report("resource", t.tagName, `${t.tagName.toLowerCase()} failed to load`, t.src || t.href);
    };
    const onRej = (e: PromiseRejectionEvent) => { const r = e.reason; report("unhandledrejection", r?.name, r?.message ?? String(r)); };
    window.addEventListener("error", onError, true); window.addEventListener("unhandledrejection", onRej);
    return () => { window.removeEventListener("error", onError, true); window.removeEventListener("unhandledrejection", onRej); };
  }, []);
  return null;
}
