import type { ReactNode } from 'react';
import { BadgeCheck, CalendarCheck, CalendarHeart, IdCard, CalendarDays, ClipboardCheck, FileText, Headset, Inbox, ReceiptIndianRupee, ShieldAlert, SearchCheck, ScrollText, UserCheck, Users, type LucideIcon } from 'lucide-react';
import type { ShellItem } from '@/components/dashboard/shell';
import { Approvals, MyRequests } from './requests';
import { AttendancePanel, LeavePanel, PeopleList, TeamAttendance } from './attendance';
import { MeetingsPanel } from './meetings';
import { MyLeadRequests } from '@/components/research/research';
import { MyHr } from '@/components/hr/hrms';
import { HolidayCalendar } from '@/components/hr/holidays';
import { MyGrievance } from '@/components/hr/onboarding';
import { MyCardAndTarget } from './my-card-target';
import { MyPolicies } from './policies';
import { MyInterviews } from '@/components/hr/recruitment/candidates';

/** "My Work" items any employee gets (CRM, department dashboards, /work). Managers also get team views. */
export function workItems(opts: { manager?: boolean } = {}): ShellItem[] {
  const items: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'w-card', label: 'My ID card & target', icon: IdCard },
    { key: 'w-hr', label: 'My HR: payslips, letters, profile', icon: BadgeCheck },
    { key: 'w-requests', label: 'My requests', icon: FileText },
    { key: 'w-approvals', label: 'Approvals', icon: ClipboardCheck },
    { key: 'w-leave', label: 'Leave & WFH', icon: CalendarDays },
    { key: 'w-attendance', label: 'Attendance', icon: CalendarCheck },
    { key: 'w-holidays', label: 'Holiday calendar', icon: CalendarHeart },
    { key: 'w-expenses', label: 'Expenses & payments', icon: ReceiptIndianRupee },
    { key: 'w-support', label: 'Support & HR help', icon: Headset },
    { key: 'w-grievance', label: 'Raise a grievance', icon: ShieldAlert },
    { key: 'w-meetings', label: 'Meetings', icon: Inbox },
    { key: 'w-interviews', label: 'Interviews I take', icon: UserCheck },
    { key: 'w-research', label: 'Lead research', icon: SearchCheck },
    { key: 'w-policies', label: 'Company policies', icon: ScrollText },
  ];
  if (opts.manager) items.splice(2, 0, { key: 'w-team', label: 'Team & attendance', icon: Users });
  return items;
}

export function isWorkKey(k: string) { return k.startsWith('w-'); }

export function WorkView({ k, uid }: { k: string; uid: string }): ReactNode {
  switch (k) {
    case 'w-card': return <MyCardAndTarget />;
    case 'w-holidays': return <HolidayCalendar />;
    case 'w-hr': return <MyHr uid={uid} />;
    case 'w-requests': return <MyRequests uid={uid} audience="employee" />;
    case 'w-approvals': return <div className="grid gap-5"><Approvals uid={uid} /><Approvals uid={uid} mode="team" /></div>;
    case 'w-team': return <div className="grid gap-5"><PeopleList title="My team" /><TeamAttendance /></div>;
    case 'w-leave': return <LeavePanel uid={uid} />;
    case 'w-attendance': return <AttendancePanel uid={uid} />;
    case 'w-expenses': return <MyRequests uid={uid} audience="employee" types={['expense', 'payment_request']} title="Expenses & payment requests" presetType="expense" />;
    case 'w-support': return <MyRequests uid={uid} audience="employee" types={['technical_ticket', 'hr_ticket', 'salary_query', 'document_request', 'profile_update', 'meeting_request', 'complaint', 'resignation']} title="Support, HR help, documents & resignation" presetType="technical_ticket" />;
    case 'w-grievance': return <MyGrievance />;
    case 'w-meetings': return <MeetingsPanel uid={uid} />;
    case 'w-interviews': return <MyInterviews />;
    case 'w-research': return <MyLeadRequests uid={uid} />;
    case 'w-policies': return <MyPolicies uid={uid} />;
    default: return null;
  }
}
