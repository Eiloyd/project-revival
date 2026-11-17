import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "./ui/button";
import { legalVersion, type LegalClause } from "@/lib/education-support/legal";
import { useFees } from "@/hooks/use-fees";
import { withCurrentEducationFees } from "@/lib/payment-options";

export function EducationPolicyLinks({ hindi = false }: { hindi?: boolean }) {
  return <nav aria-label={hindi ? "शिक्षा सहायता नीतियाँ" : "Education Support policies"} className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-edu-royal">
    <Link to="/education-syllabus">{hindi ? "परीक्षा और पाठ्यक्रम" : "Exam & syllabus"}</Link>
    <Link to="/education-terms">{hindi ? "नियम और शर्तें" : "Terms & conditions"}</Link>
    <Link to="/education-privacy">{hindi ? "गोपनीयता और cookies" : "Privacy & cookies"}</Link>
    <Link to="/education-refunds">{hindi ? "वापसी नीति" : "Refund policy"}</Link>
    <Link to="/education-grievance">{hindi ? "शिकायत और संपर्क" : "Grievance & contact"}</Link>
  </nav>;
}
export function EducationPolicyPage({ title, intro, clauses }: { title: [string, string]; intro: [string, string]; clauses: LegalClause[] }) {
  const [hindi, setHindi] = useState(false);
  const i = hindi ? 1 : 0;
  const fee = useFees();
  const withFees = (text: string) => withCurrentEducationFees(text, fee);
  return <main lang={hindi ? "hi" : "en"} className="education-support-page min-h-screen bg-edu-paper text-edu-ink">
    <div className="mx-auto max-w-[1000px] px-5 py-16 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><Link to="/education-support" className="text-sm font-bold text-edu-royal">← RILOYD Education Support</Link><Button variant="outline" size="sm" onClick={() => setHindi(!hindi)}><Languages size={16} />{hindi ? "English" : "हिंदी"}</Button></div>
      <p className="mt-10 text-xs font-semibold text-edu-ink/60">{legalVersion}</p>
      <h1 className="mt-3 text-3xl font-black text-edu-navy sm:text-4xl">{title[i]}</h1>
      <p className="mt-5 max-w-3xl text-base leading-relaxed">{intro[i]}</p>
      <div className="mt-8 border-y border-edu-navy/15 py-5"><EducationPolicyLinks hindi={hindi} /></div>
      <ol className="mt-10 space-y-9">{clauses.map((c, n) => <li key={c.title[0]} id={`clause-${n + 1}`} className="scroll-mt-8"><h2 className="text-xl font-bold text-edu-navy">{n + 1}. {c.title[i]}</h2><p className="mt-3 text-base leading-8 text-edu-ink/85">{withFees(c.text[i]).split("https://lovable.dev/privacy").map((text, part) => <span key={part}>{part > 0 && <a href="https://lovable.dev/privacy" className="font-semibold text-edu-royal underline">{hindi ? "Lovable की गोपनीयता नीति" : "Lovable's privacy policy"}</a>}{text}</span>)}</p></li>)}</ol>
      <p className="mt-12 border-t border-edu-navy/15 pt-6 text-sm text-edu-ink/70">{hindi ? "कानूनी समीक्षा आवश्यक है। सवाल:" : "Legal review is required. Questions:"} <a href="mailto:info@riloyd.in" className="font-bold text-edu-royal">info@riloyd.in</a></p>
    </div>
  </main>;
}