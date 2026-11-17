# RILOYD – CAREER & COMPLETE RECRUITMENT MANAGEMENT SYSTEM
## Website Career Section + Candidate Portal + Institute/Consultancy Portal + HR & Admin Recruitment Management

## 1. PROJECT OBJECTIVE

RILOYD website ke header mein ek **Career** option add kiya jayega. Iske through candidates company ki available job vacancies dekhkar directly apply kar sakenge.

Iske saath ek complete recruitment management system develop hoga, jisme:

1. HR aur Admin job vacancies create aur publish karenge.
2. Candidates online job applications submit karenge.
3. Candidates apne login portal se hiring process track karenge.
4. HR complete recruitment process manage karega.
5. Admin aur HR dono applications aur candidate responses dekh sakenge.
6. Consultancy, universities aur colleges apne institute dashboard se bulk candidates submit kar sakenge.
7. Institute apne referred candidates ki recruitment progress track kar sakega.
8. Selected candidate ke joining ke baad pehle 3 months ka authorised work performance aur attendance institute ko visible rahega.
9. Har job ka unique referral link generate hoga.
10. Referral aur coordinator details referral link/code se automatically fetch hongi aur applicant form mein locked rahengi.

**Important:** Recruitment system existing RILOYD website, Admin Dashboard aur HRMS ke saath integrated hona chahiye. Iske liye alag disconnected database ya independent login system create nahi karna hai.

---

# 2. WEBSITE HEADER – CAREER OPTION

Existing website ke header/navigation mein ek new option add karein:

**Career**

Career par click karne par dedicated Career & Recruitment page open hoga.

### Career Page Sections

- Join Our Team
- About Working at RILOYD
- Current Openings
- Department-wise Jobs
- Location-wise Jobs
- Work Mode: Office / Hybrid / Remote / Field
- Full-Time / Part-Time / Internship / Contract
- Job Details
- Eligibility & Qualification
- Required Skills and Experience
- Job Responsibilities
- Salary/CTC Range (where approved for publication)
- Application Deadline
- Apply Now
- How Our Hiring Process Works
- Frequently Asked Questions
- Candidate Login
- Institute/Consultancy Login

### Job Search & Filters

Candidates jobs ko in filters se search kar sakein:

- Department
- Job Role
- Qualification
- Experience
- Location
- Work Mode
- Employment Type
- Salary Range
- Job Status

Har job ka dedicated detail page hoga, jisme Apply Now button rahega.

---

# 3. JOB MANAGEMENT – HR & ADMIN

Job post create karne ka access sirf authorised HR aur Admin ko milega.

### Job Creation Form

HR/Admin ye details add kar sakein:

- Job Title
- Job ID / Requisition ID
- Department
- Designation
- Number of Vacancies
- Job Description
- Roles & Responsibilities
- Required Qualification
- Required Skills
- Experience Required
- Salary Range / CTC
- Employment Type
- Work Mode
- Job Location
- Working Days
- Working Hours
- Reporting Manager
- Application Start Date
- Application Last Date
- Selection Process
- Required Documents
- Job Visibility
- Application Form Configuration

### Job Status

- Draft
- Pending Approval
- Published
- Paused
- Closed
- Cancelled
- Archived

### Job Publishing Permissions

| Action | HR | Admin |
|---|---|---|
| Create Job | Yes | Yes |
| Edit Job | Yes | Yes |
| Publish Job | As authorised | Yes |
| Pause Job | Yes | Yes |
| Close Job | Yes | Yes |
| Delete/Archive | Restricted | Yes |
| View Applications | Yes | Yes |
| Assign Recruiter | Yes | Yes |

Har job ke liye unique job reference ID aur unique public URL generate ho.

---

# 4. CANDIDATE APPLICATION SYSTEM

Candidate Apply Now par click karke online application submit karega.

### Candidate Registration

Candidate account create kar sake:

- Full Name
- Email Address
- Mobile Number
- Password / Secure Login
- OTP or Email Verification

