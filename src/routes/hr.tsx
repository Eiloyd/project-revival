import { createFileRoute } from '@tanstack/react-router';
import { Award, BadgeCheck, Briefcase, CalendarHeart, GraduationCap, ListChecks, ShieldAlert, Upload, CalendarClock, HandCoins, CalendarDays, FilePen, Wallet, Contact, ClipboardCheck, FileText, IndianRupee, LayoutDashboard, LogOut as Exit, ScrollText, Sparkles, Target, Users } from 'lucide-react';
import { PolicyAdmin } from '@/components/work/policies';
import { HrRequestAi, PeopleSalaryOverview, TargetAssignment } from '@/components/hr/hr-panels';
import { Advances, Appraisals, EmployeeMaster, Exits, IdCards, Letters, Payroll } from '@/components/hr/hrms';
import { RecruitmentSuite } from '@/components/hr/recruitment/suite';
import { RosterPlanner } from '@/components/hr/roster';
import { GrievanceAdmin, OnboardingAdmin } from '@/components/hr/onboarding';
import { HolidayAdmin } from '@/components/hr/holidays';
import { BulkCandidateUpload, InstitutesAdmin, NinetyDayTracking } from '@/components/hr/institutes';
import { DepartmentPage } from '@/components/work/department-page';
import { Approvals } from '@/components/work/requests';
import { PeopleList, TeamAttendance } from '@/components/work/attendance';

export const Route = createFileRoute('/hr')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'HR dashboard | RILOYD workspace' }, { name: 'description', content: 'RILOYD HR: hiring, shift roster, payroll, leave, attendance, salary and incentive overview, joining targets, AI request review, documents and resignations.' },
    { property: 'og:title', content: 'HR dashboard | RILOYD workspace' }, { property: 'og:description', content: 'Private HR workspace for RILOYD.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <DepartmentPage dash="hr" workspace="HR" first="h-queue" intro="HR staff sign in with their work email."
    groups={[{ title: 'HR', items: [
      { key: 'h-queue', label: 'Waiting for HR', icon: ClipboardCheck }, { key: 'h-all', label: 'All HR requests', icon: FileText },
      { key: 'h-attendance', label: 'Attendance', icon: CalendarDays }, { key: 'h-holidays', label: 'Holiday calendar', icon: CalendarHeart }, { key: 'h-people', label: 'Employees', icon: Users }, { key: 'h-exits', label: 'Resignations', icon: Exit },
      { key: 'h-overview', label: 'Leave calendar', icon: LayoutDashboard },
      { key: 'h-salary', label: 'Salary, incentive & attendance', icon: IndianRupee }, { key: 'h-targets', label: 'Joining targets', icon: Target },
      { key: 'h-ai', label: 'AI request review', icon: Sparkles },
    ] }, { title: 'HRMS', items: [
      { key: 'h-hiring', label: 'Career & recruitment', icon: Briefcase }, { key: 'h-bulk', label: 'Bulk candidate upload', icon: Upload }, { key: 'h-institutes', label: 'Institutes & 90-day tracking', icon: GraduationCap }, { key: 'h-master', label: 'Employee master', icon: Contact }, { key: 'h-onboarding', label: 'Onboarding checklist', icon: ListChecks }, { key: 'h-grievances', label: 'Grievances', icon: ShieldAlert },
      { key: 'h-roster', label: 'Shift roster', icon: CalendarClock }, { key: 'h-payroll', label: 'Payroll & payslips', icon: Wallet }, { key: 'h-advances', label: 'Salary advances', icon: HandCoins },
      { key: 'h-letters', label: 'Letters & templates', icon: FilePen }, { key: 'h-policies', label: 'Policy sign-off', icon: ScrollText }, { key: 'h-cards', label: 'ID cards', icon: BadgeCheck },
      { key: 'h-appraisal', label: 'Performance & appraisal', icon: Award }, { key: 'h-fnf', label: 'Exit & full and final', icon: Exit },
    ] }]}
    render={(s, uid) => s === 'h-policies' ? <PolicyAdmin /> : s === 'h-onboarding' ? <OnboardingAdmin /> : s === 'h-grievances' ? <GrievanceAdmin /> : s === 'h-hiring' ? <RecruitmentSuite /> : s === 'h-bulk' ? <BulkCandidateUpload /> : s === 'h-institutes' ? <div className="grid gap-5"><NinetyDayTracking /><InstitutesAdmin /></div> : s === 'h-holidays' ? <HolidayAdmin /> : s === 'h-roster' ? <RosterPlanner /> : s === 'h-advances' ? <Advances /> : s === 'h-master' ? <EmployeeMaster /> : s === 'h-payroll' ? <Payroll /> : s === 'h-letters' ? <Letters /> : s === 'h-cards' ? <IdCards /> : s === 'h-appraisal' ? <Appraisals /> : s === 'h-fnf' ? <Exits /> : s === 'h-salary' ? <PeopleSalaryOverview /> : s === 'h-targets' ? <TargetAssignment mode="hr" /> : s === 'h-ai' ? <HrRequestAi /> : s === 'h-all' ? <Approvals uid={uid} mode="dept" dept="hr" title="All requests through HR" />
      : s === 'h-attendance' ? <TeamAttendance /> : s === 'h-people' ? <PeopleList title="Employees" />
      : s === 'h-exits' ? <Approvals uid={uid} mode="dept" dept="hr" title="Resignations & exits" />
      : s === 'h-overview' ? <Approvals uid={uid} mode="dept" dept="hr" title="Leave & WFH (approved and pending)" />
      : <Approvals uid={uid} title="Waiting for HR" />} />,
});
