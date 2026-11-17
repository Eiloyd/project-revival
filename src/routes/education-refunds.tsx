import { createFileRoute } from "@tanstack/react-router";
import { EducationPolicyPage } from "@/components/education-policy-page";
import { educationRefunds } from "@/lib/education-support/legal";
export const Route = createFileRoute("/education-refunds")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Registration Refund & Cancellation Policy | RILOYD Education Support" }, { name: "description", content: "RILOYD student registration non-refundable fee policy, statutory rights and payment issue contact." }, { property: "og:title", content: "Scholarship Registration Refund Policy | RILOYD" }, { property: "og:description", content: "Non-refundable fees, cancellations and payment concerns for Education Support." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <EducationPolicyPage title={["Refund & cancellation policy", "वापसी और रद्दीकरण नीति"]} intro={["Registration fees are non-refundable under programme policy, subject to mandatory legal rights. Payment does not guarantee scholarship selection or disbursement.", "कार्यक्रम नीति में अनिवार्य कानूनी अधिकारों के अधीन पंजीकरण शुल्क वापस नहीं होता। भुगतान से छात्रवृत्ति चयन या राशि मिलने की गारंटी नहीं।"]} clauses={educationRefunds} />,
});