Existing account hone par login karke multiple jobs ke liye apply karne ka option ho. Har job ke liye separate application record maintain ho.

### Application Form

**A. Personal Details**
- Full Name
- Date of Birth
- Gender (optional, where appropriate)
- Mobile Number
- Email
- Current Address
- Permanent Address
- City
- State
- PIN Code

**B. Educational Details**
- Highest Qualification
- Course
- Specialisation
- University/Institute
- Passing Year
- Percentage/CGPA
- Additional Qualifications

**C. Professional Details**
- Fresher / Experienced
- Total Experience
- Current Organisation
- Current Designation
- Previous Work Experience
- Current/Expected CTC (where relevant)
- Notice Period
- Skills
- Languages

**D. Documents**
- Resume/CV
- Photograph
- Educational Certificates
- Experience Certificates
- Other Relevant Documents

**E. Additional Information**
- Why do you want to join RILOYD?
- Relevant Skills
- Availability for Interview
- Additional Information

Form fields job requirements ke according configurable hone chahiye.

Candidate ko application submit karne se pehle preview aur final confirmation mile.

Application submit hone par unique Application ID generate ho.

---

# 5. CANDIDATE LOGIN PORTAL

Har applicant ke liye dedicated **Candidate Portal** hoga.

Candidate login ke baad apna complete recruitment dashboard dekh sakega.

### Candidate Dashboard

- Profile Completion
- My Applications
- Applied Jobs
- Application Status
- Interview Schedule
- Assessment Details
- Interview Feedback (approved candidate-visible feedback only)
- HR Communication
- Document Requests
- Offer Letter
- Joining Instructions
- Notifications
- Application History

### Recruitment Tracking Timeline

Candidate ko visual timeline ke through apna process dikhna chahiye:

1. Application Submitted
2. Application Received
3. Initial Screening
4. Shortlisted / Rejected
5. Assessment Assigned
6. Assessment Completed
7. Interview Scheduled
8. Interview Completed
9. Final Evaluation
10. Selected / Not Selected
11. Offer Released
12. Offer Accepted / Declined
13. Document Verification
14. Joining Scheduled
15. Joined

Har candidate ko sirf wahi stages dikhayein jo uski actual application par apply hoti hain.

### Candidate Performance & Feedback

Candidate apni hiring journey mein:

- Assessment score dekh sake.
- Completed interview rounds dekh sake.
- Interview dates aur outcomes track kar sake.
- HR ke dwara approved feedback dekh sake.
- Pending tasks aur documents dekh sake.
- HR ke messages ka response de sake.

Internal confidential HR notes, interviewer discussions aur other candidates ka data candidate ko visible nahi hona chahiye.

**Important:** Candidate ko real-time status update mile, lekin HR ki internal evaluation aur confidential remarks public na hon.

---

# 6. COMPLETE HR RECRUITMENT MANAGEMENT

Recruitment process ka operational control HR ke paas hoga.

### HR Recruitment Dashboard

- Total Open Jobs
- Published Jobs
- Total Applications
- New Applications
- Pending Screening
- Shortlisted Candidates
- Assessment Pending
- Interviews Scheduled
- Interviews Completed
- Selected Candidates
- Rejected Candidates
- Offers Released
- Offers Accepted
- Joining Pending
- Joined Candidates
- Recruitment Conversion Rate

### Application Management

HR job-wise applications dekh sake.

Candidate list mein:

- Candidate Name
- Application ID
- Job Applied
- Department
- Qualification
- Experience
- Source
- Referral/Coordinator
- Institute Name (if applicable)
- Application Date
- Current Stage
- Assigned Recruiter
- Priority

Search, filters, sorting aur export options available hon.

### Candidate Profile

HR kisi candidate ka complete profile open karke ye sab dekh sake:

- Personal Details
- Education
- Experience
- Resume
- Documents
- Applied Jobs
- Previous Applications
- Referral Source
- Institute Details
- Interview History
- Assessment Scores
- Feedback
- Communication History
- Recruitment Status
- Internal HR Notes

