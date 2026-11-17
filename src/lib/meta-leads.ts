// Meta (Facebook/Instagram) Lead Ads → CRM: signature check, stable lead IDs and field mapping. Runs on the server (Web Crypto only).

const enc = new TextEncoder();

/** Checks Meta's X-Hub-Signature-256 header ("sha256=<hex>") against the raw request body and the Meta App Secret. */
export async function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !appSecret) return false;
  const match = /^sha256=([a-f0-9]{64})$/i.exec(header.trim());
  if (!match) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(rawBody)));
  const given = match[1]!.toLowerCase();
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i]! ^ parseInt(given.slice(i * 2, i * 2 + 2), 16);
  return diff === 0;
}

/** The same Meta lead always maps to the same CRM source ID, so repeated deliveries never create duplicate leads. */
export async function metaLeadSourceId(leadgenId: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`meta-lead:${leadgenId}`))).slice(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // version 5-style
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Leadgen IDs announced in a webhook delivery (page "leadgen" changes only). */
export function leadgenIdsFromWebhook(body: unknown): string[] {
  const ids: string[] = [];
  const entries = (body as { object?: string; entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return ids;
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const c = change as { field?: string; value?: { leadgen_id?: unknown } };
      const id = c?.field === "leadgen" ? String(c.value?.leadgen_id ?? "") : "";
      if (/^\d{5,30}$/.test(id) && !ids.includes(id)) ids.push(id);
    }
  }
  return ids.slice(0, 50);
}

export type MetaLeadField = { name?: string; values?: unknown[] };
export type MetaLeadContact = { fullName: string; email: string; phone: string; company: string; referralCode: string; city: string };

const first = (fields: MetaLeadField[], names: string[]) => {
  for (const f of fields) {
    const key = String(f.name ?? "").toLowerCase().replace(/[\s-]+/g, "_");
    if (names.includes(key)) { const v = f.values?.find(x => typeof x === "string" && x.trim()); if (typeof v === "string") return v.trim(); }
  }
  return "";
};

/** Maps Meta Instant Form answers (standard and common custom question names) to CRM contact fields. */
export function contactFromLeadFields(fields: MetaLeadField[] | undefined): MetaLeadContact {
  const f = Array.isArray(fields) ? fields : [];
  const firstName = first(f, ["first_name"]);
  const lastName = first(f, ["last_name"]);
  const fullName = first(f, ["full_name", "name"]) || [firstName, lastName].filter(Boolean).join(" ");
  return {
    fullName: fullName.slice(0, 200) || "Meta Ads lead",
    email: first(f, ["email", "work_email"]).slice(0, 320),
    phone: first(f, ["phone_number", "phone", "mobile", "mobile_number", "whatsapp_number"]).slice(0, 40),
    company: first(f, ["company_name", "company", "business_name"]).slice(0, 150),
    referralCode: first(f, ["referral_code", "employee_code", "coordinator_code"]).slice(0, 40),
    city: first(f, ["city"]).slice(0, 100),
  };
}
