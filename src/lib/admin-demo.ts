// Demo admin preview: lets the owner look through the admin screens without the live backend.
// It is not a login: it creates no session, unlocks no server data and is offered only on preview/development addresses.

export const DEMO_ADMIN_EMAIL = "demo@riloyd.demo";

/** Preview and development addresses only; the published site never offers demo mode. */
export function isDemoHost(hostname: string, dev = false): boolean {
  if (dev) return true;
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".lovableproject.com") || /^id-preview--[a-z0-9-]+\.lovable\.app$/.test(host);
}

/** Clearly fictional sample figures and rows for the demo overview. */
export const demoStats = [
  { label: "Scholarship registrations", value: 128, note: "42 waiting for payment ID" },
  { label: "Young Innovators", value: 64, note: "11 new this week" },
  { label: "Website enquiries", value: 37, note: "5 unread" },
  { label: "Foundation forms", value: 19, note: "3 pending review" },
] as const;

export const demoRecent = [
  { name: "Sample Student A", form: "Scholarship · ₹25,000", state: "Madhya Pradesh", status: "Payment ID shared" },
  { name: "Sample Student B", form: "Sponsorship", state: "Rajasthan", status: "Waiting for payment" },
  { name: "Sample Guardian C", form: "Young Innovators · Class 9", state: "Uttar Pradesh", status: "New" },
  { name: "Sample Founder D", form: "Funding Programme", state: "Delhi", status: "Under review" },
  { name: "Sample Visitor E", form: "Website enquiry", state: "Maharashtra", status: "Replied" },
] as const;
