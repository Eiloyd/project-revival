import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeVerify } from "@/components/employee-verify";
import { VolunteerVerify } from "@/components/volunteer-verify";
import { initials } from "@/lib/people-config";

type Kind = "all" | "employee" | "volunteer";

export function TeamDirectory() {
  const [mounted, setMounted] = useState(false);
  const [kind, setKind] = useState<Kind>("all");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [employee, setEmployee] = useState({ id: "", key: 0 });
  const [volunteer, setVolunteer] = useState({ id: "", key: 0 });

  useEffect(() => { setMounted(true); }, []);

  const directory = useQuery({
    queryKey: ["public-team-directory"],
    enabled: mounted,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_team_directory");
      if (error) throw new Error("The directory is unavailable right now.");
      return data ?? [];
    },
    staleTime: 60_000,
    retry: 1,
  });

  const members = directory.data ?? [];
  const departments = [...new Set(members
    .filter(m => m.kind === "employee" && m.department)
    .map(m => m.department))].sort();
  const query = search.trim().toLocaleLowerCase();
  const visible = members.filter(m =>
    (kind === "all" || m.kind === kind) &&
    (kind === "volunteer" || !department || (m.kind === "employee" && m.department === department)) &&
    [m.full_name, m.member_id, m.department].some(value => (value ?? "").toLocaleLowerCase().includes(query)),
  );

  // ID card QR codes open /team?verify=<Employee ID>; prefill the verification form after hydration.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("verify");
    if (id && /^[\w-]{1,40}$/.test(id)) verify("employee", id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function verify(memberKind: string, id: string) {
    const isEmployee = memberKind === "employee";
    if (isEmployee) setEmployee(previous => ({ id, key: previous.key + 1 }));
    else setVolunteer(previous => ({ id, key: previous.key + 1 }));
    requestAnimationFrame(() => {
      document.getElementById(isEmployee ? "verify" : "verify-volunteer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById(isEmployee ? "emp-id" : "vol-id")?.focus({ preventScroll: true });
    });
  }

  return <>
    <section aria-labelledby="our-people" className="border-b border-border py-14 sm:py-20">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-6 lg:px-12">
        <h2 id="our-people" className="text-3xl font-black uppercase sm:text-5xl">Our people</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Meet our active employees and volunteers who are listed on the website.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Contact details are never shown publicly. To reach a team member, use the{" "}
          <Link to="/contact" className="font-semibold text-primary underline underline-offset-4">Contact page</Link>.
        </p>
        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Filter people">
          {([["all", "All"], ["employee", "Employees"], ["volunteer", "Volunteers"]] as const).map(([value, label]) =>
            <Button key={value} type="button" size="sm" variant={kind === value ? "default" : "outline"} aria-pressed={kind === value}
              onClick={() => { setKind(value); setDepartment(""); }}>{label}</Button>,
          )}
        </div>
        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          <Input aria-label="Search by name, ID or department" placeholder="Search name, ID or department" value={search} onChange={e => setSearch(e.target.value)} />
          {kind !== "volunteer" && <select aria-label="Filter employees by department" value={department} onChange={e => setDepartment(e.target.value)}
            className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All departments</option>
            {departments.map(value => <option key={value} value={value}>{value}</option>)}
          </select>}
        </div>
        {directory.isPending ? <div role="status" className="mt-6">
          <span className="sr-only">Loading our people…</span>
          <div aria-hidden="true" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-muted" />)}
          </div>
        </div> : directory.isError ? <div role="alert" className="mt-6 rounded-xl border border-border p-5">
          <p className="text-sm">The directory is unavailable right now. Please try again.</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => void directory.refetch()}>Try again</Button>
        </div> : visible.length === 0 ? <p role="status" className="mt-6 rounded-xl border border-border p-5 text-sm text-muted-foreground">
          {members.length ? "No people match these filters." : "No team members are listed yet."}
        </p> : <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map(member => {
            const isEmployee = member.kind === "employee";
            return <article key={`${member.kind}-${member.member_id}`} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 text-card-foreground sm:p-5">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted text-xl font-black text-muted-foreground">
                {member.photo_url ? <img src={member.photo_url} alt={member.full_name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  : initials(member.full_name)}
              </div>
              <div className="mt-4 min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                <h3 className="text-sm font-extrabold sm:text-base">{member.full_name}</h3>
                {member.designation && <p className="mt-1 text-xs font-semibold text-primary">{member.designation}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{isEmployee ? member.department : "RILOYD Volunteer Network"}</p>
                {!isEmployee && member.location && <p className="mt-1 text-xs text-muted-foreground">{member.location}</p>}
                <p className="mt-4 rounded-md border border-border bg-muted p-2 text-[10px]">
                  <span className="block font-semibold">{isEmployee ? "Employee ID" : "Volunteer ID"}</span>
                  <span className="font-mono">{member.member_id}</span>
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" className="mt-4 w-full" aria-label={`Verify ${member.full_name}`}
                onClick={() => verify(member.kind, member.member_id)}>Verify</Button>
            </article>;
          })}
        </div>}
      </div>
    </section>
    <section aria-label="Employee and volunteer verification" className="border-b border-border py-14 sm:py-20">
      <div className="mx-auto grid max-w-[1380px] items-start gap-6 px-5 sm:px-6 lg:grid-cols-2 lg:px-12">
        <EmployeeVerify initialId={employee.id} prefillKey={employee.key} />
        <VolunteerVerify initialId={volunteer.id} prefillKey={volunteer.key} />
      </div>
    </section>
  </>;
}
