export type LegalClause = { title: [string, string]; text: [string, string] };
export const legalVersion = "14 November 2026";
const clause = (en: string, hi: string, text: string, hindi: string): LegalClause => ({ title: [en, hi], text: [text, hindi] });

const coreEducationTerms: LegalClause[] = [
  clause("Programme operator and scope", "कार्यक्रम संचालक और दायरा", "These terms concern RILOYD Foundation's Student Scholarship & Sponsorship Registration, presented by RILOYD, a unit of RISHISHWAR INDUSTRY PRIVATE LIMITED, CIN U85500MP2023PTC068770. They address registration, payment references, eligibility review, the proposed scholarship examination and potential support. They do not create a university admission, government benefit, employment relationship or guaranteed financial entitlement.", "ये नियम RILOYD, RISHISHWAR INDUSTRY PRIVATE LIMITED की इकाई, CIN U85500MP2023PTC068770, द्वारा प्रस्तुत RILOYD Foundation विद्यार्थी छात्रवृत्ति व स्पॉन्सरशिप पंजीकरण के हैं। इनमें पंजीकरण, भुगतान संदर्भ, पात्रता समीक्षा, प्रस्तावित परीक्षा और संभावित सहायता शामिल हैं। ये प्रवेश, सरकारी लाभ, रोजगार या निश्चित आर्थिक अधिकार नहीं बनाते।"),
  clause("Examination announcements", "परीक्षा घोषणाएँ", "The syllabus supports preparation. Examination dates, delivery mode, admission arrangements and results are communicated separately by the programme team. Do not treat a policy page as an examination booking or assume a venue or date before its official announcement.", "पाठ्यक्रम तैयारी में मदद करता है। परीक्षा तारीख, माध्यम, प्रवेश और परिणाम टीम अलग बताएगी। नीति पेज को परीक्षा बुकिंग न मानें और घोषणा से पहले स्थान या तारीख न मानें।"),
  clause("Reading before payment", "भुगतान से पहले पढ़ना", "Review the selected support option, registration fee, examination rules, syllabus, privacy notice and refund policy before paying. A parent or legal guardian must review them for a minor. If information is unclear or an accessibility requirement has not been addressed, contact the programme team before proceeding rather than treating an advertisement, referral or verbal statement as an award promise.", "भुगतान से पहले चुना विकल्प, शुल्क, परीक्षा नियम, पाठ्यक्रम, गोपनीयता और वापसी नीति पढ़ें। नाबालिग के लिए अभिभावक समीक्षा करें। जानकारी अस्पष्ट हो या पहुँच-संबंधी जरूरत न बताई गई हो तो पहले टीम से पूछें; विज्ञापन, रेफ़रल या मौखिक बात को सहायता का वादा न मानें।"),
  clause("Eligible student categories", "विद्यार्थी श्रेणियाँ", "Registration categories include school students in Classes 4–12, undergraduate students, postgraduate students, diploma students and students preparing for a competitive examination. Select the category that describes the present application and enter truthful educational information. Category availability is an invitation to apply, not confirmation that an institution, qualification, coaching course or individual application has already been approved.", "श्रेणियों में कक्षा 4–12, स्नातक, स्नातकोत्तर, डिप्लोमा और प्रतियोगी परीक्षा की तैयारी वाले विद्यार्थी हैं। वर्तमान आवेदन के अनुसार सही श्रेणी और शिक्षा जानकारी दें। श्रेणी उपलब्ध होना आवेदन का अवसर है, संस्था, योग्यता, कोचिंग या व्यक्ति की पहले से मंजूरी नहीं।"),
  clause("Diploma applicants", "डिप्लोमा आवेदक", "Diploma applicants should identify the actual diploma course, branch, institution, current year or semester and academic session. The examination syllabus must match that declared branch and level. A healthcare, management or other non-engineering diploma should not be assessed using an unrelated engineering paper. Recognition and current enrollment may be checked during eligibility review using appropriate evidence requested securely by the team.", "डिप्लोमा में वास्तविक कोर्स, शाखा, संस्था, वर्ष/सेमेस्टर और सत्र बताएँ। परीक्षा घोषित शाखा व स्तर के अनुसार हो। स्वास्थ्य, प्रबंधन या दूसरे गैर-इंजीनियरिंग डिप्लोमा को असंबंधित इंजीनियरिंग पेपर से नहीं जाँचा जाए। टीम सुरक्षित माध्यम से पात्रता और नामांकन प्रमाण माँग सकती है।"),
  clause("Competitive-exam applicants", "प्रतियोगी परीक्षा आवेदक", "A competitive-exam applicant must state the target examination and preparation level or stage. Coaching enrollment is not mandatory; self-study is an available preparation mode. The scholarship examination is independent of the target examination's recruiting or admitting body. Registration does not guarantee a government job, rank, admission, examination qualification or endorsement by any external examination authority.", "प्रतियोगी आवेदक लक्षित परीक्षा व तैयारी स्तर बताएँ। कोचिंग अनिवार्य नहीं, स्व-अध्ययन उपलब्ध है। छात्रवृत्ति परीक्षा लक्षित परीक्षा की भर्ती/प्रवेश संस्था से स्वतंत्र है। पंजीकरण सरकारी नौकरी, रैंक, प्रवेश, परीक्षा उत्तीर्णता या बाहरी प्राधिकरण का समर्थन सुनिश्चित नहीं करता।"),
  clause("Minors and guardian responsibility", "नाबालिग और अभिभावक", "Students under eighteen must register with a parent or legal guardian's consent and supervision. The guardian should review financial commitments, confirm contact details and oversee sensitive information entry. Guardian consent does not allow the guardian to answer examination questions for the student. Requests for legitimate accessibility support should be raised separately before the examination without compromising independent academic performance.", "अठारह से कम विद्यार्थी अभिभावक की सहमति व देखरेख में पंजीकरण करें। अभिभावक शुल्क, संपर्क और संवेदनशील जानकारी की समीक्षा करें। सहमति का अर्थ विद्यार्थी के बदले परीक्षा के उत्तर देना नहीं है। उचित सुलभता सहायता पहले माँगें, स्वतंत्र शैक्षणिक प्रदर्शन बना रहे।"),
  clause("Accurate identity and contact details", "सही पहचान और संपर्क", "Use the student's real name, date of birth, educational category and contact information, and obtain permission before entering another person's details. Incorrect information may delay verification or lead to an eligibility decision against the application. A genuine typographical error should be reported for correction; deliberate impersonation or concealment is treated differently from an honestly disclosed mistake.", "विद्यार्थी का वास्तविक नाम, जन्मतिथि, श्रेणी व संपर्क दें और दूसरे व्यक्ति की जानकारी के लिए अनुमति लें। गलत जानकारी सत्यापन रोक सकती है या पात्रता प्रभावित कर सकती है। वास्तविक टाइप गलती सुधार हेतु बताएँ; जानबूझकर पहचान बदलना या तथ्य छिपाना ईमानदार गलती से अलग है।"),
  clause("Education and requested support", "शिक्षा और माँगी सहायता", "The applied amount means the education-support amount requested through the selected option, not the registration fee or an unlimited claim. The existing scholarship options have maximum potential amounts of ₹25,000 and ₹50,000. Any eventual award remains within the requested amount and the selected option's ceiling. Sponsorship has a separate review and is not assigned an invented guaranteed amount.", "Applied amount चुने विकल्प में माँगी शिक्षा सहायता है, पंजीकरण शुल्क या असीमित दावा नहीं। वर्तमान छात्रवृत्ति विकल्पों की अधिकतम संभावित राशि ₹25,000 और ₹50,000 है। अंतिम सहायता माँगी राशि व चुनी सीमा के भीतर होगी। स्पॉन्सरशिप अलग समीक्षा है, उसकी कोई मनगढ़ंत निश्चित राशि नहीं।"),
  clause("Registration fees", "पंजीकरण शुल्क", "The current registration fees are ₹149 for sponsorship, ₹249 for the scholarship option up to ₹25,000 and ₹599 for the option up to ₹50,000. Check the actual payment page and disclosed total before authorising payment. A fee buys registration processing, not scholarship selection, a particular examination score, admission to another institution or a promise to repay the fee after rejection.", "वर्तमान शुल्क स्पॉन्सरशिप के लिए ₹149, ₹25,000 तक छात्रवृत्ति के लिए ₹249 और ₹50,000 तक के लिए ₹599 है। भुगतान से पहले वास्तविक पेज और कुल राशि देखें। शुल्क पंजीकरण प्रक्रिया के लिए है, चयन, स्कोर, प्रवेश या अस्वीकृति पर वापसी का वादा नहीं।"),
  clause("Non-refundable registration policy", "गैर-वापसी पंजीकरण नीति", "Registration fees are non-refundable under the programme policy, including withdrawal, absence, low scores, non-selection, rejection and confirmed misconduct. Paying the fee does not create a refundable deposit or investment. This policy cannot override a refund, remedy or protection that applicable law makes mandatory, and it does not authorise the operator to retain funds that were never properly due.", "कार्यक्रम नीति में पंजीकरण शुल्क वापस नहीं होता, जैसे वापसी लेना, अनुपस्थिति, कम अंक, चयन न होना, अस्वीकृति या सिद्ध अनुचित व्यवहार। शुल्क जमा निवेश नहीं है। नीति कानून द्वारा अनिवार्य वापसी, उपाय व संरक्षण को नहीं हटाती और अनुचित रूप से प्राप्त राशि रखने का अधिकार नहीं देती।"),
  clause("Payment service and receipts", "भुगतान सेवा और रसीद", "Payment is processed through the configured Zoho Checkout page or other payment destination explicitly displayed for the selected option. Keep the provider's receipt and transaction reference. RILOYD does not request UPI PINs, card security codes, banking passwords or one-time passwords through this application. Do not pay a personal account or send sensitive payment credentials to a coordinator claiming to guarantee selection.", "भुगतान चुने विकल्प के प्रदर्शित Zoho Checkout या स्पष्ट अन्य माध्यम पर करें। प्रदाता की रसीद और संदर्भ रखें। RILOYD आवेदन में UPI PIN, कार्ड सुरक्षा कोड, बैंक पासवर्ड या OTP नहीं माँगता। चयन की गारंटी बताने वाले निजी खाते या कोऑर्डिनेटर को संवेदनशील भुगतान विवरण न दें।"),
  clause("Payment ID and acknowledgement", "पेमेंट आईडी और पावती", "Basic registration details remain in the device draft before the payment ID is shared. After the payment reference is submitted, the application can issue the Registration ID and acknowledgement number. Receiving those numbers or downloading the acknowledgement PDF is not proof that funds have been reconciled, that the full application is complete or that a scholarship has been approved.", "पेमेंट आईडी भेजने से पहले मूल जानकारी डिवाइस ड्राफ्ट में रहती है। संदर्भ भेजने पर पंजीकरण आईडी व पावती मिल सकती है। संख्या या PDF मिलने का अर्थ भुगतान मिलान, पूरा आवेदन जमा होना या छात्रवृत्ति मंजूरी नहीं है।"),
  clause("Reference verification and duplicate payments", "संदर्भ सत्यापन और दोहरा भुगतान", "A submitted payment ID is checked against payment evidence and the selected registration option. Never reuse another applicant's reference or invent a reference to bypass payment. If the bank debits you but the page fails, retain the receipt and contact the team before paying again. Duplicate or misdirected transactions need factual review with the payment provider; no automatic refund outcome is promised.", "पेमेंट आईडी का प्रमाण और चुने विकल्प से मिलान होगा। दूसरे का संदर्भ या नकली आईडी न दें। राशि कटे और पेज विफल हो तो रसीद रखें और फिर भुगतान से पहले टीम से संपर्क करें। दोहरे/गलत लेनदेन की प्रदाता के साथ तथ्य-जाँच होगी; स्वतः वापसी का वादा नहीं।"),
  clause("Completing the application", "आवेदन पूरा करना", "Payment and acknowledgement are intermediate steps, not final submission. Complete the education, personal, guardian where required, coordinator, bank/identity and declaration sections and review the final answers. A partial record may be visible to authorised staff for follow-up but does not mean the student is selected. Check the final submission state instead of relying only on the payment receipt.", "भुगतान व पावती बीच के चरण हैं, अंतिम आवेदन नहीं। शिक्षा, व्यक्तिगत, आवश्यक अभिभावक, कोऑर्डिनेटर, बैंक/पहचान और घोषणाएँ भरें तथा समीक्षा करें। आंशिक रिकॉर्ड अधिकृत टीम को फॉलोअप हेतु दिख सकता है, चयन नहीं। केवल रसीद नहीं, अंतिम जमा स्थिति देखें।"),
  clause("Examination structure", "परीक्षा संरचना", "The scholarship examination has fifty questions, a forty-minute duration and a maximum of one hundred marks. The syllabus allocations total fifty questions for each student group. Candidates must follow the official paper instructions and answer independently. An examination date, delivery mode and admission arrangements must be announced separately; this policy page does not itself start or book a timed examination.", "छात्रवृत्ति परीक्षा में पचास प्रश्न, चालीस मिनट और अधिकतम सौ अंक हैं। हर समूह के पाठ्यक्रम में कुल पचास प्रश्न हैं। आधिकारिक निर्देशों के अनुसार स्वतंत्र उत्तर दें। तारीख, माध्यम और प्रवेश व्यवस्था अलग घोषित होंगे; यह पेज परीक्षा शुरू या बुक नहीं करता।"),
  clause("Correct, incorrect and unanswered responses", "सही, गलत और छोड़े उत्तर", "Each correct answer earns two marks and each incorrect answer deducts one and a half marks. An unanswered question contributes zero marks under this policy. Net marks equal two times correct answers minus one and a half times wrong answers; net marks can be negative. Percentage is calculated against the one-hundred-mark maximum, not only the questions attempted or the highest candidate's score.", "सही उत्तर पर दो अंक, गलत पर डेढ़ अंक कटेंगे। छोड़ा प्रश्न शून्य अंक है। शुद्ध अंक = सही ×2 − गलत ×1.5; अंक ऋणात्मक भी हो सकते हैं। प्रतिशत सौ अंकों के आधार पर होगा, प्रयास किए प्रश्न या टॉपर के अंक पर नहीं।"),
  clause("Score integrity and thresholds", "अंकों की शुद्धता और सीमा", "Use the actual net score without rounding upward to qualify for a higher scholarship band. For example, forty-four correct and six incorrect answers produce seventy-nine marks, not eighty-eight marks; forty-five correct and five incorrect produce eighty-two and a half marks. Correct-answer percentage alone cannot establish scholarship eligibility because penalties for incorrect answers are part of the published assessment.", "अधिक सहायता पाने के लिए अंक ऊपर गोल न करें। उदाहरण: 44 सही और 6 गलत =79 अंक, 88 नहीं; 45 सही और 5 गलत =82.5 अंक। केवल सही उत्तर का प्रतिशत पात्रता तय नहीं करता क्योंकि गलत उत्तर की कटौती भी मूल्यांकन का भाग है।"),
  clause("Eighty through ninety-five percent", "अस्सी से पचानवे प्रतिशत", "A valid net score from eighty percent through ninety-five percent, including exactly ninety-five, qualifies for consideration for support up to fifty percent of the applied amount. This is a maximum consideration band, not an automatic payout. For a ₹25,000 requested scholarship, that band's ceiling is ₹12,500, subject to eligibility evidence, available support and the final documented award decision.", "80% से 95% शुद्ध स्कोर, ठीक 95 सहित, माँगी राशि के अधिकतम 50% सहायता पर विचार योग्य है। यह विचार की अधिकतम सीमा है, स्वतः भुगतान नहीं। ₹25,000 आवेदन में सीमा ₹12,500 होगी, पात्रता प्रमाण, उपलब्ध सहायता और अंतिम लिखित निर्णय के अधीन।"),
  clause("Scores above ninety-five percent", "पचानवे से ऊपर अंक", "A valid net score strictly above ninety-five percent qualifies for consideration for support up to one hundred percent of the applied amount. One hundred percent is a ceiling, not a guarantee that the full amount will be paid. No award may exceed the amount applied for or the selected scholarship option's maximum, even when the examination score is one hundred out of one hundred.", "95% से सख्ती से ऊपर शुद्ध स्कोर पर माँगी राशि के अधिकतम 100% पर विचार होगा। 100% सीमा है, पूरी राशि की गारंटी नहीं। 100 में 100 मिलने पर भी सहायता आवेदन राशि या चुने विकल्प की सीमा से अधिक नहीं होगी।"),
  clause("Scores below eighty percent", "अस्सी प्रतिशत से कम", "A score below eighty percent does not qualify for an examination-based scholarship under these bands. This is not a finding of fraud or a judgment of the student's worth. Sponsorship, if applied for, follows a separate review without an invented exam-based guarantee. Low marks and non-selection do not make the registration fee refundable under the programme policy, subject to mandatory legal rights.", "80% से कम अंक इन सीमाओं में परीक्षा-आधारित छात्रवृत्ति के योग्य नहीं हैं। यह धोखाधड़ी या विद्यार्थी के मूल्य पर निर्णय नहीं। आवेदन वाली स्पॉन्सरशिप अलग समीक्षा है, निश्चित परीक्षा-आधारित वादा नहीं। कम अंक/चयन न होने से नीति में शुल्क वापसी नहीं, अनिवार्य कानूनी अधिकार बने रहते हैं।"),
  clause("Final award review", "अंतिम सहायता समीक्षा", "Reaching a score band does not replace identity, enrollment, educational-need or application verification. The team must communicate the actual approved amount and any applicable disbursement requirements before the applicant treats support as confirmed. Registration, payment reconciliation, eligibility, examination performance and final selection are distinct stages; none should be described as another merely because a form or PDF has been generated.", "अंक सीमा पाने से पहचान, नामांकन, शिक्षा जरूरत या आवेदन सत्यापन खत्म नहीं होता। सहायता निश्चित मानने से पहले टीम वास्तविक मंजूर राशि व लागू भुगतान आवश्यकताएँ बताए। पंजीकरण, भुगतान मिलान, पात्रता, परीक्षा प्रदर्शन और चयन अलग चरण हैं; फ़ॉर्म या PDF से एक को दूसरा न मानें।"),
  clause("Category-matched syllabus", "श्रेणी के अनुसार पाठ्यक्रम", "School syllabus groups are Classes 4–5, 6–8, 9–10 and 11–12. Diploma, undergraduate, postgraduate and competitive-exam applicants have separate tracks. A grouped syllabus is a preparation envelope, not permission to test a younger student's unstudied higher-class material indiscriminately. The actual question paper must respect the student's current class, declared stream, branch, year and target examination where applicable.", "स्कूल समूह 4–5, 6–8, 9–10 और 11–12 हैं; डिप्लोमा, UG, PG व प्रतियोगी के अलग ट्रैक हैं। समूह पाठ्यक्रम तैयारी का दायरा है, छोटी कक्षा को अनपढ़ी ऊँची कक्षा से बिना भेद जाँचना नहीं। पेपर वर्तमान कक्षा, विषय, शाखा, वर्ष और लक्ष्य के अनुसार होगा।"),
  clause("Difficulty and fair shortlisting", "कठिनाई और निष्पक्ष चयन", "Questions should be demanding because they require understanding, multi-step reasoning, interpretation and application rather than because they use obscure facts or misleading wording. The syllabus does not promise that any particular proportion of students will fail or remain below eighty percent. Selection must be based on valid assessments and review, not artificial score suppression, undisclosed cutoffs or unrelated subject requirements.", "कठिनाई समझ, बहु-चरण तर्क, व्याख्या और अनुप्रयोग से हो, दुर्लभ तथ्य या भ्रमित शब्दों से नहीं। पाठ्यक्रम किसी खास अनुपात को फेल/80 से नीचे रखने का वादा नहीं। चयन सही मूल्यांकन से हो, कृत्रिम अंक कटौती, छिपी सीमा या असंबंधित विषय से नहीं।"),
  clause("Independent work and AI prohibition", "स्वतंत्र कार्य और AI निषेध", "Using any AI assistant, chatbot, generative tool, automated solver or AI-generated answer to complete the scholarship examination is prohibited. Candidates must not obtain live answers or submit another person's work as their own. Confirmed prohibited AI use results in rejection and no registration-fee refund under the policy. Legitimate preparation before the exam is distinct from unauthorised assistance during assessment.", "परीक्षा पूरी करने में AI सहायक, चैटबॉट, जनरेटिव साधन, स्वचालित हल या AI उत्तर निषिद्ध हैं। लाइव उत्तर या दूसरे का काम अपना न दें। सिद्ध निषिद्ध AI उपयोग पर अस्वीकृति और नीति में शुल्क वापसी नहीं। परीक्षा से पहले सामान्य तैयारी, मूल्यांकन में अनधिकृत सहायता से अलग है।"),
  clause("Fraud and prohibited conduct", "धोखाधड़ी और निषिद्ध व्यवहार", "Impersonation, forged documents, false payment references, collusion, leaked questions, unauthorised answer sharing, system tampering and deliberate material misrepresentation are prohibited. Confirmed fraudulent activity results in rejection and forfeiture of the registration fee under the policy, subject to applicable law. The operator may retain relevant evidence for review and lawful reporting but must not publicly expose minors or unnecessary private details.", "छद्म पहचान, जाली दस्तावेज़, झूठे भुगतान संदर्भ, मिलीभगत, लीक प्रश्न, अनधिकृत उत्तर, सिस्टम छेड़छाड़ और जानबूझकर महत्वपूर्ण झूठ निषिद्ध हैं। सिद्ध धोखाधड़ी पर कानूनी सीमा में अस्वीकृति व शुल्क वापसी नहीं। समीक्षा/कानूनी रिपोर्ट हेतु प्रमाण रखे जा सकते हैं, नाबालिग या निजी जानकारी सार्वजनिक नहीं।"),
  clause("Evidence and human misconduct review", "प्रमाण और मानवीय समीक्षा", "A suspicion or an automated AI-detection score alone is not conclusive proof of misconduct. Relevant facts should be reviewed by an authorised person, and the applicant or guardian should have an opportunity to explain a disputed allegation. The decision should identify the substantive reason without exposing confidential security methods or other students' information. Legitimate accessibility tools must be considered separately from answer-generating assistance.", "शंका या स्वचालित AI पहचान स्कोर अकेला अनुचित व्यवहार का निर्णायक प्रमाण नहीं। अधिकृत व्यक्ति तथ्य जाँचे और आवेदक/अभिभावक को विवादित आरोप समझाने का अवसर मिले। निर्णय उचित कारण बताए, सुरक्षा तरीके या दूसरों की जानकारी न खोले। सुलभता साधन और उत्तर बनाने वाले साधन अलग हैं।"),
  clause("Permitted materials and assistance", "अनुमत सामग्री और सहायता", "The team must announce whether calculators, scratch paper, reference materials or accessibility aids are permitted before the examination. Until approved, candidates should not assume external tools or another person's assistance are authorised. A guardian may supervise registration but cannot solve the examination. Any authorised accommodation should preserve the student's own assessed reasoning and avoid disadvantaging candidates who need legitimate support.", "टीम परीक्षा से पहले बताए कि कैलकुलेटर, रफ कागज, संदर्भ या सुलभता साधन अनुमत हैं या नहीं। अनुमति के बिना बाहरी साधन/व्यक्ति की मदद अनुमत न मानें। अभिभावक पंजीकरण में देखरेख कर सकते हैं, परीक्षा हल नहीं। सुविधा स्वतंत्र तर्क जाँचे और जरूरत वाले विद्यार्थी के साथ अन्याय न हो।"),
  clause("Technical interruptions and exam scheduling", "तकनीकी रुकावट और कार्यक्रम", "No online examination or proctoring service is currently provided by these pages. Before an assessment is launched, official instructions should cover connection failures, timer interruptions, alternative arrangements, accessibility requests and cancellation or rescheduling. Candidates must not assume an automatic retest, additional time or particular compensation. Any arrangements remain subject to disclosed conditions and rights that cannot be excluded by contract.", "इन पेजों पर अभी ऑनलाइन परीक्षा/निगरानी सेवा नहीं है। शुरू करने से पहले कनेक्शन विफलता, टाइमर, विकल्प, सुलभता, रद्द/नई तारीख के आधिकारिक निर्देश हों। स्वतः रीटेस्ट, समय या मुआवज़ा न मानें। व्यवस्था प्रकाशित शर्तों और अनिवार्य अधिकारों के अधीन होगी।"),
  clause("Corrections and question challenges", "सुधार और प्रश्न आपत्ति", "If a question, scoring calculation or application detail appears incorrect, contact the programme team with the reference and a concise explanation. Do not circulate protected examination content publicly. An answer-key review process, objection window and result timetable have not yet been announced; those operational details must be provided before the examination, and these terms do not invent a deadline or charge for raising a concern.", "प्रश्न, अंक गणना या आवेदन गलत लगे तो संदर्भ व संक्षिप्त कारण टीम को दें। सुरक्षित परीक्षा सामग्री सार्वजनिक न बाँटें। उत्तर कुंजी समीक्षा, आपत्ति समय और परिणाम कार्यक्रम अभी घोषित नहीं; परीक्षा से पहले बताने होंगे। ये नियम कोई मनगढ़ंत समय-सीमा या आपत्ति शुल्क नहीं जोड़ता।"),
  clause("Documents and secure verification", "दस्तावेज़ और सुरक्षित सत्यापन", "Provide only information reasonably needed for application review and respond to genuine verification requests through an authorised channel. The current registration collects bank and Aadhaar details as text rather than document uploads. Sensitive fields are encrypted and excluded from the device draft and acknowledgement PDF. Collection necessity, alternative identity evidence and retention arrangements should be confirmed through the privacy contact before sensitive submission if unclear.", "आवेदन समीक्षा के लिए उचित जरूरी जानकारी ही दें और अधिकृत माध्यम से वास्तविक सत्यापन अनुरोध का जवाब दें। वर्तमान फ़ॉर्म बैंक/आधार लिखित लेता है, अपलोड नहीं। संवेदनशील जानकारी एन्क्रिप्टेड है, डिवाइस ड्राफ्ट/PDF में नहीं। जरूरत, वैकल्पिक पहचान या संग्रह अवधि अस्पष्ट हो तो पहले गोपनीयता संपर्क से पूछें।"),
  clause("Privacy and service providers", "गोपनीयता और सेवा प्रदाता", "Application information is processed in Lovable Cloud, with configured Google Sheets and Google Drive copies and authorised CRM access. Payment and externally embedded forms are handled by their respective providers. Read the separate privacy and cookies notice for purposes, recipients, device storage and visitor analytics. No confidentiality promise should be interpreted as a guarantee that every third-party service has identical retention or security settings.", "आवेदन Lovable Cloud में, configured Google Sheets/Drive प्रतियों और अधिकृत CRM के साथ संसाधित होता है। भुगतान व बाहरी फ़ॉर्म संबंधित प्रदाता संभालते हैं। उद्देश्य, प्राप्तकर्ता, डिवाइस संग्रह व analytics के लिए अलग नोटिस पढ़ें। गोपनीयता का अर्थ सभी बाहरी सेवाओं की समान सुरक्षा/अवधि की गारंटी नहीं।"),
  clause("Coordinators and referrals", "कोऑर्डिनेटर और रेफ़रल", "A coordinator or employee may help a student register and a referral code may route the application for authorised follow-up. Referral assistance does not confer the power to approve a scholarship, change the published marks or collect unofficial charges. Registering without a coordinator is available. Report anyone seeking passwords, OTPs or money in exchange for guaranteed selection to the official contact.", "कोऑर्डिनेटर/कर्मचारी पंजीकरण में मदद कर सकते हैं और कोड अधिकृत फॉलोअप तक भेज सकता है। इससे सहायता मंजूरी, अंक बदलने या अनौपचारिक शुल्क का अधिकार नहीं मिलता। बिना कोऑर्डिनेटर विकल्प है। चयन हेतु पासवर्ड, OTP या पैसे माँगने वाले की शिकायत आधिकारिक संपर्क पर करें।"),
  clause("Acknowledgement PDF and communication", "पावती PDF और संपर्क", "The downloadable acknowledgement records application references and the status available when generated. It is not a bank receipt, tax invoice, scholarship certificate or selection letter. Keep the payment provider's receipt separately. Messages from staff must be assessed against the official application status, and applicants should contact the team if a PDF, phone call or forwarded message appears to make an inconsistent financial promise.", "पावती PDF बनते समय के संदर्भ व स्थिति बताता है। यह बैंक रसीद, कर चालान, छात्रवृत्ति प्रमाणपत्र या चयन पत्र नहीं। प्रदाता की रसीद अलग रखें। कर्मचारी संदेश का आधिकारिक स्थिति से मिलान करें और असंगत आर्थिक वादा हो तो टीम से पूछें।"),
  clause("Support disbursement and limits", "सहायता भुगतान और सीमा", "A selected applicant must receive the actual award amount and conditions through an official decision before expecting disbursement. No fixed transfer date, instalment schedule or payment destination is promised in these terms. Any bank verification must be proportionate and secure. Award conditions cannot authorise transfers beyond the requested support amount or require the student to disclose bank passwords, PINs or one-time passwords.", "चयनित को वास्तविक राशि व शर्तों का आधिकारिक निर्णय मिले, तब भुगतान अपेक्षा करें। ये नियम निश्चित तारीख, किस्त या गंतव्य नहीं बताता। बैंक सत्यापन उचित और सुरक्षित हो। शर्तें माँगी राशि से अधिक हस्तांतरण या बैंक पासवर्ड, PIN, OTP माँगने का अधिकार नहीं देतीं।"),
  clause("Changes and prior applications", "बदलाव और पुराने आवेदन", "Material changes to eligibility, fees, syllabus or examination arrangements should be published clearly with a version or effective date and communicated to affected applicants. A later policy should not silently rewrite a fee already paid or a completed assessment. Applicants should keep the version reviewed at registration. Mandatory legal protections and any specifically communicated award commitment remain relevant when changes are proposed.", "पात्रता, शुल्क, पाठ्यक्रम या व्यवस्था में महत्वपूर्ण बदलाव तारीख/संस्करण सहित स्पष्ट हों और प्रभावित आवेदकों को बताए जाएँ। नई नीति पुराने भुगतान या पूरे मूल्यांकन को चुपचाप न बदले। पंजीकरण वाली प्रति रखें। बदलाव पर अनिवार्य संरक्षण व विशिष्ट लिखित सहायता प्रतिबद्धता लागू रहेगी।"),
  clause("Disputes and grievance contact", "विवाद और शिकायत संपर्क", "For registration, payment, scoring, misconduct or privacy concerns, write to info@riloyd.in with the acknowledgement or transaction reference and the issue. Do not send passwords or full financial credentials. These terms cannot restrict access to competent courts, consumer authorities or other mandatory remedies.", "पंजीकरण, भुगतान, अंक, अनुचित व्यवहार या गोपनीयता चिंता पर संदर्भ और समस्या info@riloyd.in भेजें। पासवर्ड या पूर्ण वित्तीय credentials न भेजें। ये नियम न्यायालय, उपभोक्ता प्राधिकरण या अनिवार्य उपाय नहीं रोकता।"),
  clause("Liability and non-waivable rights", "दायित्व और अनिवार्य अधिकार", "The programme does not guarantee an award, employment, admission or third-party payment availability. These limitations are not a blanket exemption from responsibility for unlawful conduct, fraud by the operator, negligence where liability cannot be excluded, or failure to provide mandatory consumer remedies. Nothing requires applicants to waive statutory rights, accept hidden charges or agree that every dispute is unreviewable at the operator's sole discretion.", "कार्यक्रम सहायता, रोजगार, प्रवेश या बाहरी भुगतान उपलब्धता की गारंटी नहीं। यह गैरकानूनी कार्य, संचालक धोखाधड़ी, कानूनी रूप से गैर-अपवर्जनीय लापरवाही या अनिवार्य उपभोक्ता उपाय से छूट नहीं। आवेदक को वैधानिक अधिकार छोड़ना, छिपा शुल्क स्वीकारना या हर विवाद को अपील-रहित मानना जरूरी नहीं।"),
  clause("Language and understanding", "भाषा और समझ", "English and Hindi communicate the same substantive rules. If wording appears inconsistent, ask the team for clarification before accepting an interpretation. Translation differences do not authorise hidden charges, undisclosed harsher conditions or removal of mandatory legal protections.", "अंग्रेज़ी और हिंदी समान मूल नियम बताते हैं। अर्थ अलग लगे तो टीम से स्पष्टता लें। अनुवाद अंतर छिपे शुल्क, अघोषित कठोर शर्त या अनिवार्य अधिकार हटाने की अनुमति नहीं देता।"),
];


