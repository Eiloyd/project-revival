नीचे RILOYD के सभी Dashboards का **Pending Work & Implementation Roadmap** दे रहा हूँ। इसे आप सीधे Word या Google Docs में कॉपी कर सकते हैं।

# **RILOYD**

## **Dashboard Pending Work & Implementation Roadmap**

Audit & Development Document | 16 November 2026

### **1. Current Audit Status**

| विवरण                        | स्थिति      |
| ---------------------------- | ----------- |
| Total checklist items        | 241         |
| Completed                    | 114 (47.3%) |
| Pending / Not fully complete | 127 (52.7%) |

Pending classification:

| Category              | Items   |
| --------------------- | ------- |
| Partially working     | 59      |
| Only UI available     | 21      |
| Completely missing    | 29      |
| Configuration pending | 11      |
| Blocked / Untested    | 7       |
| **Total**             | **127** |

*नोट: इन आंकड़ों को पिछले Audit Summary के अनुसार लिया गया है।*

### **2. Priority-wise Pending Work**

P0 – Critical Priority

इन कामों को सबसे पहले पूरा करना है।

1. Admin Account Claim System
2. Employee Attendance Correction System
3. Central Holiday Calendar
4. Employee My ID Card
5. Employee My Target Gauge

**Acceptance:** सभी features का backend, database, permissions और actual workflow working होना चाहिए।

P1 – High Priority

1. Bulk Candidate Upload (CSV / Excel)
2. 90-Day Tracking Portals
3. Razorpay Live Configuration
4. Zoho Live Configuration
5. Recruitment Data Import & Validation

**Acceptance:** वास्तविक data के साथ सभी workflows काम करने चाहिए।

P2 – Feature Completion

1. Volunteer Certificate PDF Generator
2. BDE Leaderboard Badges
3. Support Duplicate Ticket Detection
4. Volunteer Activity Tracking
5. Automated Certificate Generation

P3 – Integrations

1. WhatsApp Gateway Integration
2. SMS Gateway Integration
3. Zoho Books Live Sync
4. Automated Notifications
5. Integration Failure Logs

### **3. Dashboard-wise Pending Work**

#### **A. Admin Dashboard**

- Complete Admin Account Claim.
- User and Role Management.
- Department Permissions.
- Recruitment and Institute Controls.
- Approval Management.
- System Configuration.
- Audit Logs.
- Security and Access Control.
- Dashboard-wise Performance Reports.

#### **B. HR Dashboard**

- Complete Recruitment Management.
- Bulk Candidate Upload.
- Interview Scheduling.
- Assessment Management.
- Offer Letter Generation.
- Appointment Letter Generation.
- Employee Lifecycle Management.
- Employee Attendance Correction Approval.
- Holiday Calendar Management.
- Training Management.
- Employee Grievance Management.
- Payroll Workflow.
- Full & Final Settlement.
- Employee ID Card Generator.
- HR Reports and Analytics.

#### **C. Employee Dashboard**

- My Attendance.
- Attendance Correction Request.
- My ID Card.
- My Target Gauge.
- My Performance.
- My Documents.
- Leave Management.
- Work From Home Requests.
- Permission Requests.
- Expense Requests.
- Holiday Calendar.
- Task Management.
- Employee Notifications.

#### **D. Finance Dashboard**

- Payroll Management.
- Salary Processing.
- Expense Approval.
- Reimbursement Management.
- Advance Management.
- Full & Final Settlement.
- Payment Reconciliation.
- Razorpay Integration.
- Zoho Books Integration.
- Financial Reports.

#### **E. Support Dashboard**

- Ticket Creation.
- Ticket Assignment.
- Ticket Escalation.
- Ticket Priority Management.
- Duplicate Ticket Detection.
- SLA Management.
- Support Executive Performance.
- Resolution History.
- Customer Communication.
- WhatsApp Integration.
- SMS Notifications.
- Support Analytics.

#### **F. Career / Recruitment Dashboard**

- Candidate Registration.
- Bulk Candidate Upload.
- Candidate Verification.
- Interview Management.
- Assessment Management.
- Selection / Rejection Workflow.
- Offer Management.
- Institute Management.
- Referral Management.
- Commission Tracking.
- 90-Day Candidate Tracking.
- Automated Notifications.

