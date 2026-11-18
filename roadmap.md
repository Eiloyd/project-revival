## Sales hierarchy, targets, Support hand-off, receipt email (18 Nov 2026)
- [ ] Roles SSM → SM → ASM → BDM → BDE → JBDE (+ volunteers under ASM and BDE); each person's CRM shows the whole down-line
- [ ] Admin CRM "My Teams": My SSM / SM / ASM / BDM / BDE / JBDE / Volunteers; click a person to see their team
- [ ] Targets: BDE/JBDE individual; managers = own individual + whole team total; after admin sets it only a senior can change it, and only upwards
- [ ] Won + payment confirmed lead → BDE or senior forwards it to the Support department
- [ ] Every registration: reference number + acknowledgement PDF (with coordinator details, phone optional) emailed automatically via Resend
- [ ] Owner: add Resend API key, run the new SQL file in Supabase

## Payments on more forms + BDE/BDM default access (18 Nov 2026)
- [x] Young Innovators, Prototype Funding, Funding Programme: admin embed code payment + transaction ID box, admin "Programme payments" verify/reject
- [ ] Owner: run database/update-2026-11-18-programme-payments.sql and update-2026-11-18-bde-bdm-default-access.sql (the 2 existing BDE/BDM accounts get CRM after this)
- [x] BDE/BDM: CRM opens by default, My Work inside CRM menu, BDE/BDM Referrals shown in CRM menu
- [x] Lead distribution: Admin assigns leads to a BDM team (or BDE), BDM passes them to own BDEs or keeps them
- [x] Preview "Missing Supabase environment variable" error: connection settings restored after remix

## Admin full control, closed admin sign-up, referral codes (18 Nov 2026)
- [x] Education support backup: 32 of 34 forms loaded into the database; next form number starts at 00031
- [ ] 2 backup forms (Abhinav RAj, RISHABH PATHAK) skipped: their payment IDs are already used by 2 newer test forms — waiting on owner to say which to keep
- [x] Admin and employee dashboards: no "Create account" any more; only candidate, volunteer and institute portals allow sign-up; first-admin self-claim removed
- [x] Admin can open every dashboard (switcher shows all), including BDE/BDM referrals and My Volunteers
- [x] Logins made by Admin/HR/BDE/BDM: temporary password + verify email on BDE/BDM access, CRM employee, department access and add-volunteer forms; first sign-in asks for a new password
- [x] Referral / coordinator code box on every public form; code from a referral link is locked; typed code fills the coordinator details
- [x] Admin Users & access: verify email, reset password, block/unblock buttons
- [x] Mobile sign-in page restyle (dark brand band + sheet, bigger boxes and buttons)
- [x] Admin → CRM control (all modules) + admin sees My BDE for every BDE
- [ ] Update EDUCATION_KYC_ENCRYPTION_KEY and INTEGRATIONS_ENCRYPTION_KEY — secure form opened, owner closed it; both keys already hold values
- [ ] Reconnect own Supabase in this remixed copy — the remix removed the database connection settings (owner action: Settings → Supabase)
- [ ] Owner: run database/update-2026-11-18-admin-access.sql in Supabase

## Sign-in methods + admin switches (17 Nov 2026)
- [x] Admin login abhinav@riloyd.in created in own Supabase with admin role
- [x] Every Supabase sign-in method on login pages (email code, email link, password, phone code, Google/Microsoft/GitHub/Apple/LinkedIn/Facebook, 2-step authenticator, sign out everywhere)
- [x] Admin → Sign-in & security: switch each method on/off (one email-based method always stays on)
- [x] Help Centre answers for the new sign-in options
- [ ] Owner: run `database/fix-2026-11-17-admin-role-check.sql` (admin panel shows "Access could not be checked" until then)
- [ ] Owner: in Supabase add {{ .Token }} to the Magic Link + Confirm signup email templates; set up providers for SMS / Google etc. before switching them on

## Help centre, first-login guide, README, smoothness (17 Nov 2026)

## Clean-up for own hosting (17 Nov)
- [x] Test/demo login file with shared password removed (database/restore-demo-accounts.sql); no test logins exist in the Lovable Cloud database
- [x] Encryption kept for bank/Aadhaar and integration keys (removing it would store them as plain text); both extra keys are now optional and fall back to the server database secret
- [ ] Remove Lovable Cloud — blocked: owner action in More → Database → Manage → Settings → Remove (permanent; export data first)

- [x] Help centre at /help: search, topics for every dashboard, step-by-step answers, how to raise a request or ticket
- [x] First-login guided tour on every dashboard (shown once per person, can be replayed from the Help button)
- [x] Help button in every dashboard top bar; Help links on public site and sign-in page
- [x] Smoother feel: page-change progress bar, soft fade between sections and pages
- [x] Full README for the repository
- [x] INTEGRATIONS_ENCRYPTION_KEY and EDUCATION_KYC_ENCRYPTION_KEY already hold fresh random values (set earlier in this project); form closed by owner

## Collection-linked BDE/BDM pay + volunteer rewards (17 Nov 2026)
- [x] `/crm/sales` page opens the sales workspace on Collections (Direct vs Volunteer-sourced); pg_cron switch-on note added to database/README.md
- [x] Rules written and tested in code: attendance/wage only on verified collection days, zero-collection reminder before 12:00 PM, volunteer revenue counts for targets at 0% incentive, no mandatory volunteer target unless a fixed incentive is assigned, ₹3,000 withdrawal floor
- [x] Sales dashboard: "Remove your zero" banner + reminder popup, Daily wage & attendance screen, Direct BDE vs Volunteer-sourced collection breakdown, target pace now includes volunteer revenue
- [x] Volunteer dashboard: Rewards section with live progress; My Volunteers: Reward schemes tab, fixed-incentive setting, ₹3,000 minimum on withdrawal requests
- [ ] Owner: run `database/update-2026-11-17-sales-pay-volunteer-rewards.sql` on his own database (the screens show a setup note until then)
- [ ] Owner: remove the leftover inactive test volunteer record `VOL-00001` (a maker-checker rule blocks deleting it from here)

## Move to new Lovable Cloud (17 Nov 2026)
- [x] Website, admin and all department screens copied; all database tables, rules and file folders rebuilt; starter settings loaded
- [x] Fixed: approved fee / payout / commission changes were crashing
- [x] Hourly overdue-request check scheduled
- [ ] Existing records and user list from the old backend — waiting on the owner's export
- [ ] Old uploaded files — waiting on an export
- [ ] Connect Google Sheets + Google Drive, then schedule the Google copy and scholarship sync — waiting on the owner
- [ ] Meta Lead Ads / Zoho / Razorpay keys — waiting on the owner
- [ ] Publish, reconnect riloyd.in, update the Meta webhook address — waiting on the owner

