import { createFileRoute } from "@tanstack/react-router";
import { EducationPolicyPage } from "@/components/education-policy-page";
import { educationPrivacy } from "@/lib/education-support/legal";
export const Route = createFileRoute("/education-privacy")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Student Privacy & Cookies Notice | RILOYD Education Support" }, { name: "description", content: "How RILOYD Education Support handles application details, Google copies, private student records, payments, browser storage and Lovable analytics." }, { property: "og:title", content: "Student Privacy & Cookies | RILOYD" }, { property: "og:description", content: "Application data, service providers, device storage and visitor analytics notice." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <EducationPolicyPage title={["Student privacy & cookies notice", "विद्यार्थी गोपनीयता और cookies नोटिस"]} intro={["What this website collects, where application copies go and how to raise a privacy request. This draft describes current services; it does not certify legal compliance.", "यह वेबसाइट क्या लेती है, आवेदन प्रतियाँ कहाँ जाती हैं और गोपनीयता अनुरोध कैसे करें। यह वर्तमान सेवाओं का ड्राफ्ट है, कानूनी अनुपालन प्रमाण नहीं।"]} clauses={educationPrivacy} />,
});