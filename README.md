# RILOYD — website, employee workspaces and partner portals

RILOYD (RISHISHWAR INDUSTRY PRIVATE LIMITED) helps startups and businesses grow with funding support, strategy, sales and transformation services. This repository holds the **public website** and the **private workspaces** the company runs on: sales CRM, HR, support, accounts & finance, lead research, startups & funding, manpower, volunteers, and portals for clients, job candidates and partner institutes.

Built with [Lovable](https://lovable.dev) on TanStack Start, React 19, TypeScript and Tailwind CSS v4, with a Supabase (Postgres) backend.

---

## Contents

- [What is inside](#what-is-inside)
- [Help Centre and first-login guide](#help-centre-and-first-login-guide)
- [Tech stack](#tech-stack)
- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Database setup (your own Supabase project)](#database-setup-your-own-supabase-project)
- [Deploy on Vercel](#deploy-on-vercel)
- [Scheduled jobs](#scheduled-jobs)
- [Tests and quality checks](#tests-and-quality-checks)
- [Project structure](#project-structure)
- [Security and data separation](#security-and-data-separation)
- [Editing help answers and the guided tour](#editing-help-answers-and-the-guided-tour)
- [Troubleshooting](#troubleshooting)

---

## What is inside

### Public website
Home (with a "Check your status" box), About, Services, Contact (enquiry form + public support ticket), Careers, Registration forms (startup, business, investor, mentor), Funding & Prototype Funding programmes, Young Innovators 2026, RILOYD Foundation and Student Scholarship & Sponsorship (with policy pages), Global presence pages per country, team/mentor/investor/startup directories, downloads, and the **Help Centre** (`/help`).

### Private dashboards
Everyone signs in at **`/login`**. The database function `my_dashboards()` decides which dashboards an account may open: one opens straight away, several are offered as a choice, and the shared menu lets people switch.

| Dashboard | Address | For | Main jobs |
|---|---|---|---|
| Admin panel | `/admin` | Admins | Users & access, Approvals Centre, reports, website analytics, fees & payment links, departments, recruitment, targets & salary, integrations, maker-checker change approvals, view-as-user, activity & audit logs, imports, setup check |
| Employee CRM | `/crm`, `/crm/sales` | BDE / BDM | Leads & pipeline, day planner, tasks, daily sales report, collections (Direct vs Volunteer-sourced), "Remove your zero" alert, daily wage & attendance, targets, incentives, team performance |
| BDE / BDM referrals | `/staff` | Sales staff | Referral links (WhatsApp share) and referred students |
| My Volunteers | `/my-volunteers` | Employees who manage volunteers | Create volunteers, referrals, withdrawals, messages, reward schemes, commission calculator |
| Volunteer dashboard | `/volunteer` | Volunteers | Students, earnings & wallet (₹3,000 minimum withdrawal), rewards, requests, help tickets |
| HR | `/hr` | HR team | HR queue, employees, attendance, leave, roster, payroll & payslips, recruitment, onboarding, institutes, exits & full and final, grievances, policies |
| Support desk | `/support-desk` | Support team | Unified inbox, logging calls/WhatsApp, AI ticket helper, knowledge base, SLA & escalations, incidents, refunds, ratings |
| Accounts & Finance | `/finance` | Accounts / Finance | Approvals & payments, volunteer payouts, collections verification, register & receipts, bank reconciliation, payroll, budgets, Zoho, MIS |
| Lead Research | `/research` | Research team | Lead requests from departments, lead bank, delivery, feedback |
| Startups & Funding | `/ventures` | Admin, BDE/BDM, jury | Startups & businesses, funding pipeline, jury rounds, service requests |
| Manpower desk | `/manpower` | Operations | Requirement → profiles → placement → timesheet → invoice → payment, with delay tracking |
| My Work | `/work` (and inside every employee dashboard) | Every employee | Requests, approvals, leave & WFH, attendance, payslips & letters, ID card, expenses, tickets, grievances, meetings, policies |
| Client portal | `/client-portal` | Startups / businesses | Funding progress, documents, services, manpower timesheets & invoices, support |
| Candidate portal | `/candidate-portal` | Job applicants | Applications, interviews & tests, messages & documents, offer |
| Institute portal | `/institute-portal` | Partner colleges | Bulk upload and 90-day tracking |

---

## Help Centre and first-login guide

- **Help Centre — `/help`.** A searchable, Google-style help site: topics for every dashboard plus *Getting started*, *Sign-in & account* and *Requests & tickets*. Each answer is a numbered how-to with tips and related answers. It explains what every feature does and how to raise a **ticket** or a **request** (leave, expense, advance, documents…) from each place. Article pages live at `/help/<slug>` and are listed in the sitemap.
- **First-login guided tour.** The first time a person opens a dashboard, a short spotlight tour shows the menu, the most important sections for *that* dashboard (only the ones that person can see), the alerts bell, the theme switch, the dashboard switcher and the Help button. It is remembered per person and per dashboard on that device.
- **Help button in every dashboard.** The top bar has a **Help** button: replay the tour, open help for the current dashboard, or jump to "How to raise a ticket" and "Leave, expense & other requests" (opens in a new tab so work on screen is kept).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start v1 (React 19, server functions, SSR) on Vite 7 |
| Routing | TanStack Router, file-based (`src/routes`) |
| Data | TanStack Query (30-second cache, preload on hover/touch) |
| Styling | Tailwind CSS v4 via `src/styles.css`, shadcn/ui components, lucide icons |
| Backend | Supabase: Postgres with Row Level Security, Auth, private Storage buckets |
| AI | Lovable AI Gateway (ticket triage, call coach, enquiry helper, prototype check) |
| Tests | Vitest + Testing Library |

---

## Run it locally

You need Node.js 20+ (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install        # or: bun install
npm run dev        # http://localhost:8080
```

Create a `.env` with the browser-safe Supabase values (see below) before signing in.

---

## Environment variables

Never commit secret values. Browser-safe values start with `VITE_`; everything else is read **only on the server**.

| Name | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Browser + server | Connect the app to your Supabase project (publishable key is safe to expose) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Server | Same project, for server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged server work (form saves, scheduled jobs). Never expose |
| `INTEGRATIONS_ENCRYPTION_KEY` | Server only | **Optional.** Encrypts integration keys saved from Admin → Integrations. When unset, a key derived from `SUPABASE_SERVICE_ROLE_KEY` is used. Do not change (or rotate the service role key) once keys are saved, or re-enter them |
| `EDUCATION_KYC_ENCRYPTION_KEY` | Server only | **Optional.** Encrypts student bank/Aadhaar details (AES-GCM). When unset, a key derived from `SUPABASE_SERVICE_ROLE_KEY` is used. **Never change either once data exists** |
| `LOVABLE_CRON_SECRET` (or `CRON_SECRET`) | Server only | Bearer secret that scheduled job addresses check |
| `LOVABLE_API_KEY` | Server only | AI features through the Lovable AI Gateway |
| `GOOGLE_SHEETS_API_KEY`, `GOOGLE_DRIVE_API_KEY`, `EDUCATION_SHEET_ID`, `RILOYD_DRIVE_FOLDER_ID` | Server only | Optional Google Sheet / Drive copies (can also be set from Admin → Google Sheet & Drive) |
| `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_VERIFY_TOKEN` | Server only | Optional Meta Lead Ads webhook (`/api/public/meta-leads`) |

---

## Database setup (your own Supabase project)

All database work ships as **re-runnable SQL files in [`database/`](database/README.md)** — run them in the Supabase SQL editor of your own project. Full step-by-step instructions, the order and checks are in **[`database/README.md`](database/README.md)**. In short:

1. `reset.sql` — only if the project has tables from an earlier attempt.
2. `schema.sql`, then `seed.sql`.
3. The update files, oldest first (`update-2026-11-15-*.sql`, then `update-2026-11-17-sales-pay-volunteer-rewards.sql`). Turn on the **pg_cron** extension before the 17 Nov file so the 20-minute "Remove your zero" bell alerts run.
4. `restore-starter.sql` for starting settings (approval routes, fees, jury stages).
5. Sign up at `/login`, then open `/admin` to claim the first admin (possible only while no admin exists).

Screens whose tables are not set up yet show a clear "not set up yet" note instead of breaking.

---

## Deploy on Vercel

1. Import the repository in Vercel.
2. Add every variable from [Environment variables](#environment-variables) under **Project → Settings → Environment Variables** (Production and Preview).
3. Build command `npm run build`. Deploy.
4. In Supabase → Authentication → URL configuration, add your site address (e.g. `https://www.riloyd.in`) and `https://www.riloyd.in/reset-password` as redirect URLs so sign-up and password emails work.
5. Point your domain (e.g. `riloyd.in`) to Vercel and update the Meta webhook address if you use Lead Ads.

---

## Scheduled jobs

These addresses accept **GET** (Vercel Cron) and **POST**, and require `Authorization: Bearer <CRON_SECRET>` — Vercel Cron sends this header automatically when a `CRON_SECRET` variable is set.

| Address | Suggested schedule | What it does |
|---|---|---|
| `/api/public/jobs/work-escalations` | Every hour | Escalates requests and tickets that passed their reply time |
| `/api/public/jobs/google-sheet-copy` | Every 5 minutes | Copies new/changed records and uploaded files to Google Sheet / Drive |
| `/api/public/jobs/education-sheet-sync` | Every 5 minutes | Syncs scholarship form backups with the Google Sheet |

Example `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/public/jobs/work-escalations", "schedule": "0 * * * *" },
    { "path": "/api/public/jobs/google-sheet-copy", "schedule": "*/5 * * * *" },
    { "path": "/api/public/jobs/education-sheet-sync", "schedule": "*/5 * * * *" }
  ]
}
```

(Vercel's free plan limits how often cron jobs may run; use a paid plan or an external scheduler for 5-minute jobs.)

---

## Tests and quality checks

```sh
npm test          # run every test once (Vitest)
npm run lint      # ESLint
npm run build     # production build
```

Business rules are kept in small browser-safe modules with tests next to them — for example sales pay and incentives (`src/lib/crm/`), volunteer rules (`src/lib/volunteers/rules.ts`), request routing and leave (`src/lib/requests.ts`), dashboard access (`src/lib/dashboards.ts`) and help search (`src/lib/help/`).

---

## Project structure

```text
src/
  routes/               one file per page (file-based routing); __root.tsx is the shared frame
    api/public/         webhooks and scheduled jobs (each verifies its caller)
    help.index.tsx      Help Centre home       help.$slug.tsx  one help answer
  components/
    dashboard/          shared workspace frame (menu, top bar, guided tour, KPI cards)
    help/               Help Centre search, topic icons, Help button
    crm/ hr/ support/ volunteers/ ventures/ work/ research/ admin/ ...   dashboard screens
    ui/                 shadcn/ui building blocks
  lib/                  business rules, server functions, help content (lib/help/)
  integrations/supabase generated Supabase clients (do not edit)
database/               SQL files to set up your own database (see database/README.md)
public/                 favicon, manifest, robots.txt
```

---

## Security and data separation

- **Row Level Security everywhere.** BDEs see only their own leads and collections, BDMs their team, volunteers only their own wallet and referrals, clients only their own company, institutes only their own students.
- **Maker-checker.** The person who records or verifies money cannot approve or pay it; sensitive settings (fees, payouts, commission) need a second admin in Change approvals.
- **Encryption.** Bank, IFSC and Aadhaar details are encrypted on the server and never shown in plain text in the browser or exports.
- **Private files.** Every storage bucket is private; files are shared with short-lived signed links.
- **Audit.** Sign-ins, sections opened, view-as sessions and setting changes are logged.

---

## Editing help answers and the guided tour

All help text lives in one file: **`src/lib/help/content.ts`**.

- `helpTopics` — the topic cards on `/help`.
- `helpArticles` — each answer (`slug`, `topic`, `title`, `summary`, `steps`, optional `tips`, `keywords`, `related`). Add `keywords` with the words people actually type (Hindi words in Latin letters work too, e.g. "chutti").
- `dashboardGuides` — the guided tour per dashboard: a welcome line, the menu sections to point at (by their menu key) and a "first thing to do".

Run `npm test` afterwards — the help tests check that every dashboard has a topic and a tour, that article addresses are unique and that related links exist.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "No dashboard yet" after sign-in | An admin must give access in Admin → Users & access or Departments & access, then sign in again |
| Forms fail with `permission denied` (42501) | Run the GRANT lines at the end of `database/schema.sql` |
| A screen says "not set up yet" | Run the matching SQL file from `database/` |
| No "Remove your zero" bell alerts | Turn on `pg_cron`, then run `update-2026-11-17-sales-pay-volunteer-rewards.sql` again |
| Password or sign-up emails open the wrong site | Add your site address to Supabase Auth redirect URLs |
| Guided tour does not appear | It shows once per person per dashboard; replay it from the Help button |
