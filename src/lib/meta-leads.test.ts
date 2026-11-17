import { describe, expect, it } from "vitest";
import { contactFromLeadFields, leadgenIdsFromWebhook, metaLeadSourceId, verifyMetaSignature } from "./meta-leads";

async function sign(body: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return "sha256=" + Array.from(sig, b => b.toString(16).padStart(2, "0")).join("");
}

describe("Meta lead webhook", () => {
  it("accepts a delivery signed with the App Secret", async () => {
    const body = '{"object":"page"}';
    expect(await verifyMetaSignature(body, await sign(body, "s3cret"), "s3cret")).toBe(true);
  });
  it("rejects a wrong or missing signature", async () => {
    const body = '{"object":"page"}';
    expect(await verifyMetaSignature(body, await sign(body, "other"), "s3cret")).toBe(false);
    expect(await verifyMetaSignature(body, null, "s3cret")).toBe(false);
    expect(await verifyMetaSignature(body + " ", await sign(body, "s3cret"), "s3cret")).toBe(false);
  });
  it("gives the same lead the same CRM source ID every time", async () => {
    const a = await metaLeadSourceId("1234567890");
    expect(a).toBe(await metaLeadSourceId("1234567890"));
    expect(a).not.toBe(await metaLeadSourceId("1234567891"));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("reads only leadgen changes", () => {
    expect(leadgenIdsFromWebhook({ object: "page", entry: [{ changes: [{ field: "leadgen", value: { leadgen_id: "444555666" } }, { field: "feed", value: { leadgen_id: "1" } }] }] })).toEqual(["444555666"]);
  });
  it("maps form answers to contact details", () => {
    expect(contactFromLeadFields([{ name: "first_name", values: ["Asha"] }, { name: "last_name", values: ["Verma"] }, { name: "email", values: ["asha@example.com"] }, { name: "phone_number", values: ["+919800000000"] }])).toMatchObject({ fullName: "Asha Verma", email: "asha@example.com", phone: "+919800000000" });
  });
});
