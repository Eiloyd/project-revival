import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Languages, Clock3, ListChecks, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationPolicyLinks } from "@/components/education-policy-page";
import { scholarshipExam, syllabusTracks } from "@/lib/education-support/exam";

export const Route = createFileRoute("/education-syllabus")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Scholarship Exam & Category-wise Syllabus | RILOYD" }, { name: "description", content: "RILOYD scholarship exam: 50 questions in 40 minutes, +2 correct and -1.5 wrong; separate syllabi for Classes 4–12, Diploma, UG, PG and competitive-exam aspirants." }, { property: "og:title", content: "Scholarship Exam & Syllabus | RILOYD" }, { property: "og:description", content: "Category-matched exam preparation, marking and potential scholarship bands." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SyllabusPage,
});
function SyllabusPage() {
  const [hindi, setHindi] = useState(false);
  const [trackId, setTrackId] = useState("4-5");
  const i = hindi ? 1 : 0;
  const track = syllabusTracks.find(t => t.id === trackId) ?? syllabusTracks[0];
  if (!track) return null;
  return <main lang={hindi ? "hi" : "en"} className="education-support-page min-h-screen bg-edu-paper text-edu-ink"><div className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><Link to="/education-support" className="text-sm font-bold text-edu-royal">← RILOYD Education Support</Link><Button variant="outline" size="sm" onClick={() => setHindi(!hindi)}><Languages size={16} />{hindi ? "English" : "हिंदी"}</Button></div>
    <h1 className="mt-10 text-3xl font-black text-edu-navy sm:text-4xl">{hindi ? "छात्रवृत्ति परीक्षा और पाठ्यक्रम" : "Scholarship exam & syllabus"}</h1>
    <p className="mt-5 max-w-3xl text-base leading-relaxed">{hindi ? "तर्क, अनुप्रयोग और प्रमाण आधारित चुनौतीपूर्ण परीक्षा — वर्तमान कक्षा, विषय और तैयारी स्तर के अनुसार। तारीख और परीक्षा माध्यम अभी घोषित नहीं; यहाँ ऑनलाइन परीक्षा उपलब्ध नहीं।" : "A demanding assessment of reasoning, application and evidence, matched to the student's current class, discipline and preparation level. Date and delivery mode are not yet announced; no online exam is available here."}</p>
    <div className="mt-8 grid gap-5 border-y border-edu-navy/15 py-6 sm:grid-cols-3">{[{ Icon: ListChecks, text: `${scholarshipExam.questions} ${hindi ? "प्रश्न" : "questions"}` }, { Icon: Clock3, text: `${scholarshipExam.minutes} ${hindi ? "मिनट" : "minutes"}` }, { Icon: Award, text: `${scholarshipExam.maximumMarks} ${hindi ? "अधिकतम अंक" : "maximum marks"}` }].map(({ Icon, text }) => <p key={text} className="flex items-center gap-3 font-bold text-edu-navy"><Icon size={22} />{text}</p>)}</div>
    <h2 className="mt-10 text-2xl font-bold text-edu-navy">{hindi ? "अंक और सहायता सीमा" : "Marking & award ceilings"}</h2>
    <ul className="mt-4 space-y-3 text-base leading-7"><li>{hindi ? "सही: +2 · गलत: −1.5 · छोड़ा: 0। शुद्ध स्कोर/100 से प्रतिशत; ऊपर rounding नहीं।" : "Correct: +2 · Wrong: −1.5 · Unanswered: 0. Percentage uses net marks out of 100, with no upward rounding."}</li><li>{hindi ? "80%–95% (95 सहित): माँगी राशि के अधिकतम 50% पर विचार। 95% से ऊपर: अधिकतम 100%, आवेदन राशि से ज्यादा नहीं। 80% से कम: परीक्षा-आधारित छात्रवृत्ति नहीं।" : "80%–95% inclusive: consideration for up to 50% of the requested amount. Above 95%: up to 100%, never beyond the requested amount. Below 80%: no exam-based scholarship."}</li><li>{hindi ? "उदाहरण: 44 सही और 6 गलत =79; 45 सही और 5 गलत =82.5; 49 सही और 1 गलत =96.5। अंतिम सहायता सत्यापन/समीक्षा के अधीन, गारंटी नहीं।" : "Examples: 44 correct + 6 wrong = 79; 45 correct + 5 wrong = 82.5; 49 correct + 1 wrong = 96.5. Final support requires verification and review; it is not guaranteed."}</li><li>{hindi ? "परीक्षा में AI/अनधिकृत मदद और धोखाधड़ी निषिद्ध। प्रमाणित उल्लंघन: आवेदन अस्वीकृत और शुल्क वापसी नहीं, अनिवार्य कानूनी अधिकारों के अधीन।" : "AI/unauthorised assistance during the exam and fraudulent activity are prohibited. Confirmed violations: application rejected and no fee refund, subject to mandatory legal rights."}</li></ul>
    <label className="mt-10 block max-w-xl text-sm font-bold text-edu-navy">{hindi ? "विद्यार्थी समूह चुनें" : "Student group"}<select className="mt-2 w-full rounded-md border border-edu-navy/20 bg-edu-paper px-3 py-3 text-base text-edu-ink" value={trackId} onChange={e => setTrackId(e.target.value)}>{syllabusTracks.map(t => <option key={t.id} value={t.id}>{t.title[i]}</option>)}</select></label>
    <h2 className="mt-8 text-2xl font-bold text-edu-navy">{track.title[i]}</h2>
    <p className="mt-3 text-sm leading-7 text-edu-ink/70">{hindi ? "समूह का दायरा वर्तमान कक्षा/वर्ष तक सीमित करें। 11–12, डिप्लोमा, UG/PG और प्रतियोगी में घोषित विषय/लक्षित परीक्षा ही लें। कठिनाई उचित बहु-चरण तर्क से होगी; जानबूझकर अंक दबाना नहीं।" : "Restrict the group envelope to the student's current class/year. Match Classes 11–12, Diploma, UG/PG and competitive papers to the declared discipline or target exam. Difficulty comes from valid multi-step reasoning, not deliberate score suppression."}</p>
    <div className="mt-6 divide-y divide-edu-navy/15">{track.sections.map(s => <section key={s.title[0]} className="py-6"><div className="flex flex-wrap items-baseline justify-between gap-3"><h3 className="text-lg font-bold text-edu-navy">{s.title[i]}</h3><p className="text-sm font-bold text-edu-royal">{s.questions} {hindi ? "प्रश्न" : "questions"} · {s.questions * 2} {hindi ? "अंक" : "marks"}</p></div><p className="mt-3 text-base leading-8">{s.topics[i]}</p></section>)}</div>
    <div className="mt-10 border-t border-edu-navy/15 pt-6"><EducationPolicyLinks hindi={hindi} /></div>
  </div></main>;
}