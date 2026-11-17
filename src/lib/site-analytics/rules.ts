/** Browser-safe rules for the website analytics: traffic source, device, and plain-language error help. */
export type Source = "direct" | "google" | "search" | "facebook" | "instagram" | "whatsapp" | "youtube" | "linkedin" | "twitter" | "email" | "ads" | "referral" | "internal";

export function classifySource(referrerHost: string | null | undefined, siteHost: string, utmSource?: string | null): Source {
  const utm = (utmSource ?? "").toLowerCase();
  if (/(ads|cpc|paid)/.test(utm)) return "ads";
  const h = (referrerHost || utm || "").toLowerCase().replace(/^www\./, "");
  if (!h) return "direct";
  if (h === siteHost.replace(/^www\./, "")) return "internal";
  if (/google\./.test(h) || h === "google") return "google";
  if (/(bing|yahoo|duckduckgo|yandex|ecosia)/.test(h)) return "search";
  if (/(facebook|fb\.)/.test(h) || h === "fb") return "facebook";
  if (/instagram/.test(h)) return "instagram";
  if (/(whatsapp|wa\.me)/.test(h)) return "whatsapp";
  if (/(youtube|youtu\.be)/.test(h)) return "youtube";
  if (/(linkedin|lnkd)/.test(h)) return "linkedin";
  if (/(twitter|t\.co|x\.com)/.test(h)) return "twitter";
  if (/(mail|email|newsletter)/.test(h)) return "email";
  return "referral";
}

export function parseAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return { device, browser, os };
}

export type ErrorHelp = { title: string; why: string; fix: string; severity: "high" | "medium" | "low" };

/** Turns a raw browser error into: what it is, why it happened, and what to do. */
export function explainError(kind: string, message: string): ErrorHelp {
  const m = message.toLowerCase();
  if (/chunkloaderror|loading chunk|failed to fetch dynamically imported module|importing a module script failed/.test(m))
    return { title: "Page part could not load", why: "The visitor had an old copy of the site open while a new version was published, or their internet dropped.", fix: "Usually fixes itself on refresh. If it keeps happening on the same page, republish and ask visitors to refresh.", severity: "low" };
  if (/failed to fetch|networkerror|network request failed|load failed|err_internet/.test(m))
    return { title: "Internet / connection problem", why: "The visitor's connection dropped or a request to the server was blocked (weak mobile data, ad blocker, firewall).", fix: "Nothing to fix if rare. If many visitors hit it on one page, check that page's form or service is working.", severity: "low" };
  if (/resizeobserver loop/.test(m))
    return { title: "Harmless layout warning", why: "The browser reports that a box resized twice in one frame. It does not affect visitors.", fix: "No action needed.", severity: "low" };
  if (/(permission denied|row-level security|42501|not authori[sz]ed|jwt|401|403)/.test(m))
    return { title: "Access refused", why: "A page tried to read or save something the visitor is not allowed to (signed out, session expired, or missing access).", fix: "Ask the person to sign in again. If staff with the right role still see it, check their role in Users & access.", severity: "medium" };
  if (/(too many|rate limit|429)/.test(m))
    return { title: "Too many attempts", why: "The visitor (or a bot) tried an action too many times in a short period, so the safety limit stopped it.", fix: "Normal protection. Visitor should wait 15 minutes. If real customers complain often, the limit can be raised.", severity: "low" };
  if (/(timeout|timed out|504|502|503|500|server error)/.test(m))
    return { title: "Server was slow or failed", why: "The server or an outside service (payment, Google, AI) did not answer in time.", fix: "Check Automation centre and Integrations for failures. If it repeats on one form, share the page and time with the developer.", severity: "high" };
  if (/(undefined is not|cannot read propert|is not a function|null is not|is not defined|typeerror|referenceerror)/.test(m))
    return { title: "Code bug on the page", why: "The page expected some information that was missing, so part of the screen crashed.", fix: "Note the page and time, then ask the developer (or Lovable chat) to fix this exact message.", severity: "high" };
  if (kind === "resource" || /(image|script|stylesheet).*(load|404)|404/.test(m))
    return { title: "File or picture missing", why: "A picture, video or file linked on the page could not be found (deleted, renamed or wrong link).", fix: "Open the page, find the broken picture or link, and upload it again or correct the link.", severity: "medium" };
  if (kind === "unhandledrejection")
    return { title: "Background action failed", why: "Something the page did in the background (saving, loading data) failed without showing a message.", fix: "If it repeats, ask the developer to add a clear message for this case.", severity: "medium" };
  return { title: "Other error", why: "The browser reported an unexpected problem.", fix: "If it repeats many times on the same page, share the message with the developer.", severity: "medium" };
}

export const sourceLabels: Record<Source, string> = { direct: "Direct / typed link", google: "Google", search: "Other search", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp", youtube: "YouTube", linkedin: "LinkedIn", twitter: "X / Twitter", email: "Email", ads: "Paid ads", referral: "Other websites", internal: "Same site" };