Duplicate applications detect karne ke liye email aur mobile number based matching ho. Candidate ke multiple applications ko merge ya delete karne ke bajay linked records ke roop mein maintain karein.

---

# 7. COMPLETE HIRING WORKFLOW

HR har job ke liye recruitment pipeline manage karega.

### Stage 1 – Application Screening

HR application review karega.

Actions:
- Shortlist
- Reject
- Hold
- Request More Information
- Assign to Recruiter

### Stage 2 – Assessment

HR candidate ko assessment assign kar sake.

- Online Assessment
- Technical Test
- Aptitude Test
- Written Test
- Practical Task
- Assignment

Assessment ke marks, result aur evaluation securely record hon.

### Stage 3 – Interview Management

Multiple interview rounds configure kar sakein.

- HR Round
- Technical Round
- Department Head Round
- Management Round
- Final Interview

Features:
- Interviewer Assignment
- Date & Time
- Meeting Link / Location
- Interview Notes
- Interview Score
- Recommendation
- Feedback
- Next Round / Reject / Hold

### Stage 4 – Final Selection

HR final evaluation karega.

Possible outcomes:
- Selected
- Rejected
- On Hold
- Waitlisted

### Stage 5 – Offer & Appointment

Selected candidate ke liye HRMS ke existing Letter & Document module se offer letter generate ho.

- Offer Letter
- Salary Details
- Designation
- Department
- Joining Date
- Reporting Manager
- Probation Period
- Notice Period
- Offer Acceptance

Candidate portal se offer accept ya decline kar sake.

### Stage 6 – Onboarding

Offer accepted hone par candidate onboarding workflow mein move ho.

- Document Verification
- KYC (only necessary and authorised information)
- Bank Details (restricted access)
- Employee Profile Creation
- Employee ID Generation
- Appointment Letter
- ID Card Generation
- HRMS Account Creation
- Initial Target Assignment, if applicable

Candidate ko employee banane par existing employee master mein hi record create/link ho. Duplicate employee records create nahi hone chahiye.

---

# 8. CONSULTANCY / UNIVERSITY / COLLEGE PORTAL

RILOYD ke recruitment system mein institutions ke liye separate login portal hoga.

Is portal ka use:

- Consultancies
- Universities
- Colleges
- Training Institutes
- Placement Cells
- Authorised Recruitment Partners

kar sakenge.

Ye institutions apne candidates ko RILOYD ki available jobs ke liye refer kar sakenge.

### Institute Registration

- Institute Name
- Institute Type
- Registration Number (where applicable)
- Official Email
- Contact Number
- Address
- State / City
- Website
- Placement Head Name
- Placement Coordinator Name
- Authorised Contact Details
- Supporting Documents

Registration ke baad Admin/HR verification aur approval karega.

Institute approval ke bina bulk candidate submission ki permission na ho.

### Institute Dashboard

- Total Jobs Available
- Eligible Job Openings
- Total Candidates Submitted
- Pending Applications
- Shortlisted Candidates
- Interview Candidates
- Selected Candidates
- Rejected Candidates
- Joined Candidates
- Candidates in First 3 Months
- Candidate Performance Overview
- Attendance Overview
- Recruitment Conversion
- Referral History

### Bulk Candidate Submission

Institute multiple candidates ko ek saath submit kar sake.

Methods:
1. Individual Application Form
2. Bulk Excel Upload
3. CSV Upload
4. Candidate Entry by Placement Coordinator
5. Job-specific Referral Link

Bulk upload mein template download, field mapping, validation aur duplicate detection ho.

Invalid records ki error report mile. Valid records ko submit kiya ja sake, bina poori file fail kiye.

Har candidate ke liye unique Application ID generate ho.

### Institute Candidate Tracking

Institute apne submit kiye gaye candidates ka status dekh sake:

- Submitted
- Under Review
- Shortlisted
- Assessment
- Interview
- Selected
- Rejected
- Offer Released
- Offer Accepted
- Joined

Institute ko sirf apne institute ke candidates ka data visible ho.

---