#### **G. Volunteer Dashboard**

- Volunteer Registration.
- Volunteer Verification.
- Volunteer Activity Tracking.
- Volunteer Attendance.
- Volunteer Training.
- My Volunteers.
- Certificate Generation.
- Volunteer Performance Reports.
- Certificate PDF Download.

#### **H. BDM / BDE Dashboard**

- BDE Leaderboard Badges.
- Target Gauge.
- Performance Tracking.
- Lead Management.
- Follow-up Management.
- Task Management.
- WFH Requests.
- Expense Requests.
- Team Performance Reports.
- Incentive Tracking.

#### **I. Research / Operations Dashboard**

- Research Task Assignment.
- Research Progress Tracking.
- Task Review and Approval.
- Team Work Management.
- Operational Reports.
- Department Coordination.
- Activity History.
- Role-based Permissions.

### **4. Common System Requirements**

सभी Dashboards में निम्न सुविधाओं की जाँच और completion जरूरी है:

| Feature          | Requirement                              |
| ---------------- | ---------------------------------------- |
| Role Permissions | हर व्यक्ति को उसके role के अनुसार access |
| Notifications    | Automated notifications                  |
| Search           | Global and advanced search               |
| Filters          | Date, department, status, employee       |
| Reports          | PDF / Excel export                       |
| Audit Logs       | हर महत्वपूर्ण action का record           |
| Security         | Secure authentication and authorization  |
| Responsive UI    | Desktop, tablet, mobile                  |
| Error Handling   | Proper error and retry system            |
| Database         | सभी records का correct synchronization   |

### **5. Testing & Quality Assurance**

हर feature को Complete तभी माना जाएगा जब:

1. Frontend और backend दोनों working हों।
2. Database में सही data save हो।
3. Permissions properly working हों।
4. वास्तविक data पर testing सफल हो।
5. Duplicate records की समस्या न हो।
6. Notifications सही तरीके से जाएँ।
7. सभी approval workflows काम करें।
8. Mobile और desktop पर सही display हो।
9. Production environment में test हो।
10. Admin द्वारा final verification हो।

### **6. Recommended Development Sequence**

| Sequence | Development Work            |
| -------- | --------------------------- |
| 1        | P0 Critical Features        |
| 2        | HR & Employee Dashboard     |
| 3        | Admin Dashboard             |
| 4        | Finance Dashboard           |
| 5        | Support Dashboard           |
| 6        | Career & Recruitment        |
| 7        | Volunteer Dashboard         |
| 8        | BDM / BDE Dashboard         |
| 9        | Research & Operations       |
| 10       | Integrations                |
| 11       | Security & Testing          |
| 12       | Final Production Deployment |

### **7. Final Completion Criteria**

Development team को प्रत्येक feature के लिए ये पाँच चीजें verify करनी होंगी:

- Frontend Completed
- Backend Completed
- Database Connected
- Permissions & Security Verified
- Real Data Testing Passed

**महत्वपूर्ण निर्देश:** केवल UI बनने पर किसी feature को Complete नहीं माना जाएगा। जब तक उसका पूरा workflow वास्तविक रूप से काम नहीं करता, उसे Pending ही रखा जाएगा।

### **8. Final Objective**

RILOYD का उद्देश्य एक ऐसा integrated management system तैयार करना है जिसमें:

- HR बिना किसी बाधा के पूरे HR operations संभाल सके।
- Support Team सभी complaints और tickets manage कर सके।
- Admin पूरे organisation को control कर सके।
- Finance सभी financial operations संभाल सके।
- Employees अपनी सभी activities manage कर सकें।
- Career Team recruitment का पूरा process संभाल सके।
- Volunteers और BDE/B​DM अपनी activities track कर सकें।
- सभी departments एक ही connected database पर काम करें।

**Final Target: 100% Functional, Tested & Production-Ready RILOYD Management System.**

**मेरी सलाह:** इसे development team को देकर हर pending feature के सामने Developer, Status, Expected Completion Date और Testing Result के columns जोड़वाएँ। इससे कोई भी feature बिना verification के Complete नहीं दिखेगा।