## Security + speed + go-live data (17 Nov 2026)
- [x] Secure whole project: open read rules tightened, unsafe packages updated (0 known issues), CSV formula safety everywhere, wrong-detail guess limit on scholarship reopen, visitor limit on service advisor, unused AI checklist removed
- [x] Faster, smoother page loading (30s data cache, preload on hover, lazy photos); home ~0.6s, login ~0.2s in test browser
- [x] Remove all demo logins and demo records (14 logins, staff/CRM/HR/volunteer/juror/client records, test tickets); demo shortcut removed from sign-in pages; starter settings kept
- [x] Every uploaded document/video copied to Google Drive by the scheduled job (pictures and volunteer KYC proofs excluded)
- [x] Google Sheet "Uploaded files" tab keeps each file's Drive link
- [ ] Connect Google Drive + Google Sheets accounts — waiting on the owner (copying can't run until connected)
- [ ] Owner: sign up at /login and claim first admin (no logins exist now)
- [x] Scholarship reopen/save/submit now also needs the registered mobile number; prototype AI check needs sign-in; Google re-copy runs server-side only

## Website improvements (17 Nov 2026)
- [x] Home page "Check your status" box (support ticket check, links for scholarship and job status)
- [x] WhatsApp share button next to every referral link (staff + volunteers)
- [x] "Add to phone home screen" support
- [x] Printable A4 receipts with QR (Finance → Transaction register, for checked money received; not a tax invoice)
- [x] Urgent ticket / new lead alerts: bell rings + pop-up, sound on/off switch (tested: manager assigns urgent ticket → executive sees pop-up)
- [x] Excel (CSV) download on every dashboard table
- [x] Duplicate text check (Contact, About, Services, Home) — no repeated text found, no images changed
- [x] Test tickets "DEMO alert test" deleted
- [ ] Auto WhatsApp/SMS confirmations — waiting on provider keys
- [x] Remixed copy (17 Nov 06:37): starter settings + 14 test logins restored; admin login checked

## AI call notes + manpower delay tracking (17 Nov 2026)
- [x] BDE: type call/meeting notes, get an AI-suggested next step + follow-up message, save it to the lead (activity + follow-up task)
- [x] Manpower: record when each step happens (requirement, profile shared, client selection, placement, attendance sent/approved, invoice issued/paid) and show where work is waiting longest
- [x] Browser-tested: BDE notes → AI suggestion (Hinglish WhatsApp message) → saved call, follow-up task, stage move; delay report shows waiting items and biggest hold-up
- [ ] Owner: confirm the "delayed after N days" limits (3 / 3 / 7 / 3 / 30) and delete DEMO lead + DEMO manpower records before going live

## Admin + Ventures + Recruitment to 100% (requested 17 Nov 2026)
- [x] Audit Admin, Ventures and Recruitment against the specs and pending lists; build every missing piece
- [x] Admin: approvals centre (incl. jobs, referral payouts), permissions matrix, period reports with BDE/BDM team roll-ups, users & access directory, Career & recruitment view
- [x] Ventures: dedicated jury desk with scorecards and round tallies, Ventures reports; jury members see only funding files (no clients' manpower, orders or tickets)
- [x] Recruitment: job create/publish, public careers + job page + full application, referral links (visit count, locked attribution), shortlist, interview rounds + interviewer feedback in My Work, assessments, messages, offer release, candidate portal accept, mark joined, automatic referral commission
- [x] Browser-tested end to end with demo logins (HR, BDE interviewer, candidate, Admin, BDM, juror, startup)
- [ ] Owner: delete demo logins/records before going live; confirm referral commission amounts per partner

## Fourth remixed copy (17 Nov 2026)
- [x] Copy arrived with no logins or settings: restored starting settings (database/restore-starter.sql) and 14 demo logins (database/restore-demo-accounts.sql)

## Third remixed copy (17 Nov 2026)
- [x] Restore starter settings (request routes, funding stages, leave types, shifts, templates, venture services) — copy arrived empty
- [x] Recreate the 13 demo logins and their access in this copy

## Second remixed copy (16 Nov 2026, later)
- [x] Starter settings restored again (request routes, leave types, fee options, shifts, letter templates, funding stages, venture services)
- [x] 13 demo logins recreated with their access; private folders for sales documents and manpower resumes created
- [ ] Funding Programme video and hourly request-escalation schedule: same as the first copy (re-upload / recreate after publishing)

## BDE / BDM dashboards + Manpower services (17 Nov 2026)
- [x] BDE: daily planner (My day), daily sales report with auto-counted calls/meetings/leads/collections, customer 360 profile, agreements & documents, lead source report, cancellation & refund requests, incentive calculator
- [x] BDM: BDE performance comparison, underperformance alerts, workload distribution + bulk reassign with reason, reassignment history, daily report review, coaching & training log, team report export
- [x] Manpower: requirement intake by desk, candidate pipeline + client shortlist approval, deployed staff roster, replacement requests, monthly timesheets with client approval, invoices (service fee + GST), PF/ESIC payroll register, manpower reports; client portal views; Finance confirms manpower invoice payments
- [ ] Cancellation/refund request from CRM: built, not yet tried end-to-end (needs a payment verified by Accounts first)
- [ ] Owner to confirm manpower GST (18%), PF/ESIC rates used in the payroll register, and each client's service fee

## Remixed copy (16 Nov 2026)
- [x] Copy has its own database: structure and private file folders came across; starter settings (request routes, leave types, fee options, shifts, letter templates, funding stages, venture services) restored
- [x] Demo logins re-created in this copy (no users or records carry over in a remix)
- [x] ID card logo fixed (old logo link belonged to the original project)
- [ ] Funding Programme highlight video belongs to the original project and no longer plays here: waiting on the owner to re-upload the video
- [ ] Hourly request-escalation schedule: recreate after this copy is published (schedules don't carry over)

## Dashboard audit completion (16 Nov 2026)
- [x] Analysed the three audit reports; built: HR holiday calendar, institute partners + bulk candidate upload (CSV/Excel, 500 rows, duplicate skip) + 90-day tracking + partner portal, link hired candidate to employee, My Work ID card + own target meters, CRM sales leaderboard, duplicate-ticket warning on Support, volunteer experience certificate
- [x] Demo test logins for every dashboard, including Admin (@riloyd.demo, can't claim first admin) — delete before going live
- [x] Light theme works on phones the same as computers (checked home, about, contact, team, funding, careers, admin)
- [ ] Still open from the audit: onboarding checklist, anonymous grievance option, research QA star ratings, dedicated jury page, admin date filters/department target roll-ups, auto round-robin ticket assignment, incident board, CRM daily report
- [ ] Waiting on owner keys: Razorpay, Zoho Books, WhatsApp/SMS, Google Sheets/Drive, Meta Lead Ads
- [ ] Asset management stays dropped (owner directive)

## Move from code archive (16 Nov 2026)
- [x] Code, images, full database structure (67 tables), access rules and 10 private file folders rebuilt; email sign-in on
- [x] Checked signed in: hiring + career application, refund ticket to Finance, startup funding (Jury Round 1 enforced); test data removed
- [x] Request escalations job scheduled hourly
- [ ] Existing records, users and uploaded files: waiting for exports from the old backend (or owner says skip)
- [ ] Google Sheets/Drive, Zoho, Meta Lead Ads keys: waiting on owner; then create Google copy schedules
- [ ] Publish, reconnect riloyd.in, update Meta webhook address

## Move into this Lovable project again (15 Nov 2026)
- [x] Code, images, database structure, access rules and private file folders rebuilt; pages and contact form checked
- [ ] Existing records, users and uploaded files: waiting for CSV exports from the old backend (or owner says skip)
- [ ] Connect Google Sheets + Google Drive, then create the every-few-minutes copy schedules after publishing
- [ ] Meta Lead Ads keys (META_APP_SECRET, META_PAGE_ACCESS_TOKEN, META_VERIFY_TOKEN): waiting on owner
- [ ] Test enquiry 261115000600001 still in Enquiries/CRM (owner declined automatic cleanup); remove from admin when convenient

## Move into this project (Nov 2026)
- [x] Code, images and settings brought in; database rebuilt (31 tables, rules, private file folders)
- [x] Fresh start chosen by owner — no old records/users imported
- [x] New scholarship privacy key created (fresh start, nothing old to decrypt)
- [x] Google Sheet backup + its every-few-minutes sync (runs once the site is published)
- [x] All forms copied to fresh Google Sheet "RILOYD Website Data" + documents to Drive folder "RILOYD Website Documents" (database kept)
- [ ] Zoho Sheet copy — optional, no ready connection; only if owner asks
- [x] Sample scholarship registrations + CRM leads gone; ack counter unused, first real student gets 00001
- [ ] After publishing: point the scholarship home address (remote.ts HOME_ORIGIN) at the new site; reconnect riloyd.in

- [x] Acknowledgement number format: YYMMDD + 2-digit state + 2-digit form + 5-digit serial; all registration forms, separate counter per form, never resets
- [x] Scholarship acknowledgement number issued when the payment ID is shared (temporary Registration ID before that); forms without payment get it on submission

# Roadmap

## Scholarship categories, exam and legal pages (14 Nov 2026)
- [x] Recheck email verification and admin access after the owner supplied the verification link; do not reuse it if the account is already verified.
- [x] Remove exam summary from registration form and registration page; place policy links immediately before footer, keeping a required T&C acceptance checkbox in the form.
- [x] Create owner-requested admin account using the supplied email through normal signup; verify email/access and real CRM/PDF data without changing real registrations. Verified admin and real CRM lead; existing lead has no payment ID, so its PDF remains correctly unavailable.
- [x] Add Diploma and competitive-exam categories throughout form, admin and PDF labels; remove student AI checklist.
- [x] Publish bilingual category-wise syllabus and tested scoring/award rules (rules only, no online exam).
- [x] Add linked bilingual terms, privacy/cookies, refund and grievance pages; disclose legal-review and missing-policy details.
- [x] Expand T&C to the owner's accepted minimum of 400 explained bilingual points; remove draft/incomplete-document announcements from the T&C page.

- [x] Scholarship form: Google Sheet backup with acknowledgement numbers, student/admin editing that can also read from the sheet
- [x] Scholarship form new flow: step 1 basic details -> acknowledgement number; step 2 payment; step 3+ rest of form; reopen with acknowledgement no. + date of birth + state; final submission when all steps done
- [x] Admin can change payment links (Admin → Payment links: link + Razorpay button ID or embed code) for every form that takes payment
- [x] Referral links per employee: coordinator details auto-filled; employee dashboard shows and verifies their referred registrations
- [x] Fix all current errors (sheet column growth, old address in sitemap/robots, all tests pass)
- [ ] Sign-in on https://www.riloyd.in: website code already returns users to whatever address they use, sitemap/robots point to www.riloyd.in; waiting on the owner to connect the domain (adds it to the sign-in allow list automatically) or add https://www.riloyd.in/** and https://riloyd.in/** under Users → Auth settings → Redirect URLs
- [x] CRM admin AI helper: paste an enquiry message, get lead category, urgency and a drafted reply (AI Gateway) — live AI answer checked
- [x] Checked sample registrations, CRM leads and Vercel secret: none exist in this project; numbering already starts at 00001
- [ ] Scholarship fees (₹149/₹249/₹599) use Zoho Checkout embeds (all three codes received) instead of Razorpay; payment ID auto-filled and shown in step 3
- [x] Move the project into this Lovable project: pages, images, backend tables, storage and AI features rebuilt; contact form and AI ideas verified
- [x] Import existing records and users: dropped — owner chose a fresh start
- [ ] First admin: sign up at /admin, confirm email, claim admin; then verify admin, CRM, imports and file restore

- [x] Optimize current Young Innovators images without changing artwork; saved 382,522 bytes across responsive variants.
- [x] Add a removable third glowing Diwali theme through the existing switch; theme cycle, persistence, unchanged text and desktop/mobile image loading verified.

- [x] Refresh all remaining Young Innovators supporting artwork to match the approved RILOYD hero/exhibition style; all six images loaded at desktop, tablet and phone widths with no overflow.

- [x] Refresh the Young Innovators hero and exhibition image above “A clear start” with RILOYD branding; optimized local images verified at desktop, tablet and phone widths.

- [x] Check 223 website images; compress where smaller, optimize Young Innovators imagery and preserve dimensions/transparency.
- [x] Bundle optimized supplied poster and showcase; desktop/mobile localhost screenshots confirm both render.
- [x] Update Young Innovators title, description and 1200×630 share image; create 26-page sitemap without fabricated lastmod.
- [ ] Complete Google Search Console verification/submission: connected account and verification tag prepared; publication declined, so live verification and sitemap submission cannot proceed.
- [x] Student form submission, admin table, approve/reject and reload persistence verified with one clearly labeled QA record.

- [x] Create requested account, verify confirmed email and activate first-admin through secure claim; signed-in admin tabs and reload verified.

- [x] Audit backend; add approval publishing trigger, complete 14-table diagnostic coverage, server-validated admin eligibility, explicit AI pause reset; authenticated setup reports zero mismatches.
- [x] CSV import/restore of old records: not needed — fresh start (approval publishing still checked once the first admin exists)
- [x] Review all 29 content route modules and 24 rendered URLs; metadata present, status 200, invalid market 404; add registration canonicals, smaller shared logos and nonblocking logo overrides.
- [ ] Finish sitemap, published performance and Google indexing checks; waiting for publication/public address.

- [ ] Add customer support chat grounded in help docs and customer-authorized order data, with human handoff on uncertainty; awaiting conversation/history preferences, source locations and handoff destination.

- [x] Add personalized student project ideas from interests, skills and available materials; real AI generation completed with three tailored ideas and a seven-day plan
- [x] Improve Young Innovators mobile layout and light theme while preserving all existing content and forms; checked 320/390/768px without horizontal overflow; 18 rule tests pass

- [x] Redesign Young Innovators 2026 to the supplied black/crimson reference; generate four matching images, preserve all data and forms, verify desktop/phone layouts, theme selection and FAQs; 14 programme tests pass

- [x] Add guided CSV mapping, validation, preview and secure record import
- [x] Add verified-email first-account admin setup and private account profiles
- [x] Add organized restoration of reports, registration documents and country logos
- [x] Audit every archived website image: all 339 asset files already match byte-for-byte
- [ ] Verify new admin claim, CSV import and file restoration end-to-end: waiting for the user's first verified account and exported records/files; verified admin now available, awaiting exported records/files

- [ ] Update Funding Programme registration, optional summit package and online process; restore and verify autoplay video

- [x] Add student market-validation AI advisor and guardian-consented registration; verified real submission storage and complete AI plan
- [ ] Verify Young Innovators private admin inbox through signed-in UI: signed-in inbox opened; waiting on real student registrations for populated verification
- [x] Add supplied student images, poster registration fees/rewards and improve Young Innovators presentation

- [x] Refocus Young Innovators on school students with business/startup ideas, retaining Classes 6–12 and India-focused presentation

- [x] Build Young Innovators 2026 with India-focused artwork, challenge content and a footer link; verify the page

- [x] Fix hidden icons on all four Business Funding cards
- [x] Show only autoplay video in Event highlights on all screens
- [x] Activate requested admin and verify panel login
- [x] Save prototype submissions and server-generated AI output with consent; add admin list/details
- [x] Add known programme registration fees to admin view
- [x] Rename research page to Our Researchs and add clearly labelled sample reports

- [x] Add personalized AI prototype preparation advice using the founder's funding goal; verified a complete personalized response
- [x] Verify existing backend tables, RLS, roles, functions, publishing trigger and private storage; enable email login
- [x] Provision requested admin account and verify actual password login and protected admin actions
- [x] Further optimize international photos and save an inspected downloadable archive of all 97 referenced website images
- [ ] Push repository changes: direct Git push unavailable; user must check/connect Project settings → Git for managed sync

- [x] Reduce initial scripts with route/component splitting and deferred nonessential tools
- [x] Add an India-focused Prototype Funding presentation in English, retaining the site theme and clear independent-programme status

- [x] Optimize whole-site loading without changing design; verify main pages, images and autoplay video
- [x] Reset remixed project migration history: copied SQL/snapshots deleted, journal emptied (Oct 31 remix)
- [x] Add 10 Nov 2026 registration-closing countdown to Funding Programme; verified live ticking and new fees (₹1,499/₹999 + GST)

- [x] Redesign Payment page, display all six verified accounts, and add Payment link under footer About Us

- [x] Perform full-site source SEO review, fix stale website identity/canonical tags, add service structured data, and check 22 public URLs
- [ ] Finish public sitemap and Google indexing verification: waiting for the website to be published with its public address; rankings cannot be guaranteed

- [x] Add AI prototype eligibility advisory and downloadable applicant checklist
- [x] Restore Prototype Funding to the shared website theme and keep the entire page English-only

- [x] Refresh Prototype Funding with young India imagery and check programme wording
- [x] Add separate Prototype & Seed Funding page with supplied eligibility/video guidelines, ₹999 +18% GST and Explore link
- [ ] Connect a programme-specific prototype application/video submission link: waiting on the official destination; page currently directs applicants to the team

- [x] Restore uploaded funding video with autoplay and no controls
- [x] Show India registration options: ₹2,999 +18% GST for up to 2 people; ₹1,499 +18% GST for up to 1 person per startup/idea

- [x] Replace low-resolution country hero images with HD artwork
- [x] Expand country pages using existing verified website content
- [x] Clear copied migration files and keep an empty remix migration set

- [x] Enhance all country pages and country headers; connect footer logos and Global tabs
- [x] Restrict overseas services to four and include international startups/ideas
- [x] Add admin-managed overseas country fees with USA USD 169
- [x] Add verified payment account details page
- [x] Verify public country/payment flows, mobile rendering and fee validation tests
- [ ] Configure other overseas registration fees: waiting on user values, currently unannounced
- [x] Verify authenticated admin fee save/readback with the requested admin account

- [x] Add admin country/theme logo upload and preview panel
- [x] Secure saved logos and connect all website logo locations
- [x] Verify theme selection, public rendering, image validation and database permissions
- [ ] Verify authenticated logo upload and saved readback: admin now available; needs a user-supplied replacement logo

- [x] Update 6 country logos (Australia, Britain, UAE, Europe, Singapore, Canada) to new light-theme versions
- [x] Verify light-theme logos in browser
- [x] Remove "Use the report number and publish date to download." line from footer
- [x] Replace Europe logos (light + dark themes) with newly uploaded files
- [x] Replace UAE logos (light + dark themes) with newly uploaded files
- [x] Replace Britain light-theme logo with newly uploaded file
- [x] Verify Europe + UAE + Britain logos in both themes in browser
- [ ] Britain dark-theme logo: waiting on user upload (only the light variant arrived; earlier dark upload was blank)
- [x] Footer copyright: fit the three legal lines on one row each on phones
- [x] Mobile footer: Our Services left, Downloads right
- [x] Mobile footer: Follow Us moved into Contact below the office addresses
- [x] Mobile footer: About Us 4mm left, Our People 8mm left so labels fit one line
- [x] Mobile footer: Follow Us directly under the Corporate Office address (right side)
- [x] Diwali theme: toran decoration, default theme, mobile polish
- [x] Toran: transparent background, overlaps content on every page
- [x] Diwali theme: readable font colours
- [ ] Connect riloyd.in, publish, verify in Search Console (blocked: paid plan needed for domain; publish not approved)

- [x] Remove Bigger/Bolder/Brighter/Together from home hero in Diwali theme
- [x] Confirm empty migration set
- [x] Young Innovators registrations saved + shown in admin
- [ ] Owner email per new student registration — blocked: needs a verified email domain + owner address
- [x] Diwali theme: readable text colours in header and hero (desktop + mobile)
- [x] Chhath Puja festive design; Festive theme alternates Diwali ↔ Chhath every 5 minutes; switch keeps only Dark / Light / Festive
- [x] Chhath home hero white veil at 80% transparency (20% opacity)
- [x] Festive = Chhath Puja only; garland + pictures swap Chhath↔Diwali every 5 seconds (was 2)
- [x] Festive only: every white haze over pictures (hero, Why Riloyd, Get in Touch, all pages) 90% see-through
- [x] Admin setup check: country logos + programme fees tables recognised; admin panel loads them
- [x] Whole-site loading speed: optimise slow pages/images
- [x] Festive: remove white glow behind text everywhere (e.g. 'Transform today for a stronger tomorrow.')
- [x] Festive on phones: fit + text sizes + icons; hero paragraph readable over photo, haze kept
- [x] Remove white box behind home hero paragraph ('RILOYD partners with…')
- [x] Add 'RILOYD Foundation' button to the menu

- [x] Razorpay online payment for Funding Programme fee (₹999 + 18% GST) with admin Payments list; test-mode payment verified end to end
- [x] Online payment gateway removed everywhere (user request, 13 Nov); Razorpay live keys no longer needed
- [x] Desktop footer: Contact moved ~1.5cm right, Explore ~1cm wider; checked at 1280/1440/1920
- [x] Explain Razorpay requirements to user
- [x] Zoho Payments option removed with the payment gateway

## Forms, payments, coordinators, Foundation (12 Nov 2026)
- [ ] Replace Zoho form (funding page + popup) with an on-site form
- [x] Paid forms flow dropped: user removed the payment gateway
- [ ] Coordinator / referral code field on every form
- [ ] Admin: coordinators with generated referral codes + share links, referral counts
- [ ] Admin: programme applications (submitted vs leads)
- [x] RILOYD Foundation page at /foundation with section menu and Hindi/English switch; desktop/phone checked

- [x] Menu and footer Foundation links point to /foundation; admin "Foundation forms" tab added (signed-in check pending: remix has no account yet)
- [x] Payments: gateway removed entirely instead

## Education Support (13 Nov 2026)
- [x] Foundation page: remove separate section menu, use RILOYD logo
- [x] Education Support page with multi-step scholarship/sponsorship form, Razorpay payment links (₹149/₹249/₹599), acknowledgement number on submit, admin tab
- [x] Remove Foundation section from footer
- [x] Menu Foundation button links to the Education Support page
- [x] Education Support: bank and full Aadhaar text fields, encrypted and excluded from drafts; sample submission verified.
- [x] New acknowledgement numbers: YYMMDD + list-position state code + permanent district code + global 00001–99999 sequence; sample 261113130100001 verified.
- [x] Add acknowledgement PDF QR code and all-page Excel preparation/download controls; authenticated export verification awaits admin account.
- [ ] Send automatic student confirmation and acknowledgement from info@riloyd.in through Zoho; blocked: secure connector creation declined. SMS has no connected provider.
- [x] Require confirmed payment before admin approval through database enforcement; add admin review and private-detail controls.
- [x] Add BDE own-referral / BDM team-referral read-only workspace and admin assignment controls; bank/KYC and approvals remain admin-only.
- [ ] Provision BDE/BDM assignments and verify authenticated admin exports/private-detail/review flows; waiting for verified accounts.
- [x] Check current admin account: remix has no accounts; safe setup guidance provided.
- [x] Create requested signup using normal auth; email verification pending, then the account can claim first-admin access.
- [x] Extend safe read-only readiness checks with Education Support, district codes, staff access and required approval/numbering triggers; no copied migrations restored.
- [ ] Run authenticated readiness check after account email verification and first-admin claim.

## Employee onboarding and CRM
- [ ] Optimize website loading without removing content/design; check real visitor performance and reduce unnecessary asset/script loading.
- [ ] Use a professional CRM layout and persistent drag-and-drop lead status board with phone/keyboard alternatives.
- [ ] Onboard Support, Sales, BDE and BDM employees with verified accounts, admin-managed access, team assignment and deactivation.
- [ ] Build a shared CRM workspace for leads/contacts, sales pipeline, follow-ups/tasks, activity history, support tickets, search/filters and reports.
- [ ] Connect website enquiries and registrations to CRM records without exposing private student bank/KYC details.
- [ ] Verify employee permissions and the complete admin/staff workflow with authenticated accounts.

## Website forms to CRM (13 Nov 2026)
- [x] Every website form automatically creates a CRM lead; a coordinator/employee code routes it to that employee, otherwise it waits unassigned for admin
- [x] Admin tracks all website leads (source, code entered, assigned employee, stage) and can reassign (signed-in screen check pending: this remix has no accounts yet)
- [x] ~~Vercel hosting~~ dropped: user keeps the whole project on Lovable (forwarding code removed)

## Registration checks, staff access, hosting (13 Nov 2026, later)
- [ ] Flag name / class / payment / coordinator-code mismatches on Education Support registrations (rules + AI review), show flags in admin tab, require a person to confirm before approval
- [x] Re-check acknowledgement number format YYMMDD + state 2 + district 2 + series 00001–99999
- [ ] Complete BDE / BDM / Support login and role access (BDE own leads, BDM team, admin all) and verify each role
- [x] Payment transaction ID must be unique across all registrations (never repeat)
- [x] Hosting: user decided not to split; whole project stays on Lovable (Vercel forwarding stays switched off)

## Zoho payment + live domain (14 Nov 2026)
- [x] Zoho Checkout in scholarship step 2, /payment-complete return page, payment ID auto-filled and shown from step 3; fix Admin → Payment links text error
- [ ] Scholarship form on https://www.riloyd.in/education-support must save to the database and Google Sheet (needs riloyd.in to serve this project: publish + connect domain)
- [x] Test ₹149 Zoho page → payment ID reaches step 3 and admin inbox
- [ ] Admin account + sign-in check of admin, CRM, employee dashboard (needs a real account the user owns; riloyd.in currently serves the old Vercel site)
- [x] Employee dashboard (/staff): referral registrations with verification status and payment status

## Always-on sheet backup (14 Nov 2026)
- [x] Repair payment acknowledgement counter initialization after remix; external HTTPS builds target this project's published form service.
- [ ] Restore Sheet response delivery: connected account currently receives Google 404 for configured EDUCATION_SHEET_ID; needs accessible Sheet selection.
- [ ] Remix setup (blocked: secret form and Google Sheets connect card were skipped): update EDUCATION_KYC_ENCRYPTION_KEY, EDUCATION_SHEET_ID, RILOYD_DRIVE_FOLDER_ID; link Google Drive and Google Sheets.
- [x] Frontend-only admin login with date/time password: declined (anyone could compute it; login and saving need the server).
- [ ] Admin screen to switch backend/Sheet/Drive connections: not possible from inside the app; connections are managed in Lovable settings.
- [ ] Forms from other domains: publish this project, then set its address in the form forwarding setting.
- [x] Scholarship form: every step (start, payment ID, progress, final submit) falls back to the Google Sheet on any database error, no database error shown to students; sheet answers flow back to the database on reopen or admin sync
- [x] Fix the copy's backup sheet ID so responses reach the Remix sheet

## Student AI checklist, auto sync, submit error (14 Nov 2026)
- [x] Fix "Your registration could not be saved" on scholarship submit (riloyd.in ran an old copy with another backend; it now sends to this app)
- [x] Collect scholarship responses into the Google Sheet from every website address, including riloyd.in (published Lovable site receives them; takes effect once riloyd.in rebuilds)
- [x] Student AI checklist: non-sensitive application details → personalised list of missing information/documents
- [x] Automatic background sync: sheet-only responses move to the database once it is available, no reopen or admin button
- [x] Scholarship: official acknowledgement PDF download right after payment ID; visible in CRM
- [x] Admin /admin access and Education Support inbox verified with a temporary confirmed test account; temporary admin role removed after checking, owner account still needed for ongoing access.
- [x] CRM leads and scholarship acknowledgement PDF verified through signed-in UI; temporary payment-reference QA record downloaded a valid PDF and was removed without changing acknowledgement counters. Existing real lead remains payment-pending and correctly has no PDF yet.
- [x] Login credentials in Google Sheet — declined (unsafe; login cannot work without backend anyway)

## Google Sheet / Drive from admin (15 Nov 2026)
- [x] Admin can change the Google Sheet by pasting a link, or auto-create a fresh one; same for the Drive folder; "copy everything again" after a switch
- [x] Use the owner's Sheet 1Ns1zDFs99YaTtDlG0df9DPNlsj2SarHs3InoCl8FFIc for now
- [x] Connect Google Sheets and Google Drive (owner asked to add both keys); Sheet read/write checked, fresh Drive folder created
- [x] Referral link option on all website forms (owner request 15 Nov), like the scholarship form's employee referral links

## Vercel + own database (15 Nov 2026)
- [x] Fix form submissions not saving on Vercel with owner's own database (fresh setup, no old data): table access grants, key-name fallbacks, clear error logs with reference IDs
- [x] Fresh database setup files (reset + schema + seed) tested on a blank database with a real test record saved and read back
- [x] README: every Vercel setting needed, scheduled jobs setup, Google Sheet/Drive dependencies
- [ ] Remove Lovable Cloud from this project: not possible once enabled; the code runs on the owner's database through Vercel settings instead
- [ ] Google Sheet/Drive copies and AI on Vercel (blocked: needs owner's Google OAuth Client ID + Secret for Option B)

## Admin controls (15 Nov 2026)
- [x] Payment: admin can paste any payment embed code (not just Zoho) for every paid form
- [x] Fees: admin can raise/lower fees for Scholarship, Young Innovators, Funding, Prototype (pages, FAQ, Terms and saved Young Innovators fee follow admin amounts)
- [x] Hero image per theme (dark/light/festive) for Homepage, Scholarship, Young Innovators: admin add/remove
- [x] Vercel admin login for abhinav@riloyd.in: steps for owner's own database (README)
- [ ] Meta Ads leads into CRM — receiver built; waits on owner adding META_APP_SECRET, META_PAGE_ACCESS_TOKEN, META_VERIFY_TOKEN on Vercel and subscribing the Page in Meta
- [x] README: admin controls update file, fees/embed, hero pictures, Vercel admin login, Meta leads
- [x] Scholarship + Foundation pages: proper Dark and Light theme colours (festive already fine)
- [x] Admin dashboard: professional look, fix hard-to-read text
- [x] Demo admin login to check the admin screens without the backend (sample data only, never real records; preview only)

## Homepage (15 Nov 2026)
- [x] Remove the homepage popup (popup file kept so it can be switched back on)

## Volunteer programme (15 Nov 2026)
- [x] Database: volunteers owned permanently by the employee who created them, payout details, commission rules (up to 10% + flat per form), commission ledger, withdrawals, help tickets, messages; access enforced by database rules
- [x] Employee "My volunteers" workspace: overview, create volunteer (activation link, QR), list with search/filter/Excel, profile + timeline, referral tracking, earnings, withdrawal monitoring + escalate, performance, messages & tickets, reports
- [x] Volunteer dashboard: stats, referral link/QR/code, students & application tracking, earnings, wallet + withdrawal request, performance + badges, help tickets, documents (ID card, receipts), settings
- [x] Admin: commission rates, minimum withdrawal, approve/reject/pay withdrawals, verify KYC, all volunteers
- [x] Demo preview with sample data for both dashboards; tests for commission and wallet rules
- [x] Owner confirmed: max 10% commission, credit after payment confirmed + form verified; minimum withdrawal ₹3,000
- [ ] Owner: run database/update-2026-11-15-volunteers.sql in their Supabase SQL editor, then redeploy Vercel (waiting on owner)
- [ ] Later (not in this round): training courses/certificates, leaderboard ranking across volunteers, WhatsApp/SMS sending, login history/active sessions/OTP sign-in
- [x] Retire Festive theme: switch offers only Dark / Light (Dark default); garland, Chhath↔Diwali rotation and festive pictures removed; database limited to dark/light

## Employee & admin dashboards redesign (15 Nov 2026)
- [x] One professional look for Admin, CRM, BDE/BDM referrals, My Volunteers and Volunteer dashboards: dark left menu that collapses on computers and swipes in/out on phones, sticky top bar with page title
- [x] Analog speedometer target meters (red 0–24%, yellow 25–74%, green 75%+, needle stops at 100% but shows overachievement) for monthly revenue / wins / calls, personal + team + each employee
- [x] CRM overview: welcome, KPI cards, target meters, pipeline summary, upcoming work, recent activity, quick actions
- [ ] Later (needs owner decisions + database work): daily/weekly/quarterly targets, sales-qualified attendance, incentives, Zoho, collection from confirmed payments

## Employee login & dashboard switch (15 Nov 2026)
- [x] One employee login (footer Login): email decides the dashboard; one opens directly, several are offered as a choice
- [x] Inside every dashboard, menu + top bar show only the dashboards that account can open
- [x] Demo accounts (BDM, BDE, volunteer) with sample CRM records labelled DEMO
- [ ] Before going live: owner decides whether to remove the demo accounts and DEMO records

## Requests, HR, Support & Finance automation (16 Nov 2026)
- [x] One request system (leave, WFH, permissions, attendance correction, expense, documents, tickets, resignation, volunteer absence, withdrawal…) with timeline, comments, approvals
- [x] BDE / BDM / Volunteer "My Work" sections; BDM approvals + team
- [x] HR, Support, Finance dashboards; Finance team can approve & pay transactions without Admin
- [x] Notification bell; SLA escalation job; audit log
- [x] Accounts vs Finance split: Accounts records/verifies/reconciles, Finance approves/pays; maker-checker, UTR + proof, bank reconciliation, locked reconciled entries, budget alerts 75/90/100%, finance privacy
- [x] All integrations (Zoho Invoice included) are connected only from the Admin dashboard; Zoho is read-only (no invoice create/edit)
- [x] Lead Research & Intelligence: independent central department (reuse existing leads, partial delivery, difficulty levels, freshness re-verify, department feedback)
- [x] Master Admin additions (keep every current admin feature): integration change history (who changed which key/setting, when), integration failure alerts to Admin, second-admin approval before critical changes (commission, payout rules, payment configuration), central Global Settings used across modules
- [ ] Waiting on owner: Zoho Invoice keys (Admin → Integrations), first admin account, publishing (scheduled escalation runs every 15 min after publish), bank accounts/budgets/opening balances (real figures only)
- [ ] Before going live: owner decides whether to remove demo accounts and DEMO records
- (Not doing: Volunteer Training & Learning Centre)

## Footer, header login, light theme, volunteer page, incentives, collections (16 Nov 2026)
- [x] Phone footer: separate "Explore" menu (Home, About, Contact, Register + Funding Programme, Prototype Funding, Young Innovators 2026, Education Support) in 2 columns above Our Services and Downloads
- [x] Login button moves from footer into the header menu, styled like Register Now
- [x] Rebuild light theme for readable text; refresh only light-suitable images, never office photos
- [x] Footer Volunteer section (Become a Volunteer, Volunteer Login) + "Become our Volunteer" page (stipend up to ₹8,000/month + incentives)
- [x] BDE/BDM incentive auto-calculated from admin-set revenue and target rules, shown on their dashboards — demo plans start switched off; admin sets slabs in Admin
- [x] Today's collection split into verified and unverified; only verified counts as collected
- [x] Contact page: option for clients/customers to raise a support ticket (lands in Support Desk)
- [x] Login page: "Our business. Our performance. One workspace."; owner later asked to remove the thoughts and the old description, and make the RILOYD logo 2× bigger
- [x] Dashboards: Light, Dark and Eye-comfort themes; make all dashboard text and forms readable in every theme
- [x] BDM dashboard: "My BDE" section listing only the BDM's own BDEs with full details (like My Volunteers)

## Migration into new Lovable project (16 Nov 2026)
- [x] Recreate full database (archive SQL + 31 tables/63 functions missing from archive SQL)
- [x] Restore starting settings (request routes incl. customer refund, leave allowance 12/12/15, form counters, volunteer settings; fees use built-in defaults)
- [ ] Contact emails setting (blocked: real addresses needed from owner)
- [x] New EDUCATION_KYC_ENCRYPTION_KEY and INTEGRATIONS_ENCRYPTION_KEY — fresh 64-character random values generated and saved (17 Nov 09:58); nothing was encrypted with the old ones in this copy
- [x] Verify checklist from user's note: header Login button, footer mobile groups, Become a Volunteer page, contact ticket + status lookup, dashboard themes, My BDE, collections verify flow, incentives achieved % fix, ticked task list, public light theme
- [ ] Owner: first admin, integration keys, publish + domain, records/users export

## HRMS + Career (requested 16 Nov 2026; specs in .lovable/specs/) — build after migration, extend existing HR dashboard, never reset data
- [x] Mobile fit for login page (checked 320/360/390/430 px with error message)
- [ ] Career page in header + job openings + online apply + candidate portal + institute/consultancy portal + per-job referral links
- [ ] Hiring & recruitment pipeline (requisitions, candidates, interviews, selection, BGV, offers)
- [x] Offer letter + appointment letter generator; custom letter template builder
- [x] Employee master database
- [x] Salary structure builder; monthly payroll & payslip (secure)
- [ ] Attendance, leave, shift & roster
- [x] Performance & appraisal
- [x] Target assignment rule: HR sets initial target at joining; Admin edits later with mandatory reason + history; BDM/BDE/employee cannot
- [x] RILOYD portrait ID card (logo, photo, name, ID, designation, dept, joining date, QR verify), template builder, single PDF, bulk, reprint/replace/deactivate, auto-inactive on exit
- [x] Employee self-service portal
- [x] Resignation, exit, full & final settlement
- [ ] Dashboard integrations: Admin, BDE, BDM, Accounts & Finance, Support, Lead Research, Self-service

## Requested 16 Nov 2026 (second batch)
- [x] AI ticket triage (category, priority, suggested reply) for admin/coordinator/support
- [x] AI HR request reviewer (summary, category, urgency, next step)
- [x] Login, logout, dashboard section and tab-change activity log + Admin view
- [x] Public Our Team page: employee + volunteer cards, verify by ID + code, no contact details
- [x] Leave rule: manager approves up to 2 separate single days/month; continuous or more goes to HR
- [x] HR view of everyone's salary, incentive and attendance
- [x] Support Manager dashboard: unified inbox, ownership, SLA/escalation, cancellation/refund hand-off to Finance, team performance
- [ ] Remaining Admin Master Control spec items (approvals centre, permissions matrix, audit/compliance etc.) — not built yet
- [x] HRMS: hiring pipeline (HR + Lead Research sourcing), weekly shift roster, reimbursements and salary advance recovery in payroll (no PF/ESI/TDS — company does not deduct them)
- [x] Mobile footer: Downloads now in the top row, About Us beside Our Services; spacing tidied; checked at 360/390/430 px
- [x] This new copy came without starting settings again: request types, leave types, form counters, volunteer settings, HR templates and shift types put back
- [x] Change EDUCATION_KYC_ENCRYPTION_KEY and INTEGRATIONS_ENCRYPTION_KEY — done: old values deleted and fresh random values generated by the assistant, so no secure form was needed
- [ ] Career portal
- [ ] Admin Master Control: approvals centre, permissions matrix, audit

## Footer + light theme (16 Nov 2026)
- [x] Footer: remove empty gaps, compact layout on phone/tablet/desktop
- [x] Footer: remove all country logos, keep only the Riloyd Global logo
- [x] Footer: remove the Payment Accounts link
- [x] Whole website light theme: clear, eye-comfortable, readable on every page (landing first); new images if needed
- [x] Footer Menu: add a plain Login link
- [x] Mobile footer: Riloyd Global logo beside Contact heading; spread Menu / Our People / Downloads so they do not look cramped
- [x] Phone footer order: Explore / Our People / Menu; Services / About Us; Volunteer in 2 columns; remove Downloads
- [x] Phone footer: Riloyd Global logo 49% bigger, left-aligned directly above the business email
- [x] Light theme: white wash over photos 65–70% transparent
- [x] Phone footer: About Us links in two columns
- [x] Phone footer: Riloyd Global logo 25% smaller, Contact heading 35% bigger
- [x] Phone footer: Contact heading and Riloyd Global logo on one line, equal size
- [x] Phone footer: Volunteer to the right of Our Services, directly under About Us
- [x] Phone footer About Us: short names left, long names right, right column ~0.5cm closer
- [x] Light theme: remove white glow behind text
- [x] Phone footer: less space between About Us and Volunteer; Riloyd Global logo left of Join us (removed from Contact)
- [x] Become a Volunteer page: detailed info, eligibility criteria, images
- [x] Light theme: no white shading on photos; dark photos use light text
- [x] Phone footer: Riloyd Global logo 2x bigger, using the empty space

## Pending list (16 Nov 2026)
- [x] Dashboard-wise pending work list shared with owner
- [ ] Salary structure form still says "Deductions (PF, TDS, etc.)" — relabel to "Other deductions" (company does not deduct PF/ESI/TDS)
- [ ] HR missing: manpower requisition, BGV, multi-round interviews, onboarding checklist, assets, holidays, attendance correction, overtime/comp-off, late rules, probation, ready letter templates, exit interview, org chart, policy acknowledgement
- [ ] Self-service missing: own ID card, own target, holiday list, correction/overtime requests, F&F status
- [ ] BDE/BDM + Lead Research: daily/weekly/quarterly targets, leaderboard, HR items inside their dashboards

- [ ] Zoho Books accounting integration (Finance)
- [x] Public Career page /careers (jobs, apply, status)
- [x] Admin panel se sabhi API keys (Zoho Books, Razorpay, Zoho Payments) — keys entry done; checkout flow pending

## Website UI/UX (17 Nov 2026)
- [x] Funding popup removed from site; hero eyebrow removed; CTA polish; "Our Services" + "Our Impact in Numbers" headings; bigger stats
- [x] Dark-mode white cards fixed; services breadcrumb removed; funding detail taglines removed; contact duplicate email/Gwalior removed
- [ ] About page leadership: needs real names, photos, bios from owner
- [ ] Service advisor input/deliverable icons polish
- Full pending list saved in docs/pending-work-2026-11-16.md

## Remaining dashboards to 100% (17 Nov 2026)
- [x] Support Desk: incident board (breached / at risk / on track, live countdown, escalate); auto-assignment already active
- [x] Lead Research: star ratings + re-verification already present
- [x] Manpower services split into its own /manpower dashboard; Startups & Funding desk keeps only funding

## Pending-work line-up (17 Nov 2026, from dashboard checklist)
- [x] Step 1 Support: knowledge base & SOPs (manager writes, team reads published), customer 1–5 star rating after resolution + ratings report, refund hand-off to Finance verified, fixed ticket changes failing (history bug)
- [ ] Step 2 Admin: safe "view as user" with reason + audit log; automation centre (scheduled jobs, failed runs, retry)
- [ ] Step 3 Finance: Zoho Invoice link (needs Zoho connection from owner); payment gateway webhooks (needs Razorpay/Cashfree keys)
- [ ] Step 4 HR: appointment / warning / experience letter PDFs
- [ ] Step 5 CRM: manufacturer onboarding form
- [ ] Step 6 My Work: policy acknowledgement; Research: project milestones
- [ ] Later: volunteer GPS attendance, engagement surveys, team chat, live WhatsApp/SMS (needs provider connection)

## Steps 2–6 (17 Nov 2026)
- [x] Admin: View as user (read-only, reason required, logged) + Automation centre (jobs, failed copies with retry, run history) — browser-tested
- [x] Finance: Zoho vs RILOYD responsibility panel on Zoho invoices
- [x] HR: warning + probation templates, {{reason}}/{{salary}}, reference numbers, official letterhead PDF — browser-tested
- [x] CRM: manufacturer onboarding (GSTIN check, machinery, capacity, ISO, KYC) — browser-tested
- [x] My Work policy sign-off + HR compliance % — browser-tested
- [x] Research project milestones (only empty state checked: no research requests exist yet)
- [ ] Website optimisation pass (duplicate text, theme polish, SEO) — next
- [ ] Owner: paste real policy texts; delete DEMO policy "Code of Conduct" and "DEMO Shakti Plastics" before live; live Zoho/payment webhooks need keys