# 9. SELECTED CANDIDATE – FIRST 3 MONTHS PERFORMANCE TRACKING

Ye system ka important feature hoga.

Jab institute ke through submit kiya gaya candidate RILOYD mein select hokar join karta hai, tab uske first 3 months ki authorised performance reporting institute dashboard mein visible hogi.

### Tracking Duration

- Joining Date se Day 1
- First Month
- Second Month
- Third Month

3 months complete hone par special tracking period automatically close ho.

Historical summary institute ko policy ke according available rahe.

### Institute ko kya dikhaya jayega?

**A. Employment Information**
- Candidate Name
- Candidate ID (limited display)
- Joined Designation
- Department
- Joining Date
- Reporting Department/Manager
- Employment Status

**B. Attendance Overview**
- Total Working Days
- Present Days
- Absent Days
- Approved Leave Days
- Attendance Percentage
- Late Attendance Summary
- Monthly Attendance Report

**C. Work Performance**

- Assigned Work/Tasks Summary
- Task Completion Percentage
- Quality of Work
- Productivity Score
- Punctuality
- Communication
- Learning & Adaptability
- Teamwork
- Monthly Performance Rating
- Overall Performance Summary

**D. Monthly Reports**

Institute dashboard mein:

- Month 1 Performance
- Month 2 Performance
- Month 3 Performance
- Overall 3-Month Summary

### Performance Evaluation

Performance data HRMS ke existing task, attendance aur performance modules se linked ho.

Reporting Manager/BDM/Department Head employee performance update karega. HR review aur authorised approval ke baad hi institute ko approved summary show ho.

Institute ko raw internal comments, confidential HR notes, salary, bank details, KYC, personal contact details, disciplinary records ya private employee communications visible nahi honge.

**Privacy requirement:** Candidate ko application ke samay clear notice aur appropriate consent lena hoga ki selection ke baad limited attendance aur performance summary referring institute ke saath first three months ke liye share ki ja sakti hai. Applicable law aur company policy ke according access control implement ho.

---

# 10. JOB-WISE UNIQUE REFERRAL LINK SYSTEM

Har published job ke liye referral link generation ka option hoga.

Example:

Job: Business Development Executive

General Job Link:
`https://riloyd.in/career/jobs/BDE-001`

Institute Referral Link:
`https://riloyd.in/career/apply/BDE-001?ref=INST-1001`

Coordinator Referral Link:
`https://riloyd.in/career/apply/BDE-001?ref=COORD-2001`

Individual Referral Link:
`https://riloyd.in/career/apply/BDE-001?ref=REF-3001`

Ye illustrative URL structures hain. Actual links system automatically generate karega.

### Referral Link Features

- Each job has its own referral link.
- Each institute can have its own referral link.
- Each authorised coordinator can have a separate link.
- Each referral partner can have a unique link.
- Referral source automatically application ke saath map ho.
- Link usage count track ho.
- Total applications track hon.
- Shortlisted, selected aur joined candidates track hon.
- Referral link deactivate/expire karne ka option ho.
- Referral attribution history maintain ho.

### Referral Attribution Rule

Agar candidate kisi institute/coordinator ke unique referral link se form open karta hai, to system application ke saath source attribution save karega.

Candidate ke form mein referral details manually edit karne ka option nahi hoga.

Attribution ko secure server-side validation se save karein. Sirf URL parameter ko trusted identity proof na maanein.

Agar candidate direct website se apply karta hai, to referral source Direct/Website record ho.

Agar candidate pehle kisi referral link se aaya tha aur baad mein login karke apply karta hai, to attribution policy ke according original valid source preserve ho.

Conflicting referral attribution ko HR/Admin review ke liye flag karein. Institute ya coordinator ko kisi doosre source ke candidates ka access na mile.

---

# 11. COORDINATOR & REFERRAL DETAILS – AUTO FETCH AND LOCK

Website ke un sabhi forms mein jahan Coordinator Details ya Referral Details poochhi jaati hain, central referral system integrate hona chahiye.

### Referral Code / Coordinator Code