const additionalEducationTerms: LegalClause[] = [
  {
    "title": [
      "Application identity — 1",
      "आवेदन की पहचान — 1"
    ],
    "text": [
      "Use the student’s own name, not the coordinator’s, so the application can be matched correctly. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "विद्यार्थी का नाम दें, कोऑर्डिनेटर का नहीं, जिससे आवेदन सही मिल सके। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 2",
      "आवेदन की पहचान — 2"
    ],
    "text": [
      "Match the date of birth to reliable evidence rather than estimating age to meet eligibility. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "जन्मतिथि विश्वसनीय प्रमाण के अनुसार दें, पात्रता पाने हेतु अनुमान न लगाएँ। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 3",
      "आवेदन की पहचान — 3"
    ],
    "text": [
      "Enter the present state accurately because state information forms part of the application reference. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "वर्तमान राज्य सही दें क्योंकि राज्य जानकारी आवेदन संदर्भ का भाग है। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 4",
      "आवेदन की पहचान — 4"
    ],
    "text": [
      "Use a district name that identifies the student’s location rather than a referral office. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "विद्यार्थी का जिला दें, रेफ़रल कार्यालय का नहीं। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 5",
      "आवेदन की पहचान — 5"
    ],
    "text": [
      "A shared family mobile is acceptable only when the authorised contact can receive application messages. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "परिवार का साझा मोबाइल तभी दें जब अधिकृत संपर्क आवेदन संदेश प्राप्त कर सके। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 6",
      "आवेदन की पहचान — 6"
    ],
    "text": [
      "Do not enter an unrelated person’s email merely to complete a required field. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "अनिवार्य खाने को भरने हेतु असंबंधित व्यक्ति का ईमेल न दें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 7",
      "आवेदन की पहचान — 7"
    ],
    "text": [
      "Report a change of phone number so important review messages are not sent to the wrong person. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "मोबाइल बदलने पर बताएँ ताकि समीक्षा संदेश गलत व्यक्ति को न जाएँ। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 8",
      "आवेदन की पहचान — 8"
    ],
    "text": [
      "Report a change of email through a verified channel rather than assuming an old address still works. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "ईमेल बदलने पर सत्यापित माध्यम से बताएँ, पुराने पते को चालू न मानें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 9",
      "आवेदन की पहचान — 9"
    ],
    "text": [
      "Use the correct spelling of the institution to reduce mistaken enrollment checks. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "संस्था की सही वर्तनी दें जिससे नामांकन जाँच में गलती कम हो। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 10",
      "आवेदन की पहचान — 10"
    ],
    "text": [
      "A nickname does not replace the name needed for official verification. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "आधिकारिक सत्यापन के नाम की जगह उपनाम न दें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 11",
      "आवेदन की पहचान — 11"
    ],
    "text": [
      "Do not borrow another student’s identity documents even with that student’s informal permission. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "दूसरे विद्यार्थी के पहचान दस्तावेज़ उसकी अनौपचारिक अनुमति पर भी न लें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 12",
      "आवेदन की पहचान — 12"
    ],
    "text": [
      "A guardian’s identity must not be presented as the student’s identity. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "अभिभावक की पहचान विद्यार्थी की पहचान के रूप में न दें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 13",
      "आवेदन की पहचान — 13"
    ],
    "text": [
      "Do not change the student category to obtain a paper unrelated to actual study. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "वास्तविक पढ़ाई से अलग पेपर पाने हेतु श्रेणी न बदलें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 14",
      "आवेदन की पहचान — 14"
    ],
    "text": [
      "Explain differing names in legitimate records instead of silently altering evidence. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "वैध रिकॉर्ड में नाम अलग हों तो कारण बताएँ, प्रमाण चुपचाप न बदलें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 15",
      "आवेदन की पहचान — 15"
    ],
    "text": [
      "Do not use a false date of birth to avoid guardian consent. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "अभिभावक सहमति से बचने हेतु झूठी जन्मतिथि न दें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 16",
      "आवेदन की पहचान — 16"
    ],
    "text": [
      "An application reference identifies a record, not proof that every identity field has been verified. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "आवेदन संदर्भ रिकॉर्ड पहचानता है, हर पहचान जानकारी सत्यापित होने का प्रमाण नहीं। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 17",
      "आवेदन की पहचान — 17"
    ],
    "text": [
      "A request to correct identity details should identify the field and the accurate replacement. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "पहचान सुधार अनुरोध में संबंधित खाना और सही जानकारी बताएँ। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 18",
      "आवेदन की पहचान — 18"
    ],
    "text": [
      "Do not publish identity evidence in public comments when seeking assistance. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "सहायता माँगते समय पहचान प्रमाण सार्वजनिक टिप्पणी में न डालें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "Application identity — 19",
      "आवेदन की पहचान — 19"
    ],
    "text": [
      "Staff must not infer fraud solely from a spelling difference without considering the explanation. Identity checks must relate to this student and this application; honest errors and deliberate misrepresentation are assessed separately.",
      "केवल वर्तनी अंतर से धोखाधड़ी न मानी जाए; कारण भी देखें। पहचान जाँच इसी विद्यार्थी और आवेदन से संबंधित हो; ईमानदार गलती और जानबूझकर झूठ अलग जाँचे जाएँ।"
    ]
  },
  {
    "title": [
      "School applicants — 1",
      "स्कूल आवेदक — 1"
    ],
    "text": [
      "School registration covers Classes 4–12; entering an unsupported class does not create eligibility. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "स्कूल पंजीकरण कक्षा 4–12 के लिए है; अन्य कक्षा लिखने से पात्रता नहीं बनती। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 2",
      "स्कूल आवेदक — 2"
    ],
    "text": [
      "Classes 4–5 use their own syllabus group, not the secondary-school group. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "कक्षा 4–5 अपना समूह लें, माध्यमिक समूह नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 3",
      "स्कूल आवेदक — 3"
    ],
    "text": [
      "Classes 6–8 use the middle-school track matched to the actual current class. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "कक्षा 6–8 वर्तमान कक्षा के अनुसार मध्य-स्कूल ट्रैक लें। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 4",
      "स्कूल आवेदक — 4"
    ],
    "text": [
      "Classes 9–10 use the secondary track with level-appropriate applications. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "कक्षा 9–10 उचित स्तर वाले माध्यमिक ट्रैक का उपयोग करें। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 5",
      "स्कूल आवेदक — 5"
    ],
    "text": [
      "Classes 11–12 must identify the stream so subject questions are relevant. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "कक्षा 11–12 धारा बताएँ जिससे विषय प्रश्न संबंधित हों। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 6",
      "स्कूल आवेदक — 6"
    ],
    "text": [
      "A Class 4 student should not be required to know an unstudied Class 5 topic merely because of grouping. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "केवल समूह के कारण कक्षा 4 विद्यार्थी से अनपढ़ा कक्षा 5 विषय न पूछा जाए। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 7",
      "स्कूल आवेदक — 7"
    ],
    "text": [
      "State the actual school board to support syllabus interpretation. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "पाठ्यक्रम समझने हेतु वास्तविक स्कूल बोर्ड बताएँ। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 8",
      "स्कूल आवेदक — 8"
    ],
    "text": [
      "State the school type truthfully rather than choosing one believed to attract more support. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "अधिक सहायता की उम्मीद में गलत स्कूल प्रकार न चुनें। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 9",
      "स्कूल आवेदक — 9"
    ],
    "text": [
      "Enter the current class, not the class hoped to be entered next year. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "वर्तमान कक्षा दें, अगले वर्ष की इच्छित कक्षा नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 10",
      "स्कूल आवेदक — 10"
    ],
    "text": [
      "Academic-session details should explain which school year the application concerns. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "शैक्षणिक सत्र से स्पष्ट हो कि आवेदन किस वर्ष का है। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 11",
      "स्कूल आवेदक — 11"
    ],
    "text": [
      "School address information should refer to the teaching institution rather than a private tutor. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "स्कूल पता शिक्षण संस्था का हो, निजी शिक्षक का नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 12",
      "स्कूल आवेदक — 12"
    ],
    "text": [
      "A school name alone is not sufficient evidence of present enrollment. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "केवल स्कूल नाम वर्तमान नामांकन का पर्याप्त प्रमाण नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 13",
      "स्कूल आवेदक — 13"
    ],
    "text": [
      "Changing schools should be reported if it affects the submitted education information. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "स्कूल बदलने से आवेदन जानकारी प्रभावित हो तो बताएँ। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 14",
      "स्कूल आवेदक — 14"
    ],
    "text": [
      "A board change should not silently move a student into an unsuitable examination track. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "बोर्ड बदलने से विद्यार्थी बिना सूचना अनुपयुक्त परीक्षा ट्रैक में न जाए। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 15",
      "स्कूल आवेदक — 15"
    ],
    "text": [
      "School assistance with registration does not permit teachers to answer the examination. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "स्कूल की पंजीकरण मदद से शिक्षक को परीक्षा उत्तर देने की अनुमति नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 16",
      "स्कूल आवेदक — 16"
    ],
    "text": [
      "Do not submit a sibling’s marks as the applicant’s school record. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "भाई-बहन के अंक आवेदक के रिकॉर्ड के रूप में न दें। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 17",
      "स्कूल आवेदक — 17"
    ],
    "text": [
      "A school stamp or letter must not be fabricated to strengthen an application. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "आवेदन मजबूत बनाने हेतु स्कूल मुहर या पत्र न गढ़ें। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 18",
      "स्कूल आवेदक — 18"
    ],
    "text": [
      "School verification should request relevant facts without seeking classmates’ private details. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "स्कूल सत्यापन में संबंधित तथ्य माँगें, सहपाठियों की निजी जानकारी नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "School applicants — 19",
      "स्कूल आवेदक — 19"
    ],
    "text": [
      "School-based referral does not guarantee scholarship selection for an entire class. Assessment must reflect the current class and studied material within the published grouped syllabus.",
      "स्कूल रेफ़रल पूरी कक्षा के चयन की गारंटी नहीं। मूल्यांकन प्रकाशित समूह पाठ्यक्रम में वर्तमान कक्षा और पढ़ी सामग्री के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 1",
      "डिप्लोमा अध्ययन — 1"
    ],
    "text": [
      "State the complete diploma course name rather than only writing diploma. Diploma review should consider the declared branch, current level and genuine institution records.",
      "केवल डिप्लोमा नहीं, पूरा कोर्स नाम दें। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 2",
      "डिप्लोमा अध्ययन — 2"
    ],
    "text": [
      "Identify the branch so technical assessment can match the field. Diploma review should consider the declared branch, current level and genuine institution records.",
      "शाखा बताएँ जिससे तकनीकी मूल्यांकन क्षेत्र से मेल खाए। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 3",
      "डिप्लोमा अध्ययन — 3"
    ],
    "text": [
      "Give the current year accurately rather than the course’s total duration. Diploma review should consider the declared branch, current level and genuine institution records.",
      "वर्तमान वर्ष सही दें, कोर्स की कुल अवधि नहीं। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 4",
      "डिप्लोमा अध्ययन — 4"
    ],
    "text": [
      "Where applicable, state the current semester to clarify academic progress. Diploma review should consider the declared branch, current level and genuine institution records.",
      "लागू होने पर वर्तमान सेमेस्टर दें जिससे प्रगति स्पष्ट हो। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 5",
      "डिप्लोमा अध्ययन — 5"
    ],
    "text": [
      "Use the actual institution name rather than a training agent’s business name. Diploma review should consider the declared branch, current level and genuine institution records.",
      "वास्तविक संस्था नाम दें, एजेंट के व्यवसाय का नहीं। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 6",
      "डिप्लोमा अध्ययन — 6"
    ],
    "text": [
      "Enter enrollment information only when it belongs to this student. Diploma review should consider the declared branch, current level and genuine institution records.",
      "नामांकन जानकारी तभी दें जब इसी विद्यार्थी की हो। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 7",
      "डिप्लोमा अध्ययन — 7"
    ],
    "text": [
      "Do not treat a short informal workshop as a recognised diploma without clarification. Diploma review should consider the declared branch, current level and genuine institution records.",
      "स्पष्टता बिना छोटी अनौपचारिक कार्यशाला को मान्यता प्राप्त डिप्लोमा न बताएँ। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 8",
      "डिप्लोमा अध्ययन — 8"
    ],
    "text": [
      "A non-engineering diploma requires field-relevant assessment, not a compulsory engineering paper. Diploma review should consider the declared branch, current level and genuine institution records.",
      "गैर-इंजीनियरिंग डिप्लोमा का संबंधित मूल्यांकन हो, अनिवार्य इंजीनियरिंग पेपर नहीं। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 9",
      "डिप्लोमा अध्ययन — 9"
    ],
    "text": [
      "Healthcare topics should test studied knowledge without asking the student to provide unlicensed treatment. Diploma review should consider the declared branch, current level and genuine institution records.",
      "स्वास्थ्य प्रश्न पढ़ी जानकारी जाँचें, बिना अनुमति उपचार कराने को न कहें। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 10",
      "डिप्लोमा अध्ययन — 10"
    ],
    "text": [
      "Management diploma questions should relate to declared studies, not unrelated mechanical design. Diploma review should consider the declared branch, current level and genuine institution records.",
      "प्रबंधन प्रश्न घोषित पढ़ाई से हों, असंबंधित यांत्रिक डिजाइन से नहीं। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 11",
      "डिप्लोमा अध्ययन — 11"
    ],
    "text": [
      "Practical reasoning may be assessed without requiring unsafe physical demonstrations. Diploma review should consider the declared branch, current level and genuine institution records.",
      "असुरक्षित भौतिक प्रदर्शन बिना व्यावहारिक तर्क जाँचा जा सकता है। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 12",
      "डिप्लोमा अध्ययन — 12"
    ],
    "text": [
      "Report a branch change when it makes earlier course information inaccurate. Diploma review should consider the declared branch, current level and genuine institution records.",
      "शाखा बदलने से पुरानी जानकारी गलत हो तो बताएँ। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 13",
      "डिप्लोमा अध्ययन — 13"
    ],
    "text": [
      "A distance or online study mode must be described honestly. Diploma review should consider the declared branch, current level and genuine institution records.",
      "दूरस्थ या ऑनलाइन अध्ययन ईमानदारी से बताएँ। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 14",
      "डिप्लोमा अध्ययन — 14"
    ],
    "text": [
      "Institution recognition may be reviewed; mentioning an institution is not an endorsement. Diploma review should consider the declared branch, current level and genuine institution records.",
      "संस्था मान्यता जाँची जा सकती है; नाम देना समर्थन नहीं। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 15",
      "डिप्लोमा अध्ययन — 15"
    ],
    "text": [
      "Do not manufacture laboratory attendance evidence for an online course. Diploma review should consider the declared branch, current level and genuine institution records.",
      "ऑनलाइन कोर्स हेतु नकली प्रयोगशाला उपस्थिति प्रमाण न बनाएँ। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 16",
      "डिप्लोमा अध्ययन — 16"
    ],
    "text": [
      "Course-fee claims should relate to actual education expenses rather than invented charges. Diploma review should consider the declared branch, current level and genuine institution records.",
      "कोर्स शुल्क दावा वास्तविक शिक्षा खर्च का हो, काल्पनिक राशि का नहीं। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 17",
      "डिप्लोमा अध्ययन — 17"
    ],
    "text": [
      "A completed diploma and ongoing diploma are different statuses and should not be interchanged. Diploma review should consider the declared branch, current level and genuine institution records.",
      "पूरा और चालू डिप्लोमा अलग स्थितियाँ हैं, एक को दूसरा न बताएँ। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 18",
      "डिप्लोमा अध्ययन — 18"
    ],
    "text": [
      "An institution transfer should be disclosed when it changes verification evidence. Diploma review should consider the declared branch, current level and genuine institution records.",
      "स्थानांतरण से सत्यापन प्रमाण बदलें तो जानकारी दें। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Diploma study — 19",
      "डिप्लोमा अध्ययन — 19"
    ],
    "text": [
      "A diploma application does not itself certify professional competence or licensing. Diploma review should consider the declared branch, current level and genuine institution records.",
      "डिप्लोमा आवेदन स्वयं पेशेवर योग्यता या लाइसेंस प्रमाणित नहीं करता। डिप्लोमा समीक्षा घोषित शाखा, स्तर और वास्तविक संस्था रिकॉर्ड पर हो।"
    ]
  },
  {
    "title": [
      "Higher education — 1",
      "उच्च शिक्षा — 1"
    ],
    "text": [
      "Select undergraduate only for an application concerning undergraduate study. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "स्नातक अध्ययन वाले आवेदन में ही स्नातक चुनें। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 2",
      "उच्च शिक्षा — 2"
    ],
    "text": [
      "Select postgraduate when the application concerns postgraduate study rather than a future aspiration. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "वर्तमान स्नातकोत्तर आवेदन में स्नातकोत्तर चुनें, भविष्य की इच्छा पर नहीं। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 3",
      "उच्च शिक्षा — 3"
    ],
    "text": [
      "State the degree title so the correct disciplinary track can be identified. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "डिग्री नाम दें जिससे सही विषय ट्रैक मिले। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 4",
      "उच्च शिक्षा — 4"
    ],
    "text": [
      "State a specialisation where it affects the proposed assessment. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "विशेषज्ञता मूल्यांकन प्रभावित करती हो तो बताएँ। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 5",
      "उच्च शिक्षा — 5"
    ],
    "text": [
      "Enter the current academic year rather than the graduation year alone. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "केवल उत्तीर्ण वर्ष नहीं, वर्तमान शैक्षणिक वर्ष दें। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 6",
      "उच्च शिक्षा — 6"
    ],
    "text": [
      "Postgraduate assessment should not assume every applicant studies the same research methods. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "स्नातकोत्तर में सभी के समान शोध तरीके पढ़ने की धारणा न हो। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 7",
      "उच्च शिक्षा — 7"
    ],
    "text": [
      "Undergraduate assessment should not require unrelated postgraduate material. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "स्नातक से असंबंधित स्नातकोत्तर सामग्री न पूछी जाए। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 8",
      "उच्च शिक्षा — 8"
    ],
    "text": [
      "Use the institution’s actual location to assist relevant verification. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "संबंधित सत्यापन हेतु संस्था का वास्तविक स्थान दें। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 9",
      "उच्च शिक्षा — 9"
    ],
    "text": [
      "Describe regular, distance or online study according to the actual arrangement. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "नियमित, दूरस्थ या ऑनलाइन वास्तविक व्यवस्था अनुसार बताएँ। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 10",
      "उच्च शिक्षा — 10"
    ],
    "text": [
      "Do not claim enrollment based only on an unaccepted admission enquiry. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "अस्वीकृत प्रवेश पूछताछ के आधार पर नामांकन न दावा करें। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 11",
      "उच्च शिक्षा — 11"
    ],
    "text": [
      "Report a discontinued course when it affects current eligibility. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "कोर्स छोड़ा हो और पात्रता प्रभावित हो तो बताएँ। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 12",
      "उच्च शिक्षा — 12"
    ],
    "text": [
      "An academic break may require explanation but is not automatically proof of fraud. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "शैक्षणिक विराम का कारण माँगा जा सकता है, स्वतः धोखाधड़ी प्रमाण नहीं। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 13",
      "उच्च शिक्षा — 13"
    ],
    "text": [
      "A research proposal should not be represented as an already awarded degree. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "शोध प्रस्ताव को प्राप्त डिग्री न बताएँ। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 14",
      "उच्च शिक्षा — 14"
    ],
    "text": [
      "Course-related data interpretation must remain suitable for the applicant’s year. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "कोर्स डेटा व्याख्या आवेदक के वर्ष के योग्य हो। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 15",
      "उच्च शिक्षा — 15"
    ],
    "text": [
      "Do not present another student’s project as evidence of personal academic progress. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "दूसरे का प्रोजेक्ट व्यक्तिगत प्रगति प्रमाण न बनाएँ। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 16",
      "उच्च शिक्षा — 16"
    ],
    "text": [
      "Fee information should identify the relevant session or term. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "शुल्क जानकारी संबंधित सत्र या अवधि बताए। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 17",
      "उच्च शिक्षा — 17"
    ],
    "text": [
      "Institutional scholarship already received should be disclosed when relevant to a requested support review. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "सहायता समीक्षा में संबंधित हो तो पहले मिली संस्थागत छात्रवृत्ति बताएँ। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 18",
      "उच्च शिक्षा — 18"
    ],
    "text": [
      "A degree-course category does not imply affiliation between RILOYD and the college. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "डिग्री श्रेणी RILOYD और कॉलेज के संबंध का दावा नहीं। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Higher education — 19",
      "उच्च शिक्षा — 19"
    ],
    "text": [
      "Any request to verify academic details should be limited to necessary records. Undergraduate and postgraduate tracks remain separate and are adapted to the declared discipline and year.",
      "शैक्षणिक सत्यापन अनुरोध आवश्यक रिकॉर्ड तक सीमित हो। स्नातक और स्नातकोत्तर ट्रैक अलग हैं और घोषित विषय व वर्ष के अनुसार बनते हैं।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 1",
      "प्रतियोगी तैयारी — 1"
    ],
    "text": [
      "Name the actual target examination instead of only saying competitive exam. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "केवल प्रतियोगी परीक्षा नहीं, वास्तविक लक्ष्य का नाम दें। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 2",
      "प्रतियोगी तैयारी — 2"
    ],
    "text": [
      "Identify prelims, mains or another relevant preparation stage. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "प्रारंभिक, मुख्य या संबंधित तैयारी चरण बताएँ। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 3",
      "प्रतियोगी तैयारी — 3"
    ],
    "text": [
      "Self-study applicants do not need to invent a coaching institution. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "स्व-अध्ययन आवेदक को काल्पनिक कोचिंग नहीं देनी है। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 4",
      "प्रतियोगी तैयारी — 4"
    ],
    "text": [
      "Coaching enrollment does not itself establish scholarship eligibility. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "कोचिंग नामांकन स्वयं छात्रवृत्ति पात्रता नहीं बनाता। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 5",
      "प्रतियोगी तैयारी — 5"
    ],
    "text": [
      "Civil-services topics should relate to the declared exam syllabus. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "सिविल सेवा विषय घोषित परीक्षा पाठ्यक्रम से हों। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 6",
      "प्रतियोगी तैयारी — 6"
    ],
    "text": [
      "SSC preparation should not be replaced by an unrelated civil-services specialist paper. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "SSC तैयारी की जगह असंबंधित सिविल सेवा विशेष पेपर न हो। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 7",
      "प्रतियोगी तैयारी — 7"
    ],
    "text": [
      "Banking preparation should use target-level quantitative and reasoning content. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "बैंकिंग तैयारी में लक्ष्य स्तर की गणना व तर्क सामग्री हो। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 8",
      "प्रतियोगी तैयारी — 8"
    ],
    "text": [
      "Railway preparation should be matched to the declared examination rather than all railway posts. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "रेलवे तैयारी घोषित परीक्षा से हो, सभी पदों से नहीं। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 9",
      "प्रतियोगी तैयारी — 9"
    ],
    "text": [
      "Medical entrance preparation should follow the appropriate declared science subjects. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "मेडिकल प्रवेश तैयारी संबंधित घोषित विज्ञान विषयों पर हो। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 10",
      "प्रतियोगी तैयारी — 10"
    ],
    "text": [
      "Engineering entrance preparation should not demand an unrelated law syllabus. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "इंजीनियरिंग प्रवेश में असंबंधित कानून पाठ्यक्रम न माँगा जाए। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 11",
      "प्रतियोगी तैयारी — 11"
    ],
    "text": [
      "Law entrance preparation should relate to the stated exam and stage. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "कानून प्रवेश तैयारी बताई परीक्षा और चरण से हो। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 12",
      "प्रतियोगी तैयारी — 12"
    ],
    "text": [
      "A scholarship application is not an application to the external exam authority. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "छात्रवृत्ति आवेदन बाहरी परीक्षा प्राधिकरण का आवेदन नहीं। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 13",
      "प्रतियोगी तैयारी — 13"
    ],
    "text": [
      "Students remain responsible for the external examination’s separate registration. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "बाहरी परीक्षा के अलग पंजीकरण की जिम्मेदारी विद्यार्थी की है। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 14",
      "प्रतियोगी तैयारी — 14"
    ],
    "text": [
      "No external exam fee is implied to be included in the scholarship registration fee. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "छात्रवृत्ति शुल्क में बाहरी परीक्षा शुल्क शामिल न मानें। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 15",
      "प्रतियोगी तैयारी — 15"
    ],
    "text": [
      "A scholarship score does not establish a government recruitment rank. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "छात्रवृत्ति अंक सरकारी भर्ती रैंक नहीं बनाते। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 16",
      "प्रतियोगी तैयारी — 16"
    ],
    "text": [
      "A coaching agent cannot promise a job through this registration. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "कोचिंग एजेंट इस पंजीकरण से नौकरी का वादा नहीं कर सकता। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 17",
      "प्रतियोगी तैयारी — 17"
    ],
    "text": [
      "Report a change of target exam if it affects the declared syllabus track. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "लक्ष्य परीक्षा बदलने से ट्रैक प्रभावित हो तो बताएँ। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 18",
      "प्रतियोगी तैयारी — 18"
    ],
    "text": [
      "Do not claim an external qualification merely because a scholarship acknowledgement was issued. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "पावती मिलने से बाहरी परीक्षा योग्यता का दावा न करें। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Competitive preparation — 19",
      "प्रतियोगी तैयारी — 19"
    ],
    "text": [
      "Study-resource advice is not an endorsement or guarantee of a coaching provider. The scholarship assessment is independent of recruitment and admission exams and must follow the declared target.",
      "अध्ययन साधन सलाह कोचिंग प्रदाता का समर्थन या गारंटी नहीं। छात्रवृत्ति मूल्यांकन भर्ती/प्रवेश परीक्षा से स्वतंत्र और घोषित लक्ष्य के अनुसार हो।"
    ]
  },
  {
    "title": [
      "Guardian participation — 1",
      "अभिभावक सहभागिता — 1"
    ],
    "text": [
      "A parent or legal guardian should review the terms before a minor accepts them. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "नाबालिग स्वीकृति से पहले माता-पिता या कानूनी अभिभावक नियम पढ़ें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 2",
      "अभिभावक सहभागिता — 2"
    ],
    "text": [
      "Guardian consent should be genuine rather than a box checked by an unrelated agent. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "सहमति वास्तविक हो, असंबंधित एजेंट की टिक नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 3",
      "अभिभावक सहभागिता — 3"
    ],
    "text": [
      "State the guardian relationship accurately to support safe communication. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "सुरक्षित संपर्क हेतु अभिभावक संबंध सही दें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 4",
      "अभिभावक सहभागिता — 4"
    ],
    "text": [
      "Use a guardian number that can receive verification communications. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "ऐसा अभिभावक नंबर दें जो सत्यापन संदेश पा सके। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 5",
      "अभिभावक सहभागिता — 5"
    ],
    "text": [
      "Guardians should understand that payment does not guarantee selection. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अभिभावक समझें कि भुगतान चयन की गारंटी नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 6",
      "अभिभावक सहभागिता — 6"
    ],
    "text": [
      "Guardians should supervise the entry of sensitive information on a trusted device. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अभिभावक विश्वसनीय डिवाइस पर संवेदनशील जानकारी भरना देखें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 7",
      "अभिभावक सहभागिता — 7"
    ],
    "text": [
      "A guardian may explain form questions but must not fabricate the child’s answers. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अभिभावक फ़ॉर्म प्रश्न समझाएँ, बच्चे के उत्तर न गढ़ें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 8",
      "अभिभावक सहभागिता — 8"
    ],
    "text": [
      "A guardian must not solve scholarship examination questions for the student. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अभिभावक विद्यार्थी के परीक्षा प्रश्न हल न करें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 9",
      "अभिभावक सहभागिता — 9"
    ],
    "text": [
      "A minor’s photograph or identity record should not be posted publicly to resolve a complaint. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "शिकायत हेतु नाबालिग फोटो या पहचान रिकॉर्ड सार्वजनिक न डालें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 10",
      "अभिभावक सहभागिता — 10"
    ],
    "text": [
      "A coordinator’s involvement does not replace legal guardian consent. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "कोऑर्डिनेटर सहभागिता कानूनी अभिभावक सहमति का विकल्प नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 11",
      "अभिभावक सहभागिता — 11"
    ],
    "text": [
      "Changes in the authorised guardian contact should be reported safely. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अधिकृत अभिभावक संपर्क बदलने पर सुरक्षित रूप से बताएँ। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 12",
      "अभिभावक सहभागिता — 12"
    ],
    "text": [
      "Guardians should retain payment receipts separately from the acknowledgement PDF. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अभिभावक रसीद पावती PDF से अलग रखें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 13",
      "अभिभावक सहभागिता — 13"
    ],
    "text": [
      "Where support is requested for a minor, any approval must still follow the stated review process. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "नाबालिग सहायता भी घोषित समीक्षा प्रक्रिया से मंजूर हो। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 14",
      "अभिभावक सहभागिता — 14"
    ],
    "text": [
      "Do not pressure a child to disclose passwords to a volunteer helping with registration. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "पंजीकरण मदद वाले स्वयंसेवक को पासवर्ड देने हेतु बच्चे पर दबाव न डालें। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 15",
      "अभिभावक सहभागिता — 15"
    ],
    "text": [
      "A guardian’s complaint should include the application reference rather than unnecessary identity details. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "अभिभावक शिकायत में आवेदन संदर्भ दें, अनावश्यक पहचान नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 16",
      "अभिभावक सहभागिता — 16"
    ],
    "text": [
      "Guardian assistance should preserve the child’s dignity during verification. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "सत्यापन में अभिभावक मदद बच्चे का सम्मान बनाए रखे। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 17",
      "अभिभावक सहभागिता — 17"
    ],
    "text": [
      "A disagreement between adults should not justify publishing the minor’s private information. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "वयस्क विवाद नाबालिग जानकारी प्रकाशित करने का आधार नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 18",
      "अभिभावक सहभागिता — 18"
    ],
    "text": [
      "Accessibility requests for minors should identify the needed support without unnecessary medical disclosure. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "नाबालिग सुलभता अनुरोध जरूरत बताए, अनावश्यक चिकित्सा विवरण नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Guardian participation — 19",
      "अभिभावक सहभागिता — 19"
    ],
    "text": [
      "Consent to registration is not permission to advertise a child’s story or images. A minor’s application requires informed guardian involvement without replacing the student’s independent examination work.",
      "पंजीकरण सहमति बच्चे की कहानी या तस्वीर का विज्ञापन करने की अनुमति नहीं। नाबालिग आवेदन में जानकारीपूर्ण अभिभावक सहभागिता हो, परीक्षा में विद्यार्थी का काम न बदले।"
    ]
  },
  {
    "title": [
      "Fee choices — 1",
      "शुल्क विकल्प — 1"
    ],
    "text": [
      "The sponsorship registration fee is ₹149, not a guaranteed sponsorship payment. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "स्पॉन्सरशिप पंजीकरण शुल्क ₹149 है, सुनिश्चित सहायता भुगतान नहीं। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 2",
      "शुल्क विकल्प — 2"
    ],
    "text": [
      "The up-to-₹25,000 scholarship option has a ₹249 registration fee. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "₹25,000 तक छात्रवृत्ति विकल्प का शुल्क ₹249 है। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 3",
      "शुल्क विकल्प — 3"
    ],
    "text": [
      "The up-to-₹50,000 scholarship option has a ₹599 registration fee. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "₹50,000 तक छात्रवृत्ति विकल्प का शुल्क ₹599 है। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 4",
      "शुल्क विकल्प — 4"
    ],
    "text": [
      "Select the intended fee option before opening its payment destination. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "भुगतान पेज खोलने से पहले इच्छित विकल्प चुनें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 5",
      "शुल्क विकल्प — 5"
    ],
    "text": [
      "A larger registration fee does not guarantee a larger final award. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "अधिक शुल्क अधिक अंतिम सहायता की गारंटी नहीं। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 6",
      "शुल्क विकल्प — 6"
    ],
    "text": [
      "The requested support amount is not calculated by multiplying the fee. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "माँगी सहायता शुल्क गुणा करके नहीं निकलती। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 7",
      "शुल्क विकल्प — 7"
    ],
    "text": [
      "Do not treat the registration fee as an investment earning interest. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "पंजीकरण शुल्क को ब्याज वाला निवेश न मानें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 8",
      "शुल्क विकल्प — 8"
    ],
    "text": [
      "Do not treat the fee as a refundable security deposit. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "शुल्क को वापसी योग्य सुरक्षा जमा न मानें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 9",
      "शुल्क विकल्प — 9"
    ],
    "text": [
      "Review the payment page total before approving a transaction. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "लेनदेन मंजूर करने से पहले कुल राशि देखें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 10",
      "शुल्क विकल्प — 10"
    ],
    "text": [
      "Question unexplained charges rather than assuming a coordinator may impose them. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "अस्पष्ट शुल्क पूछें, कोऑर्डिनेटर को अधिकार न मानें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 11",
      "शुल्क विकल्प — 11"
    ],
    "text": [
      "A referral code must not silently change the published fee. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "रेफ़रल कोड घोषित शुल्क चुपचाप न बदले। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 12",
      "शुल्क विकल्प — 12"
    ],
    "text": [
      "An agent cannot sell a guaranteed selection upgrade. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "एजेंट सुनिश्चित चयन का अतिरिक्त विकल्प नहीं बेच सकता। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 13",
      "शुल्क विकल्प — 13"
    ],
    "text": [
      "No award amount is promised for sponsorship merely because its fee was paid. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "स्पॉन्सरशिप शुल्क से निश्चित राशि का वादा नहीं। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 14",
      "शुल्क विकल्प — 14"
    ],
    "text": [
      "The selected scholarship ceiling is a maximum, not an amount automatically due. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "चुनी सीमा अधिकतम है, स्वतः देय राशि नहीं। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 15",
      "शुल्क विकल्प — 15"
    ],
    "text": [
      "Check inconsistent fee information with the official team before paying. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "शुल्क में अंतर हो तो भुगतान से पहले टीम से जाँचें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 16",
      "शुल्क विकल्प — 16"
    ],
    "text": [
      "Once a payment reference is shared, the form does not permit ordinary fee-option switching. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "संदर्भ भेजने के बाद फ़ॉर्म सामान्य विकल्प बदलाव नहीं देता। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 17",
      "शुल्क विकल्प — 17"
    ],
    "text": [
      "Do not submit a lower-option reference to claim a higher-option registration. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "कम विकल्प का संदर्भ अधिक विकल्प हेतु न दें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 18",
      "शुल्क विकल्प — 18"
    ],
    "text": [
      "Keep evidence of the selected option for payment reconciliation. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "भुगतान मिलान हेतु चुने विकल्प का प्रमाण रखें। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Fee choices — 19",
      "शुल्क विकल्प — 19"
    ],
    "text": [
      "Any later change in fees should be disclosed, not applied silently to an earlier payment. Fees pay for registration processing; support amounts are distinct and remain subject to review and limits.",
      "बाद का शुल्क बदलाव बताया जाए, पुराने भुगतान पर चुपचाप न लगे। शुल्क पंजीकरण प्रक्रिया का है; सहायता अलग है और समीक्षा व सीमा के अधीन है।"
    ]
  },
  {
    "title": [
      "Payment safety — 1",
      "भुगतान सुरक्षा — 1"
    ],
    "text": [
      "Check that the payment page belongs to the destination displayed by the form. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "जाँचें कि भुगतान पेज फ़ॉर्म के प्रदर्शित गंतव्य का है। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 2",
      "भुगतान सुरक्षा — 2"
    ],
    "text": [
      "Keep the provider’s transaction reference after payment. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान के बाद प्रदाता संदर्भ रखें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 3",
      "भुगतान सुरक्षा — 3"
    ],
    "text": [
      "Keep the transaction date so a disputed debit can be located. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "विवादित कटौती खोजने हेतु लेनदेन तारीख रखें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 4",
      "भुगतान सुरक्षा — 4"
    ],
    "text": [
      "Keep the charged amount to distinguish similar transactions. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "समान लेनदेन अलग करने हेतु कटी राशि रखें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 5",
      "भुगतान सुरक्षा — 5"
    ],
    "text": [
      "Keep the provider receipt even after downloading the acknowledgement. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "पावती डाउनलोड बाद भी प्रदाता रसीद रखें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 6",
      "भुगतान सुरक्षा — 6"
    ],
    "text": [
      "Never share a UPI PIN with programme staff. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "कार्यक्रम कर्मी को UPI PIN कभी न दें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 7",
      "भुगतान सुरक्षा — 7"
    ],
    "text": [
      "Never share a banking password to prove payment. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान साबित करने हेतु बैंक पासवर्ड न दें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 8",
      "भुगतान सुरक्षा — 8"
    ],
    "text": [
      "Never share a card security code in a complaint. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "शिकायत में कार्ड सुरक्षा कोड न दें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 9",
      "भुगतान सुरक्षा — 9"
    ],
    "text": [
      "Never send an OTP to a coordinator offering payment assistance. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान मदद देने वाले कोऑर्डिनेटर को OTP न भेजें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 10",
      "भुगतान सुरक्षा — 10"
    ],
    "text": [
      "Do not approve an unfamiliar collect request as proof of receiving a scholarship. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "छात्रवृत्ति पाने के प्रमाण के रूप में अपरिचित collect अनुरोध मंजूर न करें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 11",
      "भुगतान सुरक्षा — 11"
    ],
    "text": [
      "A failed page after debit does not justify immediately paying a second time. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "कटौती के बाद पेज विफल हो तो तुरंत दोबारा भुगतान न करें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 12",
      "भुगतान सुरक्षा — 12"
    ],
    "text": [
      "Contact the team with receipt evidence when payment status is unclear. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान स्थिति अस्पष्ट हो तो रसीद प्रमाण से टीम को बताएँ। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 13",
      "भुगतान सुरक्षा — 13"
    ],
    "text": [
      "Do not pay a private agent who promises to bypass verification. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "सत्यापन हटाने का वादा वाले निजी एजेंट को भुगतान न करें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 14",
      "भुगतान सुरक्षा — 14"
    ],
    "text": [
      "Billing information should be accurate even when prefilled automatically. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "अपने आप भरी billing जानकारी भी सही हो। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 15",
      "भुगतान सुरक्षा — 15"
    ],
    "text": [
      "Review a prefilled city before payment because it may come from district information. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान से पहले भरा शहर देखें क्योंकि वह जिले से आ सकता है। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 16",
      "भुगतान सुरक्षा — 16"
    ],
    "text": [
      "Do not assume missing billing fields have already been supplied by the registration form. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "गायब billing खाने फ़ॉर्म से दिए मानकर न चलें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 17",
      "भुगतान सुरक्षा — 17"
    ],
    "text": [
      "A payment screenshot must not be edited to change status or amount. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान screenshot में स्थिति या राशि न बदलें। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 18",
      "भुगतान सुरक्षा — 18"
    ],
    "text": [
      "Provider processing delays do not establish scholarship approval. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "प्रदाता देरी छात्रवृत्ति मंजूरी नहीं बनाती। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "Payment safety — 19",
      "भुगतान सुरक्षा — 19"
    ],
    "text": [
      "Use official channels to investigate payment concerns rather than publicising full bank statements. Use only the displayed authorised payment destination and preserve evidence without sharing secret banking credentials.",
      "भुगतान जाँच आधिकारिक माध्यम से करें, पूरा बैंक विवरण सार्वजनिक नहीं। केवल दिखाए अधिकृत माध्यम से भुगतान करें और बैंक रहस्य बाँटे बिना प्रमाण रखें।"
    ]
  },
  {
    "title": [
      "References and PDFs — 1",
      "संदर्भ और PDF — 1"
    ],
    "text": [
      "No Registration ID is issued to the student before the payment reference is shared. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "पेमेंट संदर्भ भेजने से पहले विद्यार्थी को पंजीकरण आईडी नहीं मिलती। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 2",
      "संदर्भ और PDF — 2"
    ],
    "text": [
      "No acknowledgement number is issued to the student before that payment-reference stage. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "उस संदर्भ चरण से पहले विद्यार्थी को पावती संख्या नहीं मिलती। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 3",
      "संदर्भ और PDF — 3"
    ],
    "text": [
      "The acknowledgement uses YYMMDD, state code, form code and a five-digit serial. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "पावती में YYMMDD, राज्य कोड, फ़ॉर्म कोड और पाँच अंक क्रमांक हैं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 4",
      "संदर्भ और PDF — 4"
    ],
    "text": [
      "The date portion identifies the reference date, not an examination appointment. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "तारीख हिस्सा संदर्भ तारीख है, परीक्षा appointment नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 5",
      "संदर्भ और PDF — 5"
    ],
    "text": [
      "The state portion does not certify state residence independently. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "राज्य हिस्सा अलग से निवास प्रमाणित नहीं करता। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 6",
      "संदर्भ और PDF — 6"
    ],
    "text": [
      "The form code identifies the registration type rather than an award tier. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "फ़ॉर्म कोड प्रकार पहचानता है, सहायता श्रेणी नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 7",
      "संदर्भ और PDF — 7"
    ],
    "text": [
      "Serial numbers are references, not examination ranks. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "क्रमांक संदर्भ हैं, परीक्षा रैंक नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 8",
      "संदर्भ और PDF — 8"
    ],
    "text": [
      "A reference-submitted status is not the same as confirmed payment. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "संदर्भ भेजी स्थिति पुष्टि भुगतान के समान नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 9",
      "संदर्भ और PDF — 9"
    ],
    "text": [
      "A PDF can be generated before the full registration is complete. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "पूरा पंजीकरण होने से पहले PDF बन सकता है। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 10",
      "संदर्भ और PDF — 10"
    ],
    "text": [
      "A PDF download does not approve an applicant. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "PDF डाउनलोड आवेदक मंजूर नहीं करता। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 11",
      "संदर्भ और PDF — 11"
    ],
    "text": [
      "The PDF is not a substitute for the provider’s bank receipt. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "PDF प्रदाता बैंक रसीद का विकल्प नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 12",
      "संदर्भ और PDF — 12"
    ],
    "text": [
      "The PDF is not a tax invoice unless separately issued as one. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "अलग जारी न हो तो PDF कर चालान नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 13",
      "संदर्भ और PDF — 13"
    ],
    "text": [
      "The PDF is not an admission letter to an institution. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "PDF संस्था प्रवेश पत्र नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 14",
      "संदर्भ और PDF — 14"
    ],
    "text": [
      "The PDF is not a scholarship disbursement certificate. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "PDF छात्रवृत्ति भुगतान प्रमाणपत्र नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 15",
      "संदर्भ और PDF — 15"
    ],
    "text": [
      "Check the status shown when a PDF is generated rather than assuming it is current forever. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "PDF बनते समय की स्थिति देखें, हमेशा वर्तमान न मानें। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 16",
      "संदर्भ और PDF — 16"
    ],
    "text": [
      "Do not alter a PDF to display a fabricated approval. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "नकली मंजूरी दिखाने हेतु PDF न बदलें। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 17",
      "संदर्भ और PDF — 17"
    ],
    "text": [
      "Do not circulate a student’s PDF without appropriate permission. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "उचित अनुमति बिना विद्यार्थी PDF न फैलाएँ। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 18",
      "संदर्भ और PDF — 18"
    ],
    "text": [
      "A CRM download is for authorised application handling, not public distribution. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "CRM डाउनलोड अधिकृत आवेदन काम हेतु है, सार्वजनिक वितरण नहीं। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "References and PDFs — 19",
      "संदर्भ और PDF — 19"
    ],
    "text": [
      "If a reference appears wrong, report the discrepancy rather than making a replacement number. References and PDFs record application information; reconciliation, final submission and selection are separate decisions.",
      "संदर्भ गलत लगे तो बताएँ, खुद नई संख्या न बनाएँ। संदर्भ/PDF आवेदन जानकारी बताते हैं; मिलान, अंतिम जमा और चयन अलग निर्णय हैं।"
    ]
  },
  {
    "title": [
      "Application completion — 1",
      "आवेदन पूरा करना — 1"
    ],
    "text": [
      "Basic details remain on the device before the payment-reference submission. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "भुगतान संदर्भ भेजने से पहले मूल जानकारी डिवाइस पर रहती है। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 2",
      "आवेदन पूरा करना — 2"
    ],
    "text": [
      "A device draft can be lost if browser data is cleared. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "ब्राउज़र डेटा हटाने पर डिवाइस ड्राफ्ट खो सकता है। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 3",
      "आवेदन पूरा करना — 3"
    ],
    "text": [
      "An unpaid device draft is not a submitted application. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "बिना भुगतान डिवाइस ड्राफ्ट जमा आवेदन नहीं। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 4",
      "आवेदन पूरा करना — 4"
    ],
    "text": [
      "Sharing a payment reference allows the application record to be created. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "पेमेंट संदर्भ भेजने पर आवेदन रिकॉर्ड बन सकता है। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 5",
      "आवेदन पूरा करना — 5"
    ],
    "text": [
      "Complete education fields after the payment-reference stage. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "संदर्भ चरण के बाद शिक्षा खाने पूरे करें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 6",
      "आवेदन पूरा करना — 6"
    ],
    "text": [
      "Complete personal details accurately rather than copying unrelated records. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "व्यक्तिगत जानकारी सही भरें, असंबंधित रिकॉर्ड न नकल करें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 7",
      "आवेदन पूरा करना — 7"
    ],
    "text": [
      "Complete guardian details when the student is under eighteen. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "अठारह से कम विद्यार्थी के अभिभावक विवरण भरें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 8",
      "आवेदन पूरा करना — 8"
    ],
    "text": [
      "Use the without-coordinator option when no coordinator is involved. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "कोऑर्डिनेटर न हो तो बिना कोऑर्डिनेटर विकल्प लें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 9",
      "आवेदन पूरा करना — 9"
    ],
    "text": [
      "Do not invent a referral code to complete the form. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "फ़ॉर्म पूरा करने हेतु रेफ़रल कोड न गढ़ें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 10",
      "आवेदन पूरा करना — 10"
    ],
    "text": [
      "Review bank details carefully because a typing error can affect later verification. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "बैंक जानकारी ध्यान से देखें क्योंकि गलती बाद का सत्यापन प्रभावित कर सकती है। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 11",
      "आवेदन पूरा करना — 11"
    ],
    "text": [
      "Read each declaration rather than checking every box without understanding. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "हर घोषणा पढ़ें, समझे बिना सभी टिक न करें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 12",
      "आवेदन पूरा करना — 12"
    ],
    "text": [
      "Use final review to identify inconsistent information. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "अंतिम समीक्षा से असंगत जानकारी खोजें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 13",
      "आवेदन पूरा करना — 13"
    ],
    "text": [
      "Final submission is distinct from moving to the next step. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "अगले चरण पर जाना अंतिम जमा से अलग है। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 14",
      "आवेदन पूरा करना — 14"
    ],
    "text": [
      "A staff follow-up on a partial form is not a selection notice. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "अधूरे फ़ॉर्म पर फॉलोअप चयन सूचना नहीं। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 15",
      "आवेदन पूरा करना — 15"
    ],
    "text": [
      "Reopening requires the stated reference and verification details. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "दोबारा खोलने हेतु निर्धारित संदर्भ और सत्यापन विवरण चाहिए। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 16",
      "आवेदन पूरा करना — 16"
    ],
    "text": [
      "Do not share reopening details with an unsolicited caller. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "अनचाहे कॉलर को दोबारा खोलने के विवरण न दें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 17",
      "आवेदन पूरा करना — 17"
    ],
    "text": [
      "Report an error after payment with transaction evidence so staff can investigate. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "भुगतान बाद त्रुटि हो तो लेनदेन प्रमाण देकर जाँच माँगें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 18",
      "आवेदन पूरा करना — 18"
    ],
    "text": [
      "Do not assume an error message proves that payment funds were lost. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "त्रुटि संदेश को भुगतान राशि खोने का प्रमाण न मानें। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Application completion — 19",
      "आवेदन पूरा करना — 19"
    ],
    "text": [
      "A genuine correction should preserve an accurate review history rather than disguise earlier false information. Complete the later sections truthfully; saving, submitting and approval should never be confused.",
      "वास्तविक सुधार सही समीक्षा इतिहास रखे, पुराने झूठ न छिपाए। बाद के भाग सही भरें; सेव, जमा और मंजूरी को एक न मानें।"
    ]
  },
  {
    "title": [
      "Exam structure — 1",
      "परीक्षा संरचना — 1"
    ],
    "text": [
      "The examination contains 50 questions, not a variable number chosen by each candidate. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "परीक्षा में 50 प्रश्न हैं, विद्यार्थी की चुनी अलग संख्या नहीं। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 2",
      "परीक्षा संरचना — 2"
    ],
    "text": [
      "The standard examination duration is 40 minutes. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "मानक परीक्षा अवधि 40 मिनट है। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 3",
      "परीक्षा संरचना — 3"
    ],
    "text": [
      "The maximum score is 100 marks. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "अधिकतम स्कोर 100 अंक है। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 4",
      "परीक्षा संरचना — 4"
    ],
    "text": [
      "Question allocations for a syllabus track must total 50. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "ट्रैक के प्रश्न विभाजन कुल 50 हों। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 5",
      "परीक्षा संरचना — 5"
    ],
    "text": [
      "The terms page does not itself start an examination timer. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "नियम पेज स्वयं परीक्षा टाइमर नहीं शुरू करता। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 6",
      "परीक्षा संरचना — 6"
    ],
    "text": [
      "The syllabus page does not reserve an examination seat. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "पाठ्यक्रम पेज परीक्षा सीट आरक्षित नहीं करता। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 7",
      "परीक्षा संरचना — 7"
    ],
    "text": [
      "Wait for an official date announcement before making travel plans. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "यात्रा योजना से पहले आधिकारिक तारीख की प्रतीक्षा करें। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 8",
      "परीक्षा संरचना — 8"
    ],
    "text": [
      "Do not assume the examination will be online merely because registration is online. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "पंजीकरण ऑनलाइन होने से परीक्षा ऑनलाइन न मानें। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 9",
      "परीक्षा संरचना — 9"
    ],
    "text": [
      "Do not assume the listed office is an examination venue. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "सूचीबद्ध कार्यालय को परीक्षा केंद्र न मानें। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 10",
      "परीक्षा संरचना — 10"
    ],
    "text": [
      "Any admission instructions must come from the authorised programme communication. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "प्रवेश निर्देश अधिकृत कार्यक्रम संपर्क से हों। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 11",
      "परीक्षा संरचना — 11"
    ],
    "text": [
      "Read the actual paper instructions before answering. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "उत्तर से पहले वास्तविक पेपर निर्देश पढ़ें। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 12",
      "परीक्षा संरचना — 12"
    ],
    "text": [
      "A different external exam’s rules do not replace scholarship exam rules. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "बाहरी परीक्षा नियम छात्रवृत्ति नियम का विकल्प नहीं। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 13",
      "परीक्षा संरचना — 13"
    ],
    "text": [
      "An accommodation request is not automatic approval for extra time. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "सुविधा अनुरोध स्वतः अतिरिक्त समय मंजूरी नहीं। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 14",
      "परीक्षा संरचना — 14"
    ],
    "text": [
      "A delay in scheduling does not amount to an announced result. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "कार्यक्रम देरी घोषित परिणाम नहीं है। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 15",
      "परीक्षा संरचना — 15"
    ],
    "text": [
      "No retest entitlement is created simply by this policy page. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "केवल नीति पेज से रीटेस्ट अधिकार नहीं बनता। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 16",
      "परीक्षा संरचना — 16"
    ],
    "text": [
      "Any permitted materials must be disclosed before the assessment. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "अनुमत सामग्री मूल्यांकन से पहले बताई जाए। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 17",
      "परीक्षा संरचना — 17"
    ],
    "text": [
      "Candidates should know the answer submission arrangements before the exam begins. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "शुरू से पहले उत्तर जमा व्यवस्था विद्यार्थी को पता हो। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 18",
      "परीक्षा संरचना — 18"
    ],
    "text": [
      "Instructions for interruptions should distinguish technical failure from deliberate tampering. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "रुकावट निर्देश तकनीकी विफलता और जानबूझकर छेड़छाड़ अलग करें। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Exam structure — 19",
      "परीक्षा संरचना — 19"
    ],
    "text": [
      "A schedule change should be communicated clearly to affected applicants. The announced assessment has 50 questions, 40 minutes and a 100-mark maximum; operational arrangements require separate instructions.",
      "कार्यक्रम बदलाव प्रभावित आवेदकों को स्पष्ट बताया जाए। घोषित मूल्यांकन में 50 प्रश्न, 40 मिनट और अधिकतम 100 अंक हैं; व्यवस्था के अलग निर्देश चाहिए।"
    ]
  },
  {
    "title": [
      "Mark calculation — 1",
      "अंक गणना — 1"
    ],
    "text": [
      "Each correct answer earns 2 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "हर सही उत्तर से 2 अंक मिलते हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 2",
      "अंक गणना — 2"
    ],
    "text": [
      "Each incorrect answer deducts 1.5 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "हर गलत उत्तर पर 1.5 अंक कटते हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 3",
      "अंक गणना — 3"
    ],
    "text": [
      "An unanswered question contributes zero marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "छोड़े प्रश्न का योगदान शून्य है। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 4",
      "अंक गणना — 4"
    ],
    "text": [
      "Net marks equal correct answers times 2 minus wrong answers times 1.5. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "शुद्ध अंक सही ×2 घटाकर गलत ×1.5 हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 5",
      "अंक गणना — 5"
    ],
    "text": [
      "The percentage denominator is 100, not only attempted questions. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "प्रतिशत का आधार 100 है, केवल प्रयास प्रश्न नहीं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 6",
      "अंक गणना — 6"
    ],
    "text": [
      "Wrong answers must not be omitted from the score calculation. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "गणना में गलत उत्तर न छोड़ें। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 7",
      "अंक गणना — 7"
    ],
    "text": [
      "Correct-answer percentage alone is not the award-eligibility score. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "केवल सही उत्तर प्रतिशत सहायता पात्रता अंक नहीं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 8",
      "अंक गणना — 8"
    ],
    "text": [
      "Net marks may be negative where penalties exceed earned marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "कटौती अर्जित अंक से अधिक हो तो शुद्ध अंक ऋणात्मक हो सकते हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 9",
      "अंक गणना — 9"
    ],
    "text": [
      "Fifty correct answers and no wrong answers produce 100 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "50 सही और शून्य गलत से 100 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 10",
      "अंक गणना — 10"
    ],
    "text": [
      "Forty-nine correct and one wrong produce 96.5 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "49 सही और एक गलत से 96.5 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 11",
      "अंक गणना — 11"
    ],
    "text": [
      "Forty-eight correct and two wrong produce 93 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "48 सही और दो गलत से 93 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 12",
      "अंक गणना — 12"
    ],
    "text": [
      "Forty-five correct and five wrong produce 82.5 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "45 सही और पाँच गलत से 82.5 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 13",
      "अंक गणना — 13"
    ],
    "text": [
      "Forty-four correct and six wrong produce 79 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "44 सही और छह गलत से 79 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 14",
      "अंक गणना — 14"
    ],
    "text": [
      "Forty correct and ten unanswered produce 80 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "40 सही और दस छोड़े से 80 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 15",
      "अंक गणना — 15"
    ],
    "text": [
      "Thirty-nine correct and eleven unanswered produce 78 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "39 सही और ग्यारह छोड़े से 78 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 16",
      "अंक गणना — 16"
    ],
    "text": [
      "Zero correct and fifty wrong produce negative 75 marks. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "शून्य सही और 50 गलत से माइनस 75 अंक हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 17",
      "अंक गणना — 17"
    ],
    "text": [
      "Exactly 95 marks remains in the up-to-50-percent consideration band. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "ठीक 95 अंक अधिकतम 50 प्रतिशत विचार सीमा में हैं। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 18",
      "अंक गणना — 18"
    ],
    "text": [
      "A score of 79 must not be rounded upward to 80 for eligibility. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "79 अंक पात्रता हेतु 80 तक ऊपर गोल न करें। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Mark calculation — 19",
      "अंक गणना — 19"
    ],
    "text": [
      "A calculation complaint should identify the counts and disputed arithmetic. Use net marks out of 100, including negative marking, without upward rounding into a higher award band.",
      "गणना शिकायत में गिनती और विवादित गणित बताएँ। 100 में शुद्ध अंक और ऋणात्मक अंकन लें; अधिक सहायता सीमा हेतु ऊपर गोल न करें।"
    ]
  },
  {
    "title": [
      "Award consideration — 1",
      "सहायता विचार — 1"
    ],
    "text": [
      "A net score below 80 percent earns no exam-based award under these bands. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "80 प्रतिशत से कम शुद्ध स्कोर पर इन सीमाओं में परीक्षा सहायता नहीं। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 2",
      "सहायता विचार — 2"
    ],
    "text": [
      "Exactly 80 percent enters the up-to-50-percent consideration band. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "ठीक 80 प्रतिशत अधिकतम 50 प्रतिशत विचार सीमा में आता है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 3",
      "सहायता विचार — 3"
    ],
    "text": [
      "Scores from 80 through 95 percent inclusive share that band. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "80 से 95 प्रतिशत सहित वही सीमा है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 4",
      "सहायता विचार — 4"
    ],
    "text": [
      "The band ceiling is 50 percent of requested support, not 50 percent of the registration fee. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "सीमा माँगी सहायता की 50 प्रतिशत है, शुल्क की नहीं। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 5",
      "सहायता विचार — 5"
    ],
    "text": [
      "A ₹25,000 request has a ₹12,500 ceiling within the 80–95 band. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "₹25,000 अनुरोध की 80–95 सीमा में अधिकतम ₹12,500 है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 6",
      "सहायता विचार — 6"
    ],
    "text": [
      "A ₹50,000 request has a ₹25,000 ceiling within the 80–95 band. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "₹50,000 अनुरोध की 80–95 सीमा में अधिकतम ₹25,000 है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 7",
      "सहायता विचार — 7"
    ],
    "text": [
      "Only a score strictly above 95 percent enters the up-to-100-percent band. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "सख्ती से 95 प्रतिशत ऊपर पर ही अधिकतम 100 प्रतिशत सीमा है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 8",
      "सहायता विचार — 8"
    ],
    "text": [
      "The higher band cannot exceed the amount applied for. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "ऊँची सीमा माँगी राशि से अधिक नहीं हो सकती। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 9",
      "सहायता विचार — 9"
    ],
    "text": [
      "A ₹25,000 request cannot become a ₹50,000 award solely because of a high score. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "ऊँचे स्कोर से ₹25,000 अनुरोध ₹50,000 सहायता नहीं बनता। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 10",
      "सहायता विचार — 10"
    ],
    "text": [
      "A ₹50,000 request cannot exceed ₹50,000 even with full marks. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "पूर्ण अंक पर भी ₹50,000 अनुरोध से अधिक नहीं। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 11",
      "सहायता विचार — 11"
    ],
    "text": [
      "The selected option’s maximum remains relevant to the final award. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "चुने विकल्प की अधिकतम सीमा अंतिम सहायता पर लागू रहे। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 12",
      "सहायता विचार — 12"
    ],
    "text": [
      "A score band does not replace identity verification. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "स्कोर सीमा पहचान सत्यापन नहीं हटाती। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 13",
      "सहायता विचार — 13"
    ],
    "text": [
      "A score band does not replace enrollment verification. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "स्कोर सीमा नामांकन सत्यापन नहीं हटाती। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 14",
      "सहायता विचार — 14"
    ],
    "text": [
      "A score band does not remove the need to review education-support needs. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "स्कोर सीमा शिक्षा सहायता जरूरत की समीक्षा नहीं हटाती। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 15",
      "सहायता विचार — 15"
    ],
    "text": [
      "The final approved amount must be communicated separately. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "अंतिम मंजूर राशि अलग बताई जाए। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 16",
      "सहायता विचार — 16"
    ],
    "text": [
      "Available support may affect the discretionary final decision. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "उपलब्ध सहायता विवेकाधीन अंतिम निर्णय प्रभावित कर सकती है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 17",
      "सहायता विचार — 17"
    ],
    "text": [
      "A qualifying score is not a promise of immediate transfer. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "योग्य स्कोर तत्काल हस्तांतरण वादा नहीं। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 18",
      "सहायता विचार — 18"
    ],
    "text": [
      "Sponsorship review remains separate from invented exam-based guarantees. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "स्पॉन्सरशिप समीक्षा काल्पनिक परीक्षा गारंटी से अलग है। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Award consideration — 19",
      "सहायता विचार — 19"
    ],
    "text": [
      "A rejection or low score must not be described as proof that a student lacks personal worth. Score bands provide maximum consideration ceilings, never automatic payments or amounts beyond the applied support.",
      "अस्वीकृति या कम अंक विद्यार्थी के व्यक्तिगत मूल्य की कमी का प्रमाण न कहें। स्कोर सीमा अधिकतम विचार है, स्वतः भुगतान या माँगी सहायता से अधिक राशि नहीं।"
    ]
  },
  {
    "title": [
      "Academic integrity — 1",
      "शैक्षणिक ईमानदारी — 1"
    ],
    "text": [
      "Do not use an AI chatbot to obtain examination answers. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "परीक्षा उत्तर पाने हेतु AI चैटबॉट न लें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 2",
      "शैक्षणिक ईमानदारी — 2"
    ],
    "text": [
      "Do not use an automated solver during the assessment. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "मूल्यांकन में स्वचालित हल साधन न लें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 3",
      "शैक्षणिक ईमानदारी — 3"
    ],
    "text": [
      "Do not submit AI-generated answers as independent work. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "AI उत्तर स्वतंत्र काम के रूप में न दें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 4",
      "शैक्षणिक ईमानदारी — 4"
    ],
    "text": [
      "Do not ask another person to answer live examination questions. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "दूसरे से लाइव परीक्षा उत्तर न माँगें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 5",
      "शैक्षणिक ईमानदारी — 5"
    ],
    "text": [
      "Do not impersonate a registered student. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "पंजीकृत विद्यार्थी की छद्म पहचान न बनें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 6",
      "शैक्षणिक ईमानदारी — 6"
    ],
    "text": [
      "Do not allow a substitute candidate to take the assessment. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "प्रतिस्थापन व्यक्ति से परीक्षा न दिलाएँ। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 7",
      "शैक्षणिक ईमानदारी — 7"
    ],
    "text": [
      "Do not share answers with other candidates during the examination. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "परीक्षा में अन्य विद्यार्थियों को उत्तर न बाँटें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 8",
      "शैक्षणिक ईमानदारी — 8"
    ],
    "text": [
      "Do not buy leaked examination questions. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "लीक परीक्षा प्रश्न न खरीदें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 9",
      "शैक्षणिक ईमानदारी — 9"
    ],
    "text": [
      "Do not distribute protected question content for cheating. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "नकल हेतु सुरक्षित प्रश्न सामग्री न फैलाएँ। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 10",
      "शैक्षणिक ईमानदारी — 10"
    ],
    "text": [
      "Do not forge academic documents to obtain eligibility. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "पात्रता हेतु शिक्षा दस्तावेज़ न जालसाज़ी करें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 11",
      "शैक्षणिक ईमानदारी — 11"
    ],
    "text": [
      "Do not fabricate a payment reference. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "भुगतान संदर्भ न गढ़ें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 12",
      "शैक्षणिक ईमानदारी — 12"
    ],
    "text": [
      "Do not reuse another student’s transaction reference. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "दूसरे विद्यार्थी का लेनदेन संदर्भ न लें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 13",
      "शैक्षणिक ईमानदारी — 13"
    ],
    "text": [
      "Do not tamper with examination systems to change results. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "परिणाम बदलने हेतु परीक्षा सिस्टम न छेड़ें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 14",
      "शैक्षणिक ईमानदारी — 14"
    ],
    "text": [
      "Do not offer money to an employee to alter marks. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "अंक बदलने हेतु कर्मचारी को पैसा न दें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 15",
      "शैक्षणिक ईमानदारी — 15"
    ],
    "text": [
      "Do not conceal a material conflict when requested in a relevant review. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "संबंधित समीक्षा में माँगा महत्वपूर्ण हित-संघर्ष न छिपाएँ। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 16",
      "शैक्षणिक ईमानदारी — 16"
    ],
    "text": [
      "Ordinary preparation before the exam differs from unauthorised assistance during it. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "परीक्षा पूर्व सामान्य तैयारी और परीक्षा में अनधिकृत मदद अलग हैं। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 17",
      "शैक्षणिक ईमानदारी — 17"
    ],
    "text": [
      "Legitimate accessibility tools need separate consideration from answer-generating tools. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "सुलभता साधन उत्तर बनाने वाले साधन से अलग जाँचे जाएँ। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 18",
      "शैक्षणिक ईमानदारी — 18"
    ],
    "text": [
      "Confirmed misconduct does not make the registration fee refundable under the programme policy. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "सिद्ध गलत आचरण नीति में शुल्क वापसी योग्य नहीं बनाता। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Academic integrity — 19",
      "शैक्षणिक ईमानदारी — 19"
    ],
    "text": [
      "Staff must not publicly reveal a minor’s details when handling an integrity allegation. Confirmed unauthorised AI use or fraud results in rejection and no registration-fee refund, subject to mandatory legal rights.",
      "ईमानदारी आरोप संभालते कर्मी नाबालिग जानकारी सार्वजनिक न करें। सिद्ध अनधिकृत AI या धोखाधड़ी पर अस्वीकृति और शुल्क वापसी नहीं, अनिवार्य अधिकार बने रहें।"
    ]
  },
  {
    "title": [
      "Fair examination review — 1",
      "निष्पक्ष परीक्षा समीक्षा — 1"
    ],
    "text": [
      "An automated AI-detector score alone is not conclusive proof of cheating. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "अकेला AI detector स्कोर नकल का निर्णायक प्रमाण नहीं। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 2",
      "निष्पक्ष परीक्षा समीक्षा — 2"
    ],
    "text": [
      "A student should be able to explain disputed conduct through the authorised process. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "विद्यार्थी अधिकृत प्रक्रिया में विवादित आचरण समझा सके। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 3",
      "निष्पक्ष परीक्षा समीक्षा — 3"
    ],
    "text": [
      "A guardian should be involved when a minor faces a serious allegation. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "नाबालिग पर गंभीर आरोप हो तो अभिभावक शामिल हों। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 4",
      "निष्पक्ष परीक्षा समीक्षा — 4"
    ],
    "text": [
      "Reviewers should consider evidence relevant to the particular candidate. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "समीक्षक उसी विद्यार्थी से संबंधित प्रमाण देखें। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 5",
      "निष्पक्ष परीक्षा समीक्षा — 5"
    ],
    "text": [
      "A technical interruption should not automatically be labelled intentional fraud. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "तकनीकी रुकावट स्वतः जानबूझकर धोखाधड़ी न कहलाए। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 6",
      "निष्पक्ष परीक्षा समीक्षा — 6"
    ],
    "text": [
      "A disability-related tool should be evaluated for its purpose rather than its label alone. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "दिव्यांगता साधन का उद्देश्य देखें, केवल नाम नहीं। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 7",
      "निष्पक्ष परीक्षा समीक्षा — 7"
    ],
    "text": [
      "A disputed answer key should be checked against the actual question. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "विवादित उत्तर कुंजी वास्तविक प्रश्न से जाँची जाए। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 8",
      "निष्पक्ष परीक्षा समीक्षा — 8"
    ],
    "text": [
      "Report ambiguous questions without publishing the full protected paper. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "अस्पष्ट प्रश्न बताएँ, पूरा सुरक्षित पेपर न प्रकाशित करें। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 9",
      "निष्पक्ष परीक्षा समीक्षा — 9"
    ],
    "text": [
      "A scoring correction should use the same arithmetic rules for all affected candidates. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "अंक सुधार सभी प्रभावितों पर समान गणित से हो। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 10",
      "निष्पक्ष परीक्षा समीक्षा — 10"
    ],
    "text": [
      "Reviewers must not change the award threshold secretly for a favoured applicant. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "पसंदीदा आवेदक हेतु सीमा चुपचाप न बदलें। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 11",
      "निष्पक्ष परीक्षा समीक्षा — 11"
    ],
    "text": [
      "Questions should test understanding rather than rely on deliberately misleading language. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "प्रश्न समझ जाँचें, जानबूझकर भ्रमित भाषा नहीं। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 12",
      "निष्पक्ष परीक्षा समीक्षा — 12"
    ],
    "text": [
      "Difficulty should not be created solely to suppress all scores below 80 percent. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "कठिनाई केवल सभी अंक 80 से नीचे दबाने हेतु न हो। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 13",
      "निष्पक्ष परीक्षा समीक्षा — 13"
    ],
    "text": [
      "A grouped syllabus should not justify indiscriminate higher-class testing. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "समूह पाठ्यक्रम बिना भेद ऊँची कक्षा जाँच का आधार नहीं। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 14",
      "निष्पक्ष परीक्षा समीक्षा — 14"
    ],
    "text": [
      "An allegation outcome should provide a substantive reason where law permits. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "कानून अनुमति दे तो आरोप निर्णय उचित कारण बताए। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 15",
      "निष्पक्ष परीक्षा समीक्षा — 15"
    ],
    "text": [
      "Private security methods need not be disclosed merely to explain a decision. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "निर्णय समझाने हेतु निजी सुरक्षा तरीके खोलना आवश्यक नहीं। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 16",
      "निष्पक्ष परीक्षा समीक्षा — 16"
    ],
    "text": [
      "Other candidates’ records should not be shared as complaint evidence. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "शिकायत प्रमाण में दूसरे विद्यार्थियों के रिकॉर्ड न बाँटें। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 17",
      "निष्पक्ष परीक्षा समीक्षा — 17"
    ],
    "text": [
      "An objection deadline must not be invented by an unofficial coordinator. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "अनधिकृत कोऑर्डिनेटर आपत्ति अंतिम तारीख न गढ़े। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 18",
      "निष्पक्ष परीक्षा समीक्षा — 18"
    ],
    "text": [
      "A complaint does not automatically guarantee a retest. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "शिकायत स्वतः रीटेस्ट गारंटी नहीं। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Fair examination review — 19",
      "निष्पक्ष परीक्षा समीक्षा — 19"
    ],
    "text": [
      "Review procedures must preserve applicable rights to approach competent authorities. Evidence should receive authorised human review; suspicion alone should not decide misconduct or defeat lawful remedies.",
      "समीक्षा प्रक्रिया सक्षम प्राधिकरण के लागू अधिकार बचाए। प्रमाण अधिकृत मानवीय समीक्षा पाए; अकेली शंका गलत आचरण या कानूनी उपाय न तय करे।"
    ]
  },
  {
    "title": [
      "Personal information — 1",
      "व्यक्तिगत जानकारी — 1"
    ],
    "text": [
      "Contact information is used for registration and relevant follow-up, not a public student directory. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "संपर्क पंजीकरण/संबंधित फॉलोअप हेतु है, सार्वजनिक सूची नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 2",
      "व्यक्तिगत जानकारी — 2"
    ],
    "text": [
      "Education information supports eligibility and syllabus matching. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "शिक्षा जानकारी पात्रता और पाठ्यक्रम मिलान में उपयोग होती है। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 3",
      "व्यक्तिगत जानकारी — 3"
    ],
    "text": [
      "Guardian information supports consent and safe communication with minors. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "अभिभावक जानकारी सहमति और नाबालिग सुरक्षित संपर्क हेतु है। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 4",
      "व्यक्तिगत जानकारी — 4"
    ],
    "text": [
      "Payment references support reconciliation rather than access to a bank account. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "भुगतान संदर्भ मिलान हेतु हैं, बैंक खाते की पहुँच नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 5",
      "व्यक्तिगत जानकारी — 5"
    ],
    "text": [
      "Bank text is encrypted and requires authorised administrator access. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "बैंक text एन्क्रिप्टेड और अधिकृत एडमिन पहुँच वाला है। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 6",
      "व्यक्तिगत जानकारी — 6"
    ],
    "text": [
      "Aadhaar text is encrypted rather than publicly displayed. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "आधार text एन्क्रिप्टेड है, सार्वजनिक नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 7",
      "व्यक्तिगत जानकारी — 7"
    ],
    "text": [
      "Sensitive bank and identity fields are excluded from the acknowledgement PDF. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "संवेदनशील बैंक/पहचान पावती PDF में नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 8",
      "व्यक्तिगत जानकारी — 8"
    ],
    "text": [
      "Sensitive fields are excluded from the device draft. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "संवेदनशील खाने डिवाइस ड्राफ्ट से बाहर हैं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 9",
      "व्यक्तिगत जानकारी — 9"
    ],
    "text": [
      "Encryption does not remove the obligation to limit unnecessary collection. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "एन्क्रिप्शन अनावश्यक संग्रह सीमित करने का दायित्व नहीं हटाता। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 10",
      "व्यक्तिगत जानकारी — 10"
    ],
    "text": [
      "Do not email full Aadhaar numbers when asking a general question. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "सामान्य प्रश्न में पूरा आधार ईमेल न करें। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 11",
      "व्यक्तिगत जानकारी — 11"
    ],
    "text": [
      "Do not email full bank statements when a reference will identify the transaction. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "संदर्भ से पहचान हो तो पूरा बैंक विवरण ईमेल न करें। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 12",
      "व्यक्तिगत जानकारी — 12"
    ],
    "text": [
      "Ask the team about unclear verification requests before disclosing sensitive data. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "अस्पष्ट सत्यापन पर जानकारी देने से पहले टीम से पूछें। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 13",
      "व्यक्तिगत जानकारी — 13"
    ],
    "text": [
      "Google Sheet copies remain personal information, not anonymous public data. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "Google Sheet प्रतियाँ निजी जानकारी हैं, अनाम सार्वजनिक डेटा नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 14",
      "व्यक्तिगत जानकारी — 14"
    ],
    "text": [
      "Google resource access should be limited to authorised people. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "Google संसाधन पहुँच अधिकृत लोगों तक हो। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 15",
      "व्यक्तिगत जानकारी — 15"
    ],
    "text": [
      "Drive document copies must not be shared through public links without a lawful basis. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "वैध आधार बिना Drive दस्तावेज़ सार्वजनिक लिंक से न बाँटें। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 16",
      "व्यक्तिगत जानकारी — 16"
    ],
    "text": [
      "CRM staff access follows assigned responsibilities, not unlimited permission. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "CRM कर्मी पहुँच जिम्मेदारी अनुसार है, असीमित नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 17",
      "व्यक्तिगत जानकारी — 17"
    ],
    "text": [
      "Consent to process an application is not unrestricted consent to marketing publication. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "आवेदन संसाधन सहमति असीमित marketing प्रकाशन नहीं। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 18",
      "व्यक्तिगत जानकारी — 18"
    ],
    "text": [
      "A deletion request may require identity verification and consideration of lawful retention. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "मिटाने अनुरोध में पहचान व कानूनी संग्रह जरूरत जाँची जा सकती है। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Personal information — 19",
      "व्यक्तिगत जानकारी — 19"
    ],
    "text": [
      "Do not claim immediate removal from every backup unless actually verified. Use information for authorised application purposes, minimise disclosure and protect minors and sensitive records.",
      "सत्यापन बिना सभी बैकअप से तत्काल मिटने का दावा न करें। जानकारी अधिकृत आवेदन काम में लें, न्यूनतम खुलासा करें और नाबालिग/संवेदनशील रिकॉर्ड सुरक्षित रखें।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 1",
      "डिवाइस और बाहरी सेवाएँ — 1"
    ],
    "text": [
      "Lovable Cloud holds application records and account access information. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "Lovable Cloud आवेदन रिकॉर्ड और खाता पहुँच जानकारी रखता है। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 2",
      "डिवाइस और बाहरी सेवाएँ — 2"
    ],
    "text": [
      "Configured Google Sheets receive application copies rather than replacing login security. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "Configured Google Sheets प्रतियाँ पाती हैं, login सुरक्षा नहीं बदलतीं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 3",
      "डिवाइस और बाहरी सेवाएँ — 3"
    ],
    "text": [
      "Configured Google Drive receives authorised document copies. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "Configured Google Drive अधिकृत दस्तावेज़ प्रतियाँ पाता है। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 4",
      "डिवाइस और बाहरी सेवाएँ — 4"
    ],
    "text": [
      "Zoho Checkout handles its payment-page information under provider notices. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "Zoho Checkout भुगतान जानकारी अपनी नीति अनुसार संभालता है। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 5",
      "डिवाइस और बाहरी सेवाएँ — 5"
    ],
    "text": [
      "Embedded external forms may submit directly to their provider. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "Embedded बाहरी फ़ॉर्म सीधे प्रदाता को जमा हो सकते हैं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 6",
      "डिवाइस और बाहरी सेवाएँ — 6"
    ],
    "text": [
      "Do not assume external Zoho submissions appear locally without verified synchronisation. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "सत्यापित sync बिना Zoho जमा स्थानीय दिखने की धारणा न रखें। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 7",
      "डिवाइस और बाहरी सेवाएँ — 7"
    ],
    "text": [
      "Browser drafts should be treated as private on shared computers. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "साझा कंप्यूटर पर ब्राउज़र ड्राफ्ट निजी माने जाएँ। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 8",
      "डिवाइस और बाहरी सेवाएँ — 8"
    ],
    "text": [
      "Clear a local draft when appropriate after using a shared device. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "साझा डिवाइस उपयोग बाद उचित हो तो स्थानीय ड्राफ्ट हटाएँ। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 9",
      "डिवाइस और बाहरी सेवाएँ — 9"
    ],
    "text": [
      "Clearing browser data does not necessarily delete an already submitted server record. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "ब्राउज़र डेटा हटाना जमा रिकॉर्ड आवश्यक रूप से नहीं मिटाता। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 10",
      "डिवाइस और बाहरी सेवाएँ — 10"
    ],
    "text": [
      "Sign out of an admin account before leaving a shared computer. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "साझा कंप्यूटर छोड़ने से पहले admin sign out करें। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 11",
      "डिवाइस और बाहरी सेवाएँ — 11"
    ],
    "text": [
      "Do not store account passwords in Google Sheets as a backup login method. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "backup login हेतु Google Sheets में पासवर्ड न रखें। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 12",
      "डिवाइस और बाहरी सेवाएँ — 12"
    ],
    "text": [
      "An application reference is not an authentication password. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "आवेदन संदर्भ login पासवर्ड नहीं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 13",
      "डिवाइस और बाहरी सेवाएँ — 13"
    ],
    "text": [
      "Payment return information may help resume the form without confirming the payment itself. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "भुगतान वापसी जानकारी फ़ॉर्म शुरू कर सकती है, स्वयं पुष्टि नहीं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 14",
      "डिवाइस और बाहरी सेवाएँ — 14"
    ],
    "text": [
      "Font requests may transmit ordinary network information to the font provider. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "Font अनुरोध साधारण network जानकारी प्रदाता तक भेज सकते हैं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 15",
      "डिवाइस और बाहरी सेवाएँ — 15"
    ],
    "text": [
      "Opening an external social link moves the visitor to that service. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "बाहरी social लिंक खोलने पर उस सेवा पर जाते हैं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 16",
      "डिवाइस और बाहरी सेवाएँ — 16"
    ],
    "text": [
      "A payment provider’s cookie notice is separate from the registration terms. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "प्रदाता cookie notice पंजीकरण नियम से अलग है। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 17",
      "डिवाइस और बाहरी सेवाएँ — 17"
    ],
    "text": [
      "Cookie-free visitor analytics is described in the separate privacy notice. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "बिना cookie visitor analytics अलग गोपनीयता नोटिस में है। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 18",
      "डिवाइस और बाहरी सेवाएँ — 18"
    ],
    "text": [
      "Do not infer that every third party has identical retention settings. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "हर बाहरी सेवा की समान संग्रह अवधि न मानें। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Devices and third parties — 19",
      "डिवाइस और बाहरी सेवाएँ — 19"
    ],
    "text": [
      "A service interruption does not permit disclosure of private records through public troubleshooting channels. External services have their own notices; device drafts, payment processing and application storage have different roles.",
      "सेवा रुकावट निजी रिकॉर्ड सार्वजनिक troubleshooting में खोलने की अनुमति नहीं। बाहरी सेवाओं के अपने नोटिस हैं; डिवाइस ड्राफ्ट, भुगतान और आवेदन संग्रह की भूमिका अलग है।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 1",
      "वापसी और शिकायतें — 1"
    ],
    "text": [
      "Voluntary withdrawal does not make the registration fee refundable under the policy. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "स्वेच्छा वापसी से नीति में शुल्क नहीं लौटता। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 2",
      "वापसी और शिकायतें — 2"
    ],
    "text": [
      "An incomplete application does not make the fee refundable under the policy. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "अधूरा आवेदन नीति में शुल्क वापसी नहीं बनाता। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 3",
      "वापसी और शिकायतें — 3"
    ],
    "text": [
      "Examination absence does not make the fee refundable under the policy. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "परीक्षा अनुपस्थिति नीति में शुल्क वापसी नहीं बनाती। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 4",
      "वापसी और शिकायतें — 4"
    ],
    "text": [
      "Low marks do not make the registration fee refundable under the policy. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "कम अंक नीति में शुल्क वापसी नहीं बनाते। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 5",
      "वापसी और शिकायतें — 5"
    ],
    "text": [
      "Non-selection does not make the registration fee refundable under the policy. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "चयन न होना नीति में शुल्क वापसी नहीं बनाता। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 6",
      "वापसी और शिकायतें — 6"
    ],
    "text": [
      "An eligibility rejection does not by itself make the fee refundable under the policy. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "अपात्रता अस्वीकृति स्वयं नीति में शुल्क वापसी नहीं बनाती। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 7",
      "वापसी और शिकायतें — 7"
    ],
    "text": [
      "Confirmed prohibited AI use results in rejection without a policy refund. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "सिद्ध निषिद्ध AI से अस्वीकृति और नीति में वापसी नहीं। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 8",
      "वापसी और शिकायतें — 8"
    ],
    "text": [
      "Confirmed fraudulent activity results in rejection without a policy refund. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "सिद्ध धोखाधड़ी से अस्वीकृति और नीति में वापसी नहीं। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 9",
      "वापसी और शिकायतें — 9"
    ],
    "text": [
      "Mandatory statutory refunds cannot be excluded by a non-refundable label. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "गैर-वापसी शब्द से अनिवार्य वैधानिक वापसी नहीं हटती। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 10",
      "वापसी और शिकायतें — 10"
    ],
    "text": [
      "A duplicate charge should be investigated rather than automatically treated as voluntary withdrawal. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "दोहरा शुल्क जाँचा जाए, स्वतः स्वेच्छा वापसी नहीं। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 11",
      "वापसी और शिकायतें — 11"
    ],
    "text": [
      "A payment not properly due should be reviewed on its facts. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "अनुचित देय भुगतान तथ्यों पर जाँचा जाए। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 12",
      "वापसी और शिकायतें — 12"
    ],
    "text": [
      "A provider reversal is distinct from a programme cancellation request. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "प्रदाता reversal कार्यक्रम रद्द अनुरोध से अलग है। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 13",
      "वापसी और शिकायतें — 13"
    ],
    "text": [
      "Keep relevant receipts when requesting payment review. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "भुगतान समीक्षा माँगते समय संबंधित रसीद रखें। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 14",
      "वापसी और शिकायतें — 14"
    ],
    "text": [
      "Explain the requested correction clearly in a complaint. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "शिकायत में चाहा सुधार स्पष्ट बताएँ। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 15",
      "वापसी और शिकायतें — 15"
    ],
    "text": [
      "Use the application or transaction reference to identify the issue. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "समस्या पहचान हेतु आवेदन या लेनदेन संदर्भ दें। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 16",
      "वापसी और शिकायतें — 16"
    ],
    "text": [
      "Contact info@riloyd.in for official application concerns. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "आधिकारिक आवेदन समस्या हेतु info@riloyd.in लिखें। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 17",
      "वापसी और शिकायतें — 17"
    ],
    "text": [
      "Do not send secret credentials to speed up complaint handling. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "शिकायत जल्दी कराने हेतु रहस्य credentials न भेजें। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 18",
      "वापसी और शिकायतें — 18"
    ],
    "text": [
      "A complaint acknowledgement is not a promise of an award or refund. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "शिकायत पावती सहायता या वापसी वादा नहीं। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Refunds and complaints — 19",
      "वापसी और शिकायतें — 19"
    ],
    "text": [
      "No unannounced complaint charge or deadline should be imposed by a referral agent. Registration fees are non-refundable under the policy while mandatory remedies and wrongly collected-payment concerns remain protected.",
      "रेफ़रल एजेंट अघोषित शिकायत शुल्क या अंतिम तारीख न लगाए। नीति में शुल्क वापसी नहीं, पर अनिवार्य उपाय और अनुचित भुगतान समस्याओं का संरक्षण रहे।"
    ]
  },
  {
    "title": [
      "Programme governance — 1",
      "कार्यक्रम संचालन — 1"
    ],
    "text": [
      "A coordinator can help register but cannot independently approve a scholarship. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "कोऑर्डिनेटर मदद कर सकता है, स्वतंत्र छात्रवृत्ति मंजूर नहीं। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 2",
      "कार्यक्रम संचालन — 2"
    ],
    "text": [
      "An employee code routes authorised follow-up rather than guaranteeing selection. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "कर्मचारी कोड अधिकृत फॉलोअप देता है, चयन गारंटी नहीं। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 3",
      "कार्यक्रम संचालन — 3"
    ],
    "text": [
      "A missing referral does not justify inventing a coordinator. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "रेफ़रल न होने से काल्पनिक कोऑर्डिनेटर न दें। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 4",
      "कार्यक्रम संचालन — 4"
    ],
    "text": [
      "Report unofficial charges requested in exchange for selection. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "चयन हेतु माँगे अनौपचारिक शुल्क बताएँ। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 5",
      "कार्यक्रम संचालन — 5"
    ],
    "text": [
      "A verbal promise must not silently replace published score rules. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "मौखिक वादा घोषित स्कोर नियम चुपचाप न बदले। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 6",
      "कार्यक्रम संचालन — 6"
    ],
    "text": [
      "Official award communication should state the actual approved amount. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "आधिकारिक सहायता संदेश वास्तविक मंजूर राशि बताए। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 7",
      "कार्यक्रम संचालन — 7"
    ],
    "text": [
      "No fixed disbursement date is implied without an official communication. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "आधिकारिक संदेश बिना निश्चित भुगतान तारीख न मानें। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 8",
      "कार्यक्रम संचालन — 8"
    ],
    "text": [
      "No instalment schedule is implied without its specific disclosure. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "विशिष्ट घोषणा बिना किस्त कार्यक्रम न मानें। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 9",
      "कार्यक्रम संचालन — 9"
    ],
    "text": [
      "Bank verification should not request PINs or passwords. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "बैंक सत्यापन PIN या पासवर्ड न माँगे। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 10",
      "कार्यक्रम संचालन — 10"
    ],
    "text": [
      "Changes affecting applicants should be communicated rather than hidden. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "आवेदक प्रभावित बदलाव बताए जाएँ, छिपें नहीं। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 11",
      "कार्यक्रम संचालन — 11"
    ],
    "text": [
      "A later policy must not silently rewrite an already completed assessment. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "नई नीति पूरा मूल्यांकन चुपचाप न बदले। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 12",
      "कार्यक्रम संचालन — 12"
    ],
    "text": [
      "Keep the terms version reviewed at registration for later reference. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "पंजीकरण में पढ़ा नियम संस्करण बाद हेतु रखें। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 13",
      "कार्यक्रम संचालन — 13"
    ],
    "text": [
      "English and Hindi should express the same substantive rules. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "अंग्रेज़ी और हिंदी समान मूल नियम बताएँ। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 14",
      "कार्यक्रम संचालन — 14"
    ],
    "text": [
      "Ask for clarification when translations appear inconsistent. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "अनुवाद अलग लगे तो स्पष्टता माँगें। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 15",
      "कार्यक्रम संचालन — 15"
    ],
    "text": [
      "A hidden harsher interpretation should not be imposed through translation differences. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "अनुवाद अंतर से छिपा कठोर अर्थ न लगाया जाए। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 16",
      "कार्यक्रम संचालन — 16"
    ],
    "text": [
      "The operator cannot use these terms to excuse its own unlawful conduct. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "संचालक अपने गैरकानूनी कार्य की छूट इन नियमों से नहीं ले सकता। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 17",
      "कार्यक्रम संचालन — 17"
    ],
    "text": [
      "Applicable consumer remedies remain available despite contractual limits. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "संविदा सीमा बाद भी लागू उपभोक्ता उपाय रहें। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 18",
      "कार्यक्रम संचालन — 18"
    ],
    "text": [
      "Access to competent courts and authorities is not removed by internal review. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "आंतरिक समीक्षा न्यायालय/प्राधिकरण पहुँच नहीं हटाती। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  },
  {
    "title": [
      "Programme governance — 19",
      "कार्यक्रम संचालन — 19"
    ],
    "text": [
      "Accepting the terms confirms understanding of the programme rules, not a waiver of non-waivable legal rights. Official decisions should remain accurate, transparent and consistent with legal rights; agents cannot invent guarantees or erase protections.",
      "स्वीकृति कार्यक्रम नियम समझना है, अनिवार्य अधिकार छोड़ना नहीं। आधिकारिक निर्णय सही, स्पष्ट और अधिकार अनुसार हों; एजेंट गारंटी या अधिकार समाप्त न गढ़ें।"
    ]
  }
];

export const educationTerms: LegalClause[] = [...coreEducationTerms, ...additionalEducationTerms];

export const educationRefunds: LegalClause[] = [
  clause("Registration fees do not buy an award", "शुल्क से सहायता नहीं खरीदी जाती", "₹149 sponsorship, ₹249 scholarship up to ₹25,000 and ₹599 scholarship up to ₹50,000 are registration fees, separate from selection. They are not investments, refundable security deposits or contributions that guarantee a later return. Check the selected option and actual total on the payment page before paying.", "₹149 स्पॉन्सरशिप, ₹249 में ₹25,000 तक और ₹599 में ₹50,000 तक छात्रवृत्ति के पंजीकरण शुल्क हैं, चयन से अलग। ये निवेश, वापसी जमा या लाभ की गारंटी नहीं। भुगतान से पहले विकल्प और वास्तविक कुल देखें।"),
  clause("Non-refundable policy", "गैर-वापसी नीति", "Registration fees are non-refundable for withdrawal, incomplete applications, absence, low marks, non-selection, eligibility rejection and confirmed AI use or fraud. This includes a student's decision not to participate after paying. The rule is subject to mandatory applicable legal rights; nothing here excludes a refund or remedy that the law requires.", "आवेदन वापस लेने, अधूरा फ़ॉर्म, अनुपस्थिति, कम अंक, चयन न होने, अपात्रता और सिद्ध AI/धोखाधड़ी पर शुल्क नहीं लौटता। भुगतान के बाद भाग न लेने पर भी यही नीति है। कानून के अनिवार्य अधिकार और आवश्यक वापसी/उपाय अपवर्जित नहीं।"),
  clause("Debited but unsuccessful or duplicate payment", "राशि कटी पर विफल/दोहरा भुगतान", "Retain the transaction ID, receipt, date and charged amount and contact info@riloyd.in before paying again. The team can review the payment trail with the provider. Provider reversals, duplicate payments and charges not properly due are not silently classified as ordinary registration cancellations; outcomes depend on verified facts and applicable law, not an automatic promise.", "आईडी, रसीद, तारीख और राशि रखें, दोबारा भुगतान से पहले info@riloyd.in पर संपर्क करें। टीम प्रदाता से जाँच सकती है। प्रदाता रिवर्सल, दोहरा भुगतान या अनुचित शुल्क सामान्य रद्दीकरण नहीं माने जाएँगे; निर्णय तथ्यों व कानून से होगा, स्वतः वादा नहीं।"),
  clause("How to raise a payment concern", "भुगतान समस्या कैसे बताएँ", "Send a concise description and payment reference to info@riloyd.in. Do not send card details, PINs, passwords, OTPs or full bank statements. A guaranteed resolution period has not yet been supplied. An acknowledgement number or PDF shows receipt of a reference only, not verified payment or approved scholarship.", "समस्या व भुगतान संदर्भ info@riloyd.in भेजें। कार्ड, PIN, पासवर्ड, OTP या पूरा बैंक स्टेटमेंट न भेजें। निश्चित समाधान अवधि अभी नहीं दी गई। पावती/PDF केवल संदर्भ मिलने को दर्शाता है, सत्यापित भुगतान या मंजूर सहायता नहीं।"),
];

export const educationPrivacy: LegalClause[] = [
  clause("Operator and privacy contact", "संचालक और गोपनीयता संपर्क", "RILOYD is a unit of RISHISHWAR INDUSTRY PRIVATE LIMITED. Contact info@riloyd.in regarding Education Support information. The current form collects educational, contact, family/guardian, coordinator, payment-reference, bank and Aadhaar information. A named privacy/grievance officer, definite application retention period and alternative identity verification arrangements are not yet confirmed in this draft.", "RILOYD, RISHISHWAR INDUSTRY PRIVATE LIMITED की इकाई है। शिक्षा सहायता जानकारी हेतु info@riloyd.in पर लिखें। फ़ॉर्म शिक्षा, संपर्क, परिवार/अभिभावक, कोऑर्डिनेटर, भुगतान संदर्भ, बैंक व आधार लेता है। नामित अधिकारी, निश्चित संग्रह अवधि व वैकल्पिक पहचान व्यवस्था अभी ड्राफ्ट में पुष्टि नहीं हुई।"),
  clause("Purposes and private access", "उद्देश्य और निजी पहुँच", "Information is used to process registration, match payments, assess eligibility, verify identity and education, communicate about the application and administer any selected support. Lovable Cloud stores application records, authentication and private files. Authorised administrators and permitted CRM staff receive access according to their responsibilities; CRM access is not a public directory of student information.", "जानकारी पंजीकरण, भुगतान मिलान, पात्रता, पहचान/शिक्षा सत्यापन, संपर्क और चयनित सहायता के लिए है। Lovable Cloud रिकॉर्ड, login व निजी फ़ाइल रखता है। अधिकृत एडमिन/अनुमत CRM कर्मी अपने काम के अनुसार पहुँच रखते हैं; CRM विद्यार्थी जानकारी की सार्वजनिक निर्देशिका नहीं।"),
  clause("Google copies and external forms", "Google प्रतियाँ और बाहरी फ़ॉर्म", "Configured Google Sheets receive registration and other website-form copies, and Google Drive receives configured document copies. People granted access to those Google resources can see the information copied there. Website backup paths can retain protected encrypted identity information and masked fields; application contact data is not anonymous. Embedded Zoho forms submit to Zoho and are not assumed to appear in the local inbox without verified synchronisation.", "Configured Google Sheets में पंजीकरण/अन्य फ़ॉर्म प्रतियाँ और Drive में configured दस्तावेज़ प्रतियाँ जाती हैं। इन संसाधनों के अनुमति वाले लोग प्रतियाँ देख सकते हैं। बैकअप में सुरक्षित एन्क्रिप्टेड पहचान और masked fields रह सकते हैं; संपर्क डेटा अनाम नहीं। Embedded Zoho फ़ॉर्म Zoho को जाते हैं, सत्यापित sync बिना स्थानीय inbox नहीं माना जाता।"),
  clause("Bank, identity and payment services", "बैंक, पहचान और भुगतान सेवाएँ", "Bank and Aadhaar text is encrypted by the application and available only through authorised administrator access. It is excluded from device drafts and acknowledgement PDFs; encryption does not remove the need to minimise collection. Zoho Checkout and its payment partners process billing, transaction and payment information under their own notices. The website receives payment references, not authority to request banking passwords or OTPs.", "बैंक/आधार text एन्क्रिप्टेड है और अधिकृत एडमिन से ही उपलब्ध। डिवाइस ड्राफ्ट/PDF में नहीं; encryption से न्यूनतम संग्रह की जरूरत समाप्त नहीं। Zoho Checkout और साझेदार अपनी नीति में billing/लेनदेन संभालते हैं। वेबसाइट संदर्भ पाती है, बैंक पासवर्ड/OTP माँगने का अधिकार नहीं।"),
  clause("Device storage and external resources", "डिवाइस संग्रह और बाहरी संसाधन", "The site saves theme and language preferences and a non-KYC registration draft in browser storage. Sign-in stores a session for account access, and payment return references may be temporarily stored to resume the form. Google Fonts receives font requests and associated network information. External LinkedIn, Instagram and Google Maps links send you to those services when opened; embedded Zoho pages may use their own cookies or storage.", "ब्राउज़र में theme, भाषा और गैर-KYC ड्राफ्ट रहता है। Login session और फ़ॉर्म के लिए भुगतान संदर्भ अस्थायी रह सकते हैं। Google Fonts को font request/network जानकारी मिलती है। LinkedIn, Instagram, Maps लिंक खोलने पर उनके पास जाते हैं; embedded Zoho अपनी cookies/storage इस्तेमाल कर सकता है।"),
  clause("Lovable visitor analytics", "Lovable visitor analytics", "Lovable's analytics uses no cookies, stores nothing on your device, does not keep IP addresses and does not identify visitors. It records pages visited, referrers, country, browser, operating system and device type, time on site, page loading speed, errors and clicks on buttons and links. Detailed data is kept for 90 days and daily summaries for a year.", "Lovable analytics cookies नहीं उपयोग करता, डिवाइस पर कुछ नहीं रखता, IP नहीं रखता और पहचान नहीं करता। पेज, आने का स्रोत, देश, ब्राउज़र, OS, डिवाइस, समय, loading speed, errors और बटन/लिंक clicks दर्ज होते हैं। विस्तृत डेटा 90 दिन, दैनिक सार एक वर्ष रहता है।"),
  clause("When analytics is recorded", "Analytics कब दर्ज होता है", "There is currently no consent banner connected to Google Consent Mode in this site code. Clicks are therefore recorded for every visitor, and page visits, time on page, page speed and errors are recorded for every visitor without cookies or identifying anyone. Lovable collects this data for us. Lovable's privacy policy at https://lovable.dev/privacy explains how it handles it.", "वर्तमान code में Google Consent Mode से जुड़ा consent banner नहीं। इसलिए हर visitor के clicks तथा बिना cookies/पहचान के पेज, समय, speed व errors दर्ज होते हैं। Lovable हमारे लिए यह डेटा लेता है। https://lovable.dev/privacy उसकी नीति और संभालने का तरीका बताती है।"),
  clause("Minors, requests and retention", "नाबालिग, अनुरोध और संग्रह अवधि", "A guardian must supervise a minor's registration and sensitive-data consent. Contact info@riloyd.in to request access, correction, withdrawal or deletion of application information, subject to lawful verification and retention needs. Do not send full Aadhaar, bank numbers or passwords by email. The operator must finalise the application-data retention schedule and applicable rights process; this notice does not invent a deletion deadline or guarantee immediate removal from every backup.", "नाबालिग का पंजीकरण व sensitive-data consent अभिभावक देखें। उचित सत्यापन/कानूनी जरूरत के अधीन जानकारी, सुधार, सहमति वापसी या deletion हेतु info@riloyd.in लिखें। पूरा आधार/बैंक/पासवर्ड ईमेल न करें। संचालक अवधि व अधिकार प्रक्रिया अंतिम करे; सभी बैकअप से तत्काल हटने या मनगढ़ंत तारीख की गारंटी नहीं।"),
  clause("AI and security limitations", "AI और सुरक्षा सीमाएँ", "The student-facing scholarship AI checklist has been removed. Separate website AI tools may send their stated idea or review inputs to Lovable AI; authorised application review tools minimise contact and identity details. This does not permit AI use by candidates during the scholarship examination. No new exam monitoring or automated fraud detection is implemented by this notice. Legal requirements differ by location and require professional review.", "विद्यार्थी scholarship AI checklist हट गई है। अलग AI tools घोषित idea/review input Lovable AI को भेज सकते हैं; अधिकृत review tools संपर्क/पहचान कम रखते हैं। इससे परीक्षा में AI अनुमति नहीं। नोटिस नई निगरानी/स्वचालित fraud detection नहीं बनाता। स्थानानुसार कानून अलग हैं, पेशेवर समीक्षा जरूरी है।"),
];
export const educationGrievance: LegalClause[] = [
  clause("Official contact", "आधिकारिक संपर्क", "Send scholarship registration, payment, examination-policy, eligibility and privacy concerns to info@riloyd.in. Identify the application or payment reference and explain the requested correction or review. Students under eighteen should involve their parent or guardian. This is the existing general contact, not a claim that a named statutory grievance officer has already been appointed.", "पंजीकरण, भुगतान, परीक्षा नीति, पात्रता और गोपनीयता समस्या info@riloyd.in भेजें। संदर्भ और माँगा सुधार/समीक्षा बताएँ। अठारह से कम अभिभावक को शामिल करें। यह वर्तमान सामान्य संपर्क है, नामित वैधानिक अधिकारी नियुक्त होने का दावा नहीं।"),
  clause("Safe supporting evidence", "सुरक्षित प्रमाण", "Keep receipts and relevant messages, but redact bank account numbers, full Aadhaar, passwords, PINs and unrelated private information before emailing. Never send OTPs or payment credentials to resolve a complaint. A disputed AI or fraud allegation should be reviewed using relevant evidence and the student's explanation, not only an automated detector score.", "रसीद व संदेश रखें पर ईमेल से पहले बैंक, पूरा आधार, पासवर्ड, PIN और असंबंधित निजी जानकारी हटाएँ। शिकायत हेतु OTP/credentials न भेजें। विवादित AI/धोखाधड़ी आरोप संबंधित प्रमाण व विद्यार्थी की बात से जाँचे जाएँ, केवल detector score से नहीं।"),
  clause("Details still to be finalised", "बाकी अंतिम विवरण", "A named grievance officer, verified response timeframe, examination objection window, accommodation procedure and result/appeal schedule are still to be confirmed by the operator. No service-level promise is invented here. Applicants retain access to remedies and competent authorities available under applicable law; a complaint does not automatically guarantee a refund or award.", "नामित अधिकारी, पुष्टि प्रतिक्रिया अवधि, परीक्षा आपत्ति समय, सुलभता प्रक्रिया और परिणाम/अपील कार्यक्रम संचालक से पुष्टि बाकी हैं। मनगढ़ंत समय का वादा नहीं। लागू कानून के उपाय/प्राधिकरण उपलब्ध रहेंगे; शिकायत से स्वतः वापसी या सहायता तय नहीं।"),
  clause("Operator's listed office", "सूचीबद्ध कार्यालय", "RISHISHWAR INDUSTRY PRIVATE LIMITED, Mahadaji Nagar, Lashkar, Gird, Gwalior, Madhya Pradesh – 474001 is the registered office shown on this website. Use the email contact for initial application concerns. Confirm any in-person appointment with the team before travelling; this page does not promise walk-in service or a dedicated examination venue.", "वेबसाइट पर पंजीकृत कार्यालय: RISHISHWAR INDUSTRY PRIVATE LIMITED, Mahadaji Nagar, Lashkar, Gird, Gwalior, Madhya Pradesh –474001। पहले ईमेल करें। यात्रा से पहले टीम से appointment पुष्टि करें; यह पेज walk-in सेवा या परीक्षा केंद्र का वादा नहीं।"),
];