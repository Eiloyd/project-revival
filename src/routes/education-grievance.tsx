import { createFileRoute } from "@tanstack/react-router";
import { EducationPolicyPage } from "@/components/education-policy-page";
import { educationGrievance } from "@/lib/education-support/legal";
export const Route = createFileRoute("/education-grievance")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Student Grievance & Contact | RILOYD Education Support" }, { name: "description", content: "Contact RILOYD about scholarship applications, payment concerns, exam rules, privacy and disputed decisions." }, { property: "og:title", content: "Student Grievance & Contact | RILOYD" }, { property: "og:description", content: "Official contact and safe evidence guidance for scholarship concerns." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <EducationPolicyPage title={["Grievance & programme contact", "शिकायत और कार्यक्रम संपर्क"]} intro={["For application and payment concerns, use the existing official email: info@riloyd.in. A named grievance officer and response timetable still need to be confirmed.", "आवेदन व भुगतान समस्या के लिए वर्तमान आधिकारिक ईमेल info@riloyd.in इस्तेमाल करें। नामित शिकायत अधिकारी व प्रतिक्रिया समय की पुष्टि बाकी है।"]} clauses={educationGrievance} />,
});