Agar user valid Coordinator Code enter karta hai:

System automatically fetch kare:

- Coordinator Name
- Coordinator ID
- Institute/Organisation
- Official Contact/Reference
- Referral Source
- Authorisation Status

### Referral Link se Auto-Fill

Agar form unique referral link se open hota hai:

- Referral Code automatically fetch ho.
- Coordinator Code automatically fetch ho.
- Coordinator Name automatically fetch ho.
- Institute Name automatically fetch ho.
- Referral Source automatically fetch ho.
- Relevant job ID automatically fetch ho.

### Non-Editable Fields

Automatically fetched details:

- Read-only hon.
- Manually edit na ho sakein.
- Applicant unhe replace na kar sake.
- Browser-side changes se database attribution change na ho.
- Server-side par referral code validate ho.

Agar referral code invalid, inactive ya expired ho, to system warning show kare aur invalid coordinator ko application se link na kare.

### Central Referral Integration

Is feature ko sirf Career page tak limited na rakhein.

RILOYD ke existing aur future application forms mein jahan Coordinator/Referral information required hai, wahan same central referral lookup system use ho.

**Important:** Form mein referral details auto-fill hone ka matlab sirf visible field lock karna nahi hai. Final attribution server-side par validated aur immutable audit record ke roop mein save hona chahiye. Correction sirf authorised Admin review aur reason ke saath ho.

---

# 12. ADMIN DASHBOARD INTEGRATION

Existing `/admin` dashboard mein ek new module add karein:

**Career & Recruitment Management**

Admin ko ye access mile:

- All Job Openings
- All Candidate Applications
- All Institutes
- All Consultancies
- All Referral Partners
- All Coordinators
- All Recruiters
- Recruitment Analytics
- Selected Candidates
- Joined Candidates
- Referral Performance
- Institute Performance
- First 3-Month Employee Summary (authorised view)
- Recruitment Reports
- Audit Logs

Admin aur HR dono ko candidate applications dikhni chahiye.

Admin overall monitoring aur control karega. HR daily hiring process operate karega.

Admin ke paas HR permissions aur recruitment access control manage karne ka option ho.

---

# 13. HRMS INTEGRATION

Existing HRMS ke saath complete integration required hai.

### Candidate to Employee Conversion

Candidate selected aur joined hone par:

- Candidate record existing employee record se link ho.
- Employee ID generate ho.
- Employee profile create/complete ho.
- Department assign ho.
- Designation assign ho.
- Reporting Manager assign ho.
- Joining Date save ho.
- Appointment Letter generate ho.
- Employee ID Card generate-ready ho.
- Employee Login activate ho.
- Attendance tracking start ho.
- Probation tracking start ho.
- Performance tracking start ho.

### Recruitment to HRMS Data Flow

Career Application → Candidate Database → HR Screening → Interview → Selection → Offer → Acceptance → Onboarding → Employee Master → Attendance & Performance.

Candidate ka recruitment history employee profile mein preserve rahe.

---

# 14. NOTIFICATIONS & COMMUNICATION

### Candidate Notifications

- Application Received
- Application Status Updated
- Shortlisted
- Assessment Assigned
- Interview Scheduled
- Interview Rescheduled
- Selected / Rejected
- Offer Released
- Offer Reminder
- Joining Instructions

### HR Notifications

- New Application
- New Institute Submission
- Bulk Upload Completed
- Candidate Assessment Completed
- Interview Feedback Pending
- Offer Acceptance
- Joining Confirmation
- Referral Link Activity

### Institute Notifications

- Candidate Application Submitted
- Candidate Shortlisted
- Interview Scheduled
- Selected / Rejected
- Candidate Joined
- Monthly Performance Report Available

Notifications in-app aur configured email/SMS/WhatsApp providers ke through send ho sakti hain. Delivery status aur notification history maintain ho.

---

# 15. USER ROLES & ACCESS CONTROL

| Role | Main Access |
|---|---|
| Super Admin | Complete system control |
| Admin | Recruitment monitoring, jobs, institutes, reports, permissions |
| HR Head | Complete recruitment management |
| HR Recruiter | Assigned jobs and candidates |
| Interviewer | Assigned interviews and feedback |
| Department Head | Department-specific interview/performance review |
| Candidate | Own applications and hiring timeline |
| Institute Admin | Own institute candidates and reports |
| Placement Coordinator | Assigned institute candidates and referrals |
| Recruitment Consultancy | Its own referred candidates |
| Reporting Manager | Assigned employee performance updates |

Har role ke liye server-side role-based access control aur record-level access restriction required hai.

Candidate ko kisi aur candidate ka data access nahi hona chahiye.

Institute A ko Institute B ke records kabhi visible nahi hone chahiye.

---

# 16. REPORTS & ANALYTICS

### HR Reports

- Job-wise Applications
- Department-wise Applications
- Application Source
- Screening Conversion
- Interview Conversion
- Selection Ratio
- Offer Acceptance Ratio
- Joining Ratio
- Recruitment Time
- Recruiter Performance
- Pending Applications
- Rejection Reasons

### Institute Reports

- Total Candidates Submitted
- Candidates Shortlisted
- Candidates Selected
- Candidates Joined
- Candidate Retention
- First 3-Month Performance Summary
- Attendance Summary
- Institute-wise Recruitment Conversion

### Referral Reports

- Job-wise Referral Activity
- Coordinator-wise Applications
- Institute-wise Applications
- Referral Conversion
- Joined Candidates by Source
- Inactive/Expired Referral Links

Reports exportable PDF/Excel format mein hon, permissions ke according.

---

# 17. DATABASE & TECHNICAL ARCHITECTURE

Lovable pehle existing Supabase database audit kare.

Logical modules/entities:

- job_requisitions
- job_postings
- job_application_questions
- candidates
- candidate_profiles
- candidate_education
- candidate_experience
- candidate_documents
- job_applications
- application_stage_history
- recruitment_assignments
- assessments
- assessment_results
- interview_rounds
- interview_feedback
- candidate_communications
- job_offers
- institute_accounts
- institute_users
- institute_candidates
- referral_partners
- coordinators
- referral_codes
- referral_links
- referral_attributions
- employee_recruitment_links
- employee_first_90_days_reports
- employee_performance_summaries
- employee_attendance_summaries
- recruitment_notifications
- recruitment_audit_logs

Ye logical structure hai, final table list nahi. Existing database mein equivalent tables already hon to unhe reuse karein. Duplicate tables create na karein.

### Important Technical Requirements

- Existing Supabase authentication reuse karein.
- Candidate, institute aur employee logins ke permissions alag hon.
- Server-side referral validation.
- Row Level Security (RLS).
- Secure document storage.
- Private candidate documents.
- Audit logs.
- Duplicate detection.
- Application history preservation.
- Pagination and search.
- Secure bulk import.
- Background processing for bulk uploads and PDF reports.
- Database migrations only after review.

---

# 18. UI/UX DESIGN

Portal professional, premium aur responsive hona chahiye.

### Website Career Page
- Existing RILOYD branding follow kare.
- Clean job cards.
- Simple job filters.
- Professional job details.
- Mobile-friendly application process.

### Candidate Portal
- Simple dashboard.
- Application progress timeline.
- Clear status indicators.
- Notifications.
- Document upload.
- Mobile responsive design.

### Institute Portal
- Professional dashboard.
- Candidate management table.
- Bulk upload.
- Job-wise referral links.
- Candidate performance summaries.
- Attendance overview.
- Export reports.

### HR Recruitment Dashboard
- Advanced recruitment pipeline.
- Candidate Kanban board.
- Filters and bulk actions.
- Interview calendar.
- Job management.
- Reports and analytics.

---

# 19. SECURITY, PRIVACY & DATA PROTECTION

