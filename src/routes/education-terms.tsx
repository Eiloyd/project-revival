import { createFileRoute } from "@tanstack/react-router";
import { EducationPolicyPage } from "@/components/education-policy-page";
import { educationTerms } from "@/lib/education-support/legal";
export const Route = createFileRoute("/education-terms")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Scholarship Terms & Conditions | RILOYD Education Support" }, { name: "description", content: "English and Hindi terms covering RILOYD student registration, scholarship examination, award ceilings, payment, privacy and applicant protections." }, { property: "og:title", content: "Scholarship Terms & Conditions | RILOYD" }, { property: "og:description", content: "Student scholarship registration and examination terms in English and Hindi." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <EducationPolicyPage title={["Scholarship terms & conditions", "छात्रवृत्ति नियम और शर्तें"]} intro={["Terms covering student registration, scholarship examination, payment, support ceilings, privacy and applicant protections. Read these terms before accepting them and paying the registration fee.", "विद्यार्थी पंजीकरण, छात्रवृत्ति परीक्षा, भुगतान, सहायता सीमा, गोपनीयता और आवेदक संरक्षण के नियम। स्वीकार करने और पंजीकरण शुल्क भरने से पहले इन्हें पढ़ें।"]} clauses={educationTerms} />,
});