import { createFileRoute, Link } from "@tanstack/react-router";
import { Component, lazy, Suspense, useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAccess } from "@/lib/admin-bootstrap.functions";
import { Activity, BarChart3, IndianRupee, Sparkles, Target, Trophy, Building2, ClipboardList, History, Plug, ScrollText, ShieldAlert, SlidersHorizontal, BriefcaseBusiness, CircleUserRound, CreditCard, FileText, Flag, FolderSync, Globe2, GraduationCap, HeartHandshake, IdCard, Image as ImageIcon, Inbox, LayoutDashboard, Lightbulb, Link2, LogOut, MessageSquare, Rocket, Sheet, ShieldCheck, Trash2, Upload, UserCog, Users, Eye, Workflow, ReceiptText, type LucideIcon } from "lucide-react";
import { DEMO_ADMIN_EMAIL, demoRecent, demoStats } from "@/lib/admin-demo";
import { z } from "zod";
import { AuthForm } from "@/components/auth-form";
import { DashboardGate, DashboardShell } from "@/components/dashboard/shell";
const ProfilesAdmin = lazy(() => import("@/components/profiles-admin").then(m => ({ default: m.ProfilesAdmin })));
const SubmissionsAdmin = lazy(() => import("@/components/submissions-admin").then(m => ({ default: m.SubmissionsAdmin })));
const ReportsAdmin = lazy(() => import("@/components/reports-admin").then(m => ({ default: m.ReportsAdmin })));
const SetupAdmin = lazy(() => import("@/components/setup-admin").then(m => ({ default: m.SetupAdmin })));
const RecordsImportAdmin = lazy(() => import("@/components/records-import-admin").then(m => ({ default: m.RecordsImportAdmin })));
const FilesRestoreAdmin = lazy(() => import("@/components/files-restore-admin").then(m => ({ default: m.FilesRestoreAdmin })));
const AccountProfileAdmin = lazy(() => import("@/components/account-profile-admin").then(m => ({ default: m.AccountProfileAdmin })));
const CountryLogosAdmin = lazy(() => import("@/components/country-logos-admin").then(m => ({ default: m.CountryLogosAdmin })));
const ReferralLinksAdmin = lazy(() => import("@/components/referral-links").then(m => ({ default: m.ReferralLinksAdmin })));
const GoogleCopyAdmin = lazy(() => import("@/components/google-copy-admin").then(m => ({ default: m.GoogleCopyAdmin })));
const HeroImagesAdmin = lazy(() => import("@/components/hero-images-admin").then(m => ({ default: m.HeroImagesAdmin })));
const PaymentOptionsAdmin = lazy(() => import("@/components/payment-options-admin").then(m => ({ default: m.PaymentOptionsAdmin })));
const ProgrammeFeesAdmin = lazy(() => import("@/components/programme-fees-admin").then(m => ({ default: m.ProgrammeFeesAdmin })));
const YoungRegistrationsAdmin = lazy(() => import("@/components/young-registrations-admin").then(m => ({ default: m.YoungRegistrationsAdmin })));
const EducationStaffAdmin = lazy(() => import('@/components/education-staff-admin').then(m => ({ default: m.EducationStaffAdmin })));
const EducationSupportAdmin = lazy(() => import("@/components/education-support-admin").then(m => ({ default: m.EducationSupportAdmin })));
const FoundationSubmissionsAdmin = lazy(() => import("@/components/foundation-submissions-admin").then(m => ({ default: m.FoundationSubmissionsAdmin })));
const VolunteersAdmin = lazy(() => import("@/components/volunteers/team-workspace").then(m => ({ default: m.TeamWorkspace })));
const lazyCC = <K extends keyof typeof import("@/components/admin/control-centre")>(k: K) => lazy(() => import("@/components/admin/control-centre").then(m => ({ default: m[k] as ComponentType })));
const DepartmentsAdmin = lazyCC("DepartmentsAdmin"); const AllRequestsAdmin = lazyCC("AllRequestsAdmin"); const IntegrationsAdmin = lazyCC("IntegrationsAdmin");
const CriticalApprovals = lazyCC("CriticalApprovals"); const IncentivePlansAdmin = lazyCC("IncentivePlansAdmin"); const GlobalSettingsAdmin = lazyCC("GlobalSettingsAdmin"); const ChangeHistory = lazyCC("ChangeHistory"); const AuditLogAdmin = lazyCC("AuditLogAdmin");
const lazyHr = <K extends keyof typeof import("@/components/hr/hr-panels")>(k: K) => lazy(() => import("@/components/hr/hr-panels").then(m => ({ default: m[k] as ComponentType<Record<string, unknown>> })));
const TargetAssignmentPanel = lazyHr("TargetAssignment"); const PeopleSalaryOverviewPanel = lazyHr("PeopleSalaryOverview");
const AuthMethodsAdmin = lazy(() => import("@/components/admin/auth-methods-admin").then(m => ({ default: m.AuthMethodsAdmin })));
const ApprovalsHub = lazy(() => import("@/components/admin/approvals-hub").then(m => ({ default: m.ApprovalsHub })));
const PermissionsMatrix = lazy(() => import("@/components/admin/approvals-hub").then(m => ({ default: m.PermissionsMatrix })));
const WebsiteAnalyticsAdmin = lazy(() => import("@/components/admin/website-analytics").then(m => ({ default: m.WebsiteAnalyticsAdmin })));
const ActivityLogAdmin = lazy(() => import("@/components/admin/activity-log-admin").then(m => ({ default: m.ActivityLogAdmin })));
const TicketAiAssistant = lazy(() => import("@/components/support/ticket-ai-assistant").then(m => ({ default: m.TicketAiAssistant as ComponentType })));
const RecruitmentSuite = lazy(() => import("@/components/hr/recruitment/suite").then(m => ({ default: m.RecruitmentSuite })));
const AdminPeriodReports = lazy(() => import("@/components/admin/reports-users").then(m => ({ default: m.AdminPeriodReports })));
const UsersDirectory = lazy(() => import("@/components/admin/reports-users").then(m => ({ default: m.UsersDirectory })));
const ViewAsUser = lazy(() => import("@/components/admin/view-as-automation").then(m => ({ default: m.ViewAsUser })));
const AutomationCentre = lazy(() => import("@/components/admin/view-as-automation").then(m => ({ default: m.AutomationCentre })));
const ProgrammePaymentsAdmin = lazy(() => import("@/components/admin/programme-payments-admin").then(m => ({ default: m.ProgrammePaymentsAdmin })));
const CrmControl = lazy(() => import("@/components/admin/crm-control").then(m => ({ default: m.CrmControl })));
const PrototypeSubmissionsAdmin = lazy(() => import("@/components/prototype-submissions-admin").then(m => ({ default: m.PrototypeSubmissionsAdmin })));
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Admin | Riloyd Applications, Enquiries & People" },
      { name: "description", content: "Riloyd staff area for reviewing registrations and enquiries and managing people and employee records." },
      { property: "og:title", content: "Admin | Riloyd Applications, Enquiries & People" },
      { property: "og:description", content: "Private Riloyd workspace for application review, enquiries and people management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Employee = { id: string; employee_id: string; full_name: string; photo_url: string | null; designation: string; department: string; status: string; valid_until: string | null; public_listing: boolean };

type SectionKey = "overview" | "applications" | "enquiries" | "education-support" | "young-innovators" | "prototypes" | "foundation" | "employees" | "profiles" | "education-staff" | "referrals" | "volunteers" | "payment-links" | "programme-fees" | "hero-images" | "country-logos" | "reports" | "google" | "import" | "files" | "setup" | "account" | "departments" | "all-requests" | "integrations" | "incentives" | "approvals" | "global-settings" | "sign-in" | "history" | "audit" | "targets" | "salary" | "activity" | "ticket-ai" | "approvals-hub" | "permissions" | "recruitment" | "period-reports" | "users" | "view-as" | "automation" | "web-analytics" | "crm-control" | "programme-payments";
type Section = { key: SectionKey; label: string; icon: LucideIcon; description: string };
const sectionGroups: { title: string; items: Section[] }[] = [
  { title: "Dashboard", items: [{ key: "overview", label: "Overview", icon: LayoutDashboard, description: "Shortcuts to every part of the admin workspace." }, { key: "approvals-hub", label: "Approvals Centre", icon: ClipboardList, description: "Everything waiting for a decision across all dashboards, in one place." }, { key: "period-reports", label: "Reports & analytics", icon: BarChart3, description: "Every department for any date range, with BDE/BDM targets rolled up by team." }, { key: "web-analytics", label: "Website analytics", icon: Globe2, description: "Visitors, where they came from, pages they explored, and website errors with reason and fix." }, { key: "permissions", label: "Permissions matrix", icon: ShieldCheck, description: "Which role can view or edit each module." }] },
  { title: "Inbox", items: [
    { key: "applications", label: "Applications", icon: Inbox, description: "Website registrations: review, export and download documents." },
    { key: "enquiries", label: "Enquiries", icon: MessageSquare, description: "Contact form messages from visitors." },
    { key: "education-support", label: "Education Support", icon: GraduationCap, description: "Scholarship & sponsorship registrations, payment IDs and acknowledgements." },
    { key: "young-innovators", label: "Young Innovators", icon: Lightbulb, description: "Guardian-consented student registrations." },
    { key: "prototypes", label: "Prototype submissions", icon: Rocket, description: "Saved prototype eligibility reviews." },
    { key: "foundation", label: "Foundation forms", icon: HeartHandshake, description: "Assistance, volunteer and donation forms." },
  ] },
  { title: "People", items: [
    { key: "users", label: "Users & access", icon: UserCog, description: "Every account and the dashboards and roles it has." },
    { key: "employees", label: "Employees", icon: IdCard, description: "Employee IDs and verification codes." },
    { key: "profiles", label: "People profiles", icon: Users, description: "Investors, mentors, team, startups and businesses shown on the site." },
    { key: "education-staff", label: "BDE / BDM", icon: UserCog, description: "Education staff access and teams." },
    { key: "referrals", label: "Referral links", icon: Link2, description: "Create referral links for every form." },
    { key: "volunteers", label: "Volunteers", icon: HeartHandshake, description: "All volunteers: KYC, commission rates, withdrawals and tickets." },
  ] },
  { title: "Website", items: [
    { key: "payment-links", label: "Fees & payment", icon: CreditCard, description: "Fees, payment links and payment embed codes for every paid form." },
    { key: "programme-payments", label: "Programme payments", icon: ReceiptText, description: "Transaction IDs sent from the Young Innovators, Prototype Funding and Funding Programme forms — verify or reject." },
    { key: "programme-fees", label: "Registration fees", icon: Globe2, description: "Funding Programme fees: India and each international country." },
    { key: "hero-images", label: "Hero pictures", icon: ImageIcon, description: "Top pictures per theme for the Homepage, Scholarship and Young Innovators." },
    { key: "country-logos", label: "Country logos", icon: Flag, description: "Logos shown in the footer and market pages." },
    { key: "reports", label: "Reports", icon: FileText, description: "Customer reports for the Downloads page." },
  ] },
  { title: "Company", items: [
    { key: "crm-control", label: "CRM control (all modules)", icon: BriefcaseBusiness, description: "Every CRM module for the whole company — pipeline, customers, tasks, support, targets, employees, website leads — and a shortcut to every dashboard." },
    { key: "departments", label: "Departments & access", icon: Building2, description: "HR, Support, Accounts, Finance and Lead Research staff, approval routes, SLA hours and leave per year." },
    { key: "all-requests", label: "All requests", icon: ClipboardList, description: "Every request from every department, and the ones waiting for an admin." },
    { key: "recruitment", label: "Career & recruitment", icon: BriefcaseBusiness, description: "All jobs, applications, institutes, referral partners, commissions and recruitment reports. Approve and publish jobs." },
    { key: "targets", label: "Targets & revisions", icon: Target, description: "Change, increase or decrease employee targets after joining. Reason is mandatory; old/new values and full history are kept." },
    { key: "salary", label: "Salary & attendance", icon: IndianRupee, description: "Every employee's salary structure, this month's attendance, verified revenue and incentive." },
    { key: "ticket-ai", label: "AI ticket helper", icon: Sparkles, description: "Paste a customer ticket: AI suggests category, priority and a reply draft." },
  ] },
  { title: "Control centre", items: [
    { key: "integrations", label: "Integrations", icon: Plug, description: "Connect, test, enable or disconnect every external service — only here." },
    { key: "incentives", label: "Incentive plans", icon: Trophy, description: "BDE and BDM incentive slabs on verified revenue vs target (needs a second admin's approval)." },
    { key: "approvals", label: "Change approvals", icon: ShieldAlert, description: "Payment configuration, commission and payout rule changes waiting for a second admin." },
    { key: "global-settings", label: "Global settings", icon: SlidersHorizontal, description: "Settings used across several parts of the website." },
    { key: "sign-in", label: "Sign-in & security", icon: ShieldCheck, description: "Switch login methods on or off: email code, email link, password, SMS, Google and more, plus 2-step verification." },
    { key: "history", label: "Change history", icon: History, description: "Who changed which setting or key, and when." },
    { key: "audit", label: "Audit log", icon: ScrollText, description: "Approvals, payments and access changes across all dashboards." },
    { key: "activity", label: "Login & activity log", icon: Activity, description: "Who signed in, signed out and which dashboard tabs they opened." },
    { key: "view-as", label: "View as user", icon: Eye, description: "Read-only look at a person's access and activity. A reason is required and every view is logged." },
    { key: "automation", label: "Automation centre", icon: Workflow, description: "Scheduled jobs, failed Google Sheet copies with retry, and integration run history." },
  ] },
  { title: "Data & setup", items: [
    { key: "google", label: "Google Sheet & Drive", icon: Sheet, description: "Where website responses are copied." },
    { key: "import", label: "Import records", icon: Upload, description: "Bring in records from CSV files." },
    { key: "files", label: "Restore files", icon: FolderSync, description: "Put back stored files for existing records." },
    { key: "setup", label: "Setup check", icon: ShieldCheck, description: "Checks that the website's settings are complete." },
    { key: "account", label: "My account", icon: CircleUserRound, description: "Your own admin profile." },
  ] },
];
const allSections = sectionGroups.flatMap(g => g.items);

function SectionPanel({ section, email, demo }: { section: SectionKey; email: string; demo: boolean }) {
  switch (section) {
    case "overview": return <AdminOverview demo={demo} />;
    case "applications": return <SubmissionsAdmin kind="applications" />;
    case "enquiries": return <SubmissionsAdmin kind="enquiries" />;
    case "education-support": return <EducationSupportAdmin />;
    case "young-innovators": return <YoungRegistrationsAdmin />;
    case "prototypes": return <PrototypeSubmissionsAdmin />;
    case "foundation": return <FoundationSubmissionsAdmin />;
    case "employees": return <AdminPanel email={email} />;
    case "profiles": return <ProfilesAdmin />;
    case "education-staff": return <EducationStaffAdmin />;
    case "referrals": return <ReferralLinksAdmin />;
    case "volunteers": return <VolunteersAdmin role="admin" demo={demo} uid="" />;
    case "payment-links": return <PaymentOptionsAdmin />;
    case "programme-payments": return <ProgrammePaymentsAdmin />;
    case "programme-fees": return <ProgrammeFeesAdmin />;
    case "hero-images": return <HeroImagesAdmin />;
    case "country-logos": return <CountryLogosAdmin />;
    case "reports": return <ReportsAdmin />;
    case "crm-control": return <CrmControl />;
    case "google": return <GoogleCopyAdmin />;
    case "import": return <RecordsImportAdmin />;
    case "files": return <FilesRestoreAdmin />;
    case "setup": return <SetupAdmin />;
    case "account": return <AccountProfileAdmin />;
    case "departments": return <DepartmentsAdmin />;
    case "all-requests": return <AllRequestsAdmin />;
    case "integrations": return <IntegrationsAdmin />;
    case "incentives": return <IncentivePlansAdmin />;
    case "approvals": return <CriticalApprovals />;
    case "global-settings": return <GlobalSettingsAdmin />;
    case "sign-in": return <AuthMethodsAdmin />;
    case "history": return <ChangeHistory />;
    case "audit": return <AuditLogAdmin />;
    case "targets": return <TargetAssignmentPanel mode="admin" />;
    case "salary": return <PeopleSalaryOverviewPanel />;
    case "activity": return <ActivityLogAdmin />;
    case "web-analytics": return <WebsiteAnalyticsAdmin />;
    case "view-as": return <ViewAsUser />;
    case "automation": return <AutomationCentre />;
    case "ticket-ai": return <TicketAiAssistant />;
    case "approvals-hub": return <ApprovalsHub />;
    case "permissions": return <PermissionsMatrix />;
    case "recruitment": return <RecruitmentSuite admin />;
    case "period-reports": return <AdminPeriodReports />;
    case "users": return <UsersDirectory />;
  }
}

/** One broken section never takes down the whole admin page. */
class PanelBoundary extends Component<{ demo: boolean; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() {
    if (!this.state.failed) return this.props.children;
    return <p role="alert" className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">{this.props.demo ? "This section needs the live database, so it cannot open in the demo preview." : "This section could not open. Please reload the page; if it keeps happening, check Setup check."}</p>;
  }
}

function AdminOverview({ demo }: { demo: boolean }) {
  return <div className="space-y-8">
    {demo && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{demoStats.map(s => <article key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm"><p className="text-xs font-semibold text-muted-foreground">{s.label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{s.value}</p><p className="mt-1 text-xs text-muted-foreground">{s.note}</p></article>)}</div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><div className="border-b border-border px-5 py-3"><h3 className="text-sm font-bold">Latest submissions (sample)</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-surface text-xs text-muted-foreground"><tr><th className="px-5 py-2.5 font-semibold">Name</th><th className="px-5 py-2.5 font-semibold">Form</th><th className="px-5 py-2.5 font-semibold">State</th><th className="px-5 py-2.5 font-semibold">Status</th></tr></thead><tbody>{demoRecent.map(r => <tr key={r.name} className="border-t border-border"><td className="px-5 py-3 font-semibold">{r.name}</td><td className="px-5 py-3 text-muted-foreground">{r.form}</td><td className="px-5 py-3 text-muted-foreground">{r.state}</td><td className="px-5 py-3"><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{r.status}</span></td></tr>)}</tbody></table></div></div>
    </>}
    {sectionGroups.slice(1).map(g => <div key={g.title}><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{g.title}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{g.items.map(item => <a key={item.key} href={`#${item.key}`} className="dash-card group flex gap-3 p-4 transition-colors hover:border-primary/50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><item.icon size={18} /></span><span><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span></span></a>)}</div></div>)}
  </div>;
}

function AdminWorkspace({ email, demo, onSignOut }: { email: string; demo: boolean; onSignOut: () => void }) {
  const [section, setSection] = useState<SectionKey>("overview");
  useEffect(() => {
    const read = () => { const key = window.location.hash.slice(1); if (allSections.some(s => s.key === key)) setSection(key as SectionKey); };
    read(); window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = (key: string) => { setSection(key as SectionKey); window.history.replaceState(null, "", `#${key}`); window.scrollTo({ top: 0 }); };
  const current = allSections.find(s => s.key === section) ?? allSections[0]!;
  return <DashboardShell workspace="Admin" groups={sectionGroups.map(g => ({ title: g.title, items: g.items.map(i => ({ key: i.key, label: i.label, icon: i.icon })) }))} active={section} onSelect={go}
    user={{ name: email, detail: demo ? "Demo preview" : "Administrator" }} onSignOut={onSignOut} signOutLabel={demo ? "Exit demo" : "Sign out"}
    actions={demo ? <span className="rounded-full border border-border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Demo · sample data</span> : undefined}
    subtitle={current.description}>
    {demo && <p className="mb-5 rounded-xl border border-border bg-accent px-4 py-3 text-sm text-accent-foreground"><strong>Demo preview.</strong> You are looking at sample screens on the preview only. No real records are loaded and nothing is saved.</p>}
    <section className={section === "overview" ? "min-w-0" : "dash-card min-w-0 p-4 sm:p-6"}>
      <div className="admin-panel-body">
        {demo && section !== "overview" && <p className="mb-4 rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">Demo preview: this section loads live records, so without the database it shows its empty or "could not load" state. Buttons will not save anything.</p>}
        <PanelBoundary key={section} demo={demo}><Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><SectionPanel section={section} email={email} demo={demo} /></Suspense></PanelBoundary>
      </div>
      <span className="sr-only" aria-live="polite">{current.label}</span>
    </section>
  </DashboardShell>;
}

function AdminPage() {
  const queryClient = useQueryClient();
  const access = useServerFn(getAdminAccess);
  const [accessError, setAccessError] = useState("");
  const [, setSetup] = useState<string | null>(null);
  const [accessVersion, setAccessVersion] = useState(0);
  const [demo, setDemo] = useState(false);
  const signOut = async () => { if (demo) { setDemo(false); return; } await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); };
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Without database settings (e.g. a frontend-only preview) there is no sign-in; the page still opens.
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
      return () => sub.subscription.unsubscribe();
    } catch { setReady(true); return undefined; }
  }, []);

  useEffect(() => {
    let current = true;
    setIsAdmin(null); setSetup(null); setAccessError("");
    if (!session) return;
    access().then(result => { if (current) { setIsAdmin(result.admin); setSetup(result.setup); } })
      .catch(error => { if (current) setAccessError(error instanceof Error ? error.message : "Access could not be checked."); });
    return () => { current = false; };
  }, [session?.user.id, accessVersion, access]);

  const signedIn = demo || (session && isAdmin);
  const email = demo ? DEMO_ADMIN_EMAIL : session?.user.email ?? "";
  if (signedIn) return <AdminWorkspace email={email} demo={demo} onSignOut={() => void signOut()} />;
  return <DashboardGate workspace="Admin panel" title={!session ? "Admin sign in" : "Admin access"} intro={!session ? "Sign in with your RILOYD admin account." : undefined}>
    {!ready ? null
      : !session ? <AuthForm redirectPath="/admin" />
      : accessError ? <div className="dash-card p-5"><p role="alert" className="text-sm">{accessError}</p><div className="mt-3 flex gap-2"><Button onClick={() => setAccessVersion(v => v + 1)}>Retry access check</Button><Button variant="outline" onClick={() => void signOut()}><LogOut size={14} />Sign out</Button></div></div>
      : isAdmin === null ? <p className="text-sm text-muted-foreground">Checking access…</p>
      : <div className="dash-card p-5"><p className="text-sm">Your account does not have admin access. Your own dashboard opens from the employee login.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/login">Go to my dashboard</Link></Button><Button variant="ghost" onClick={() => void signOut()}><LogOut size={14} />Sign out</Button></div></div>}
  </DashboardGate>;
}

const empSchema = z.object({
  employeeId: z.string().trim().min(2, "Enter the Employee ID").max(40),
  code: z.string().trim().max(64),
  fullName: z.string().trim().min(1, "Enter the full name").max(120),
  photoUrl: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//.test(v), "Photo link must start with https://"),
  designation: z.string().trim().min(1, "Enter the designation").max(120),
  department: z.string().trim().min(1, "Enter the department").max(120),
  status: z.enum(["active", "inactive"]),
  validUntil: z.string(),
});

const empty = { employeeId: "", code: "", fullName: "", photoUrl: "", designation: "", department: "", status: "active" as "active" | "inactive", validUntil: "" };

function AdminPanel({ email }: { email: string }) {
  const [rows, setRows] = useState<Employee[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("employees").select("id, employee_id, full_name, photo_url, designation, department, status, valid_until, public_listing").order("employee_id");
    setRows((data as Employee[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const p = empSchema.safeParse(form);
    if (!p.success) { setMsg(p.error.issues[0]?.message ?? "Check the details"); return; }
    if (!editing && p.data.code.length < 6) { setMsg("Employee Code must be at least 6 characters"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("admin_save_employee", {
      _employee_id: p.data.employeeId, _code: p.data.code, _full_name: p.data.fullName, _photo_url: p.data.photoUrl,
      _designation: p.data.designation, _department: p.data.department, _status: p.data.status, _valid_until: p.data.validUntil || null,
    } as never);
    setBusy(false);
    if (error) { setMsg("Couldn't save. Please check the details and try again."); return; }
    setMsg(editing ? "Employee updated." : "Employee added."); setForm(empty); setEditing(false); load();
  }

  async function remove(r: Employee) {
    if (!confirm(`Remove ${r.full_name} (${r.employee_id})?`)) return;
    await supabase.from("employees").delete().eq("id", r.id); load();
  }

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
    <form onSubmit={save} className="grid content-start gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? "Edit employee" : "Add employee"}</h2><span className="sr-only">{email}</span></div>
      <div className="grid gap-1.5"><Label htmlFor="f-id">Employee ID</Label><Input id="f-id" value={form.employeeId} onChange={set("employeeId")} disabled={editing} placeholder="e.g. RLY-1024" /></div>
      <div className="grid gap-1.5"><Label htmlFor="f-code">Employee Code {editing && <span className="text-muted-foreground">(leave blank to keep)</span>}</Label><Input id="f-code" type="password" value={form.code} onChange={set("code")} autoComplete="new-password" /></div>
      <div className="grid gap-1.5"><Label htmlFor="f-name">Full name</Label><Input id="f-name" value={form.fullName} onChange={set("fullName")} /></div>
      <div className="grid gap-1.5"><Label htmlFor="f-photo">Photo link (optional)</Label><Input id="f-photo" value={form.photoUrl} onChange={set("photoUrl")} placeholder="https://…" /></div>
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label htmlFor="f-des">Designation</Label><Input id="f-des" value={form.designation} onChange={set("designation")} /></div><div className="grid gap-1.5"><Label htmlFor="f-dep">Department</Label><Input id="f-dep" value={form.department} onChange={set("department")} /></div></div>
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label htmlFor="f-st">Status</Label><select id="f-st" value={form.status} onChange={set("status")} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="grid gap-1.5"><Label htmlFor="f-vu">Valid until</Label><Input id="f-vu" type="date" value={form.validUntil} onChange={set("validUntil")} /></div></div>
      {editing && (() => { const emp = rows.find(r => r.employee_id === form.employeeId); return emp ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={emp.public_listing} disabled={busy} className="accent-primary" onChange={async e => { const on = e.target.checked; setBusy(true); const { error } = await supabase.from("employees").update({ public_listing: on }).eq("id", emp.id); setBusy(false); if (error) { setMsg("Couldn't update website visibility."); return; } setRows(prev => prev.map(r => r.id === emp.id ? { ...r, public_listing: on } : r)); setMsg(on ? "Shown on the website Team page." : "Hidden from the website Team page."); }} />Show on the website Team page</label> : null; })()}
      {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
      <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add employee"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(false); setForm(empty); }}>Cancel</Button>}</div>
    </form>
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="bg-surface px-5 py-3 text-xs font-bold uppercase text-muted-foreground">{rows.length} employee{rows.length === 1 ? "" : "s"}</div>
      {rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No employees yet. Add the first one using the form.</p> : rows.map((r) => <div key={r.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <button type="button" className="text-left" onClick={() => { setEditing(true); setMsg(null); setForm({ employeeId: r.employee_id, code: "", fullName: r.full_name, photoUrl: r.photo_url ?? "", designation: r.designation, department: r.department, status: r.status as "active" | "inactive", validUntil: r.valid_until ?? "" }); }}>
          <p className="text-sm font-bold">{r.full_name} <span className="font-normal text-muted-foreground">· {r.employee_id}</span></p>
          <p className="text-xs text-muted-foreground">{r.designation}, {r.department} · {r.status}{r.valid_until ? ` · until ${r.valid_until}` : ""}</p>
        </button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${r.full_name}`} onClick={() => remove(r)}><Trash2 size={15} /></Button>
      </div>)}
    </div>
  </div>;
}