- Candidate documents public URLs par store na hon.
- Sensitive information role-based restricted ho.
- Institute ko limited candidate data hi visible ho.
- Institute ko employee salary, bank, KYC aur confidential HR data access na ho.
- Employee performance reporting authorised approval ke baad ho.
- Attendance data institute ko consent aur applicable policy ke according show ho.
- Referral codes tamper-proof server validation se verify hon.
- Every important action audit log mein save ho.
- Candidate data retention aur deletion requests applicable privacy policy ke according handle hon.
- No public access to internal HR notes.
- No unauthorised data export.

---

# 20. IMPLEMENTATION PLAN

### Phase 1 – Website Career Section
- Header Career option.
- Career landing page.
- Job listings.
- Job detail pages.
- Apply Now.
- Job publishing from Admin/HR.

### Phase 2 – Candidate Portal
- Candidate registration/login.
- Application forms.
- Candidate dashboard.
- Application tracking.
- Notifications.

### Phase 3 – HR Recruitment System
- HR dashboard.
- Candidate database.
- Screening.
- Assessments.
- Interviews.
- Selection.
- Offer generation.
- Onboarding.

### Phase 4 – Institute & Consultancy Portal
- Institute registration.
- Approval workflow.
- Institute dashboard.
- Bulk candidate upload.
- Job-specific referral links.
- Candidate tracking.

### Phase 5 – Referral & Coordinator Integration
- Unique job referral links.
- Coordinator codes.
- Institute codes.
- Auto-fetch details.
- Locked referral fields.
- Server-side attribution.
- Central integration with other relevant forms.

### Phase 6 – First 3-Month Tracking
- Employee conversion.
- Attendance integration.
- Performance integration.
- Monthly reports.
- Institute visibility controls.
- Consent and access management.

### Phase 7 – Complete Testing
- Candidate testing.
- HR testing.
- Admin testing.
- Institute testing.
- Referral testing.
- Security testing.
- Mobile testing.
- HRMS integration testing.

---

# 21. LOVABLE IMPLEMENTATION INSTRUCTIONS – MUST FOLLOW

Before development, inspect the complete existing RILOYD website, `/admin`, HRMS, authentication, Supabase schema, database policies and existing forms.

**Do not start by replacing the website or creating a new independent application.**

1. First audit the existing project.
2. Identify existing reusable components, tables, authentication and permissions.
3. Prepare an implementation plan.
4. Identify required database migrations.
5. Preserve existing data and functionality.
6. Build the Career module within the existing website.
7. Integrate recruitment management with Admin and HRMS.
8. Build separate Candidate and Institute portals with controlled access.
9. Implement server-side referral attribution.
10. Test all workflows using separate test accounts.

### Strict Restrictions

- Do not reset Supabase.
- Do not delete existing tables.
- Do not overwrite existing user records.
- Do not create duplicate employee records.
- Do not expose private candidate documents.
- Do not expose internal HR evaluation to candidates.
- Do not expose confidential employee data to institutes.
- Do not allow applicants to edit locked referral/coordinator attribution.
- Do not allow institutes to access another institute's candidates.
- Do not mark an employee as joined until the authorised joining process is completed.
- Do not show fake attendance or performance data.
- Do not claim an integration is working until it has been tested.

### Final Acceptance Criteria

The system is complete only when:

1. Career option is visible in the website header.
2. HR/Admin can create and publish job openings.
3. Candidates can apply online.
4. Candidates can log in and track their applications.
5. HR can manage complete recruitment stages.
6. Admin and HR can both view applications.
7. Institutes and consultancies can register and get approved.
8. Institutes can submit candidates individually and in bulk.
9. Each job has unique referral links.
10. Coordinator details auto-fetch and remain non-editable.
11. Referral attribution is securely stored.
12. Selected candidates can be converted into existing HRMS employee records.
13. Institutes can view authorised attendance and performance summaries for the first 3 months.
14. Candidate, institute, HR and Admin access is properly separated.
15. Existing website, Admin and HRMS functionality remains intact.

**Final Objective:** RILOYD ke liye ek complete, centralised, professional Recruitment & Hiring Ecosystem banana hai, jisse company ki hiring process application se lekar employee joining aur first 3 months performance tracking tak isi system se manage ho sake.