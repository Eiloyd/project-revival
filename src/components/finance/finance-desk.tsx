import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KpiCard } from '@/components/dashboard/shell';
import { budgetAlertLevel, downloadCsv, parseBankCsv, txnTypes } from '@/lib/finance';
import { money, shortDate, todayIST } from '@/lib/requests';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { Approvals } from '@/components/work/requests';
import { useServerFn } from '@tanstack/react-start';
import { listSalesCollections, verifyCrmCollection } from '@/lib/crm.functions';
import { collectionTotals } from '@/lib/crm/incentives';
import { canIssueReceipt } from '@/lib/receipts';

type Role = { accounts: boolean; finance: boolean; manager: boolean; admin: boolean };
export function useFinRole(uid: string) {
  return useQuery({ queryKey: ['fin-role', uid], queryFn: async () => {
    const [d, a] = await Promise.all([supabase.from('department_staff').select('department,level,active').eq('user_id', uid), supabase.rpc('has_role', { _user_id: uid, _role: 'admin' })]);
    const rows = (d.data ?? []).filter(r => r.active);
    return { accounts: rows.some(r => r.department === 'accounts'), finance: rows.some(r => r.department === 'finance'), manager: rows.some(r => (r.department === 'finance' || r.department === 'accounts') && r.level === 'manager'), admin: Boolean(a.data) } as Role;
  } });
}
const useAccounts = () => useQuery({ queryKey: ['fin-accounts'], queryFn: async () => { const { data, error } = await supabase.rpc('fin_account_balances'); if (error) throw error; return data; } });
const txnStatusTone = { recorded: 'warning', verified: 'info', reconciled: 'success', void: 'muted' } as const;

export function FinanceDesk({ section, uid }: { section: string; uid: string }) {
  const role = useFinRole(uid).data ?? { accounts: false, finance: false, manager: false, admin: false };
  switch (section) {
    case 'f-approvals': return <div className="grid gap-5"><Approvals uid={uid} title="Waiting for me (verify / approve / pay)" /><Approvals uid={uid} mode="dept" dept={role.finance || role.admin ? 'finance' : 'accounts'} title="All money requests" /></div>;
    case 'f-withdrawals': return <Withdrawals role={role} uid={uid} />;
    case 'f-collections': return <SalesCollections uid={uid} />;
    case 'f-register': return <Register role={role} uid={uid} />;
    case 'f-reconcile': return <Reconcile role={role} />;
    case 'f-accounts': return <BankAccounts role={role} />;
    case 'f-budgets': return <Budgets role={role} />;
    case 'f-dues': return <Dues />;
    case 'f-vendors': return <Vendors />;
    case 'f-zoho': return <div className="grid gap-5"><Panel title="Who does what: Zoho and RILOYD"><ul className="grid gap-2 text-sm sm:grid-cols-2">
      <li className="rounded-md border border-border p-3"><b>Zoho (official)</b><br />Creates every GST invoice, tax number and credit note. Invoices here are read-only copies from Zoho.</li>
      <li className="rounded-md border border-border p-3"><b>RILOYD</b><br />Tracks approvals, payment confirmation (UTR + proof), bank reconciliation and settlement. RILOYD never creates GST invoices.</li></ul>
      <p className="mt-2 text-xs text-muted-foreground">Online payments are matched in Bank reconciliation. Live Zoho and payment-gateway sync starts once their keys are added in Admin → Integrations.</p></Panel><ZohoInvoices /></div>;
    case 'f-reports': return <Reports />;
    default: return <Overview role={role} />;
  }
}

function Overview({ role }: { role: Role }) {
  const q = useQuery({ queryKey: ['fin-overview'], queryFn: async () => { const { data, error } = await supabase.rpc('fin_overview'); if (error) throw error; return data as unknown as { bank_balance: number; cash_balance: number; accounts: number; low_balance: number; received_month: number; paid_month: number; receivables: number; payables: number; overdue_receivables: number; overdue_payables: number; pending_expenses: number; pending_expense_amount: number; pending_approvals: number; ready_to_pay: number; ready_to_pay_amount: number; volunteer_pending: number; volunteer_pending_amount: number; unverified_entries: number; unreconciled_lines: number; missing_proof: number; budgets_over_75: number;  monthly: { month: string; income: number | null; expense: number | null }[]; categories: { category: string; amount: number }[] }; } });
  if (q.isPending) return <Loading />; if (q.error) return <ErrorNote error={q.error} />;
  const o = q.data!;
  const alerts = [
    o.low_balance && `${o.low_balance} account(s) below the low-balance level`, o.overdue_receivables && `${o.overdue_receivables} overdue receivable(s)`, o.overdue_payables && `${o.overdue_payables} overdue payable(s)`,
    o.unreconciled_lines && `${o.unreconciled_lines} bank line(s) not reconciled`, o.unverified_entries && `${o.unverified_entries} entry(ies) waiting for Accounts verification`,
    o.missing_proof && `${o.missing_proof} payment(s) without proof`, o.budgets_over_75 && `${o.budgets_over_75} budget(s) at 75% or more`, o.volunteer_pending && `${o.volunteer_pending} volunteer withdrawal(s) pending`,
  ].filter(Boolean) as string[];
  const max = Math.max(1, ...o.monthly.map(m => Math.max(Number(m.income ?? 0), Number(m.expense ?? 0))));
  return <div className="grid gap-5">
    <p className="text-sm text-muted-foreground">You are signed in as {[role.admin && 'Admin', role.accounts && 'Accounts', role.finance && 'Finance', role.manager && 'manager'].filter(Boolean).join(' · ') || 'viewer'}. Every number below comes from recorded entries only.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Bank balance (books)" value={money(o.bank_balance)} note={`${o.accounts} active account(s)`} /><KpiCard label="Cash balance" value={money(o.cash_balance)} />
      <KpiCard label="Received this month" value={money(o.received_month)} tone="success" /><KpiCard label="Paid this month" value={money(o.paid_month)} tone="warning" />
      <KpiCard label="Receivables outstanding" value={money(o.receivables)} /><KpiCard label="Payables outstanding" value={money(o.payables)} />
      <KpiCard label="Money requests to verify / approve" value={o.pending_approvals} note={`${o.pending_expenses} expense claim(s) · ${money(o.pending_expense_amount)}`} /><KpiCard label="Approved, waiting for payment" value={o.ready_to_pay} note={money(o.ready_to_pay_amount)} tone={o.ready_to_pay ? 'warning' : 'default'} />
      <KpiCard label="Volunteer withdrawals pending" value={o.volunteer_pending} note={money(o.volunteer_pending_amount)} />
    </div>
    <Panel title="Alerts">{alerts.length ? <ul className="grid gap-2">{alerts.map(a => <li key={a} className="flex items-center gap-2 text-sm"><AlertTriangle className="size-4 text-[var(--dash-warning)]" />{a}</li>)}</ul> : <p className="flex items-center gap-2 text-sm text-[var(--dash-success)]"><CheckCircle2 className="size-4" />No alerts.</p>}</Panel>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Income vs expense (12 months)">{!o.monthly.length ? <Empty>No entries yet.</Empty> : <ul className="grid gap-2">{o.monthly.map(m => <li key={m.month} className="grid grid-cols-[64px_1fr] items-center gap-2 text-xs"><span className="text-muted-foreground">{m.month}</span><span className="grid gap-1">
        <span className="h-2 rounded bg-[var(--dash-success)]" style={{ width: `${(Number(m.income ?? 0) / max) * 100}%` }} title={`In ${money(m.income)}`} /><span className="h-2 rounded bg-[var(--dash-danger)]" style={{ width: `${(Number(m.expense ?? 0) / max) * 100}%` }} title={`Out ${money(m.expense)}`} /></span></li>)}</ul>}</Panel>
      <Panel title="Spending by category (this month)">{!o.categories.length ? <Empty>No spending recorded this month.</Empty> : <Table head={['Category', 'Amount']}>{o.categories.map(c => <tr key={c.category}><Td>{c.category}</Td><Td>{money(c.amount)}</Td></tr>)}</Table>}</Panel>
    </div>
  </div>;
}

function ProofLink({ bucket, path }: { bucket: string; path: string }) {
  if (!path) return <span className="text-xs text-muted-foreground">—</span>;
  return <button type="button" className="text-xs text-primary hover:underline" onClick={async () => { const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 120); if (data) window.open(data.signedUrl, '_blank', 'noopener'); }}>View proof</button>;
}

function Withdrawals({ role, uid }: { role: Role; uid: string }) {
  const qc = useQueryClient(); const accts = useAccounts(); const [err, setErr] = useState<unknown>(null); const [paying, setPaying] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['fin-withdrawals'], queryFn: async () => { const { data, error } = await supabase.rpc('finance_withdrawals'); if (error) throw error; return data; } });
  const act = async (id: string, status: string, extra: Record<string, string> = {}) => { setErr(null); const { error } = await supabase.rpc('volunteer_process_withdrawal', { _id: id, _status: status, ...extra }); if (error) setErr(error); else { setPaying(null); void qc.invalidateQueries({ queryKey: ['fin-withdrawals'] }); } };
  const [utr, setUtr] = useState(''); const [acct, setAcct] = useState('');
  async function pay(id: string, file?: File) {
    if (!file) return setErr(new Error('Attach the payment proof.'));
    const path = `withdrawals/${id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
    const up = await supabase.storage.from('finance-proofs').upload(path, file); if (up.error) return setErr(up.error);
    await act(id, 'paid', { _transaction_id: utr, _proof_path: path, ...(acct ? { _account_id: acct } : {}) });
  }
  return <Panel title="Volunteer withdrawals">
    <p className="mb-3 text-sm text-muted-foreground">Step 1: Accounts verifies KYC and commission. Step 2: a different Finance person pays with UTR and proof.</p><ErrorNote error={err} />
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No withdrawals yet.</Empty> :
      <Table head={['Request', 'Volunteer', 'Amount', 'Pay to', 'Status', 'Action']}>{q.data!.map(w => <tr key={w.id}>
        <Td><span className="font-mono text-xs">{w.request_number}</span><span className="block text-xs text-muted-foreground">{shortDate(w.requested_at)}</span></Td>
        <Td>{w.volunteer_name}<span className="block text-xs text-muted-foreground">{w.volunteer_code} · KYC {w.kyc_status}</span></Td><Td className="font-semibold">{money(w.amount)}</Td><Td className="text-xs">{w.payout_masked}</Td>
        <Td><Pill tone={w.status === 'paid' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}>{w.status === 'processing' ? 'verified' : w.status}</Pill>{w.verified_by_name && <span className="block text-xs text-muted-foreground">by {w.verified_by_name}</span>}{w.transaction_id && <span className="block font-mono text-xs">{w.transaction_id}</span>}{w.proof_path && <ProofLink bucket="finance-proofs" path={w.proof_path} />}</Td>
        <Td><div className="flex flex-wrap gap-1">
          {w.status === 'pending' && (role.accounts || role.admin) && <Button size="sm" onClick={() => void act(w.id, 'processing')}>Verify</Button>}
          {w.status === 'processing' && (role.finance || role.admin) && w.verified_by !== uid && <Button size="sm" onClick={() => setPaying(w.id)}>Pay</Button>}
          {w.status === 'processing' && w.verified_by === uid && <span className="text-xs text-muted-foreground">Another person must pay</span>}
          {['pending', 'processing'].includes(w.status) && <Button size="sm" variant="ghost" onClick={() => { const r = window.prompt('Reason for rejecting'); if (r) void act(w.id, 'rejected', { _reason: r }); }}>Reject</Button>}
        </div></Td></tr>)}</Table>}
    {paying && <Dialog open onOpenChange={o => { if (!o) setPaying(null); }}><DialogContent className="dash-shell max-w-md"><DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader><div className="grid gap-3">
      <Field label="UTR / transaction ID"><input className={inputCls} value={utr} onChange={e => setUtr(e.target.value)} /></Field>
      {(accts.data ?? []).length > 0 && <Field label="Paid from"><select className={inputCls} value={acct} onChange={e => setAcct(e.target.value)}><option value="">Choose account</option>{accts.data!.filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
      <Field label="Payment proof (choosing it records the payment)"><input type="file" accept="image/*,application/pdf" onChange={e => void pay(paying, e.target.files?.[0])} /></Field><ErrorNote error={err} /></div></DialogContent></Dialog>}
  </Panel>;
}

function Register({ role, uid }: { role: Role; uid: string }) {
  const qc = useQueryClient(); const [adding, setAdding] = useState(false); const [err, setErr] = useState<unknown>(null);
  const [from, setFrom] = useState(`${todayIST().slice(0, 7)}-01`); const [to, setTo] = useState(todayIST());
  const q = useQuery({ queryKey: ['fin-txns', from, to], queryFn: async () => { const { data, error } = await supabase.from('fin_transactions').select('*, fin_accounts(name)').gte('txn_date', from).lte('txn_date', to).order('txn_date', { ascending: false }).limit(1000); if (error) throw error; return data; } });
  const call = async (fn: () => PromiseLike<{ error: unknown }>) => { setErr(null); const { error } = await fn(); if (error) setErr(error); else void qc.invalidateQueries({ queryKey: ['fin-txns'] }); };
  return <Panel title="Transaction register" actions={<>
    <input type="date" aria-label="From" className={`${inputCls} w-auto`} value={from} onChange={e => setFrom(e.target.value)} /><input type="date" aria-label="To" className={`${inputCls} w-auto`} value={to} onChange={e => setTo(e.target.value)} />
    {q.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv(`register-${from}-${to}.csv`, q.data!.map(t => ({ ref: t.ref, date: t.txn_date, direction: t.direction, type: t.type, category: t.category, department: t.department, account: t.fin_accounts?.name ?? '', amount: t.amount, mode: t.mode, utr: t.utr, party: t.party_name, description: t.description, status: t.status })))}>Download CSV</Button> : null}
    <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" />Record entry</Button></>}>
    <p className="mb-3 text-xs text-muted-foreground">Maker-checker: whoever records an entry cannot verify it. Reconciled entries are locked; mistakes are fixed with a correction entry by a manager.</p><ErrorNote error={err} />
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No entries in these dates.</Empty> :
      <Table head={['Ref / date', 'Type', 'Party · description', 'Amount', 'Status', '']}>{q.data!.map(t => <tr key={t.id}>
        <Td><span className="font-mono text-xs">{t.ref}</span><span className="block text-xs text-muted-foreground">{shortDate(t.txn_date)} · {t.fin_accounts?.name ?? 'No account'}</span></Td>
        <Td className="capitalize">{t.type.replace('_', ' ')}<span className="block text-xs text-muted-foreground">{t.category} · {t.department}</span></Td>
        <Td className="max-w-xs text-xs">{t.party_name}<span className="block text-muted-foreground">{t.description}</span>{t.utr && <span className="block font-mono">UTR {t.utr}</span>}{t.proof_path && <ProofLink bucket={t.source === 'request' ? 'request-files' : 'finance-proofs'} path={t.proof_path} />}</Td>
        <Td className={`font-semibold ${t.direction === 'in' ? 'text-[var(--dash-success)]' : ''}`}>{t.direction === 'in' ? '+' : '−'}{money(t.amount)}</Td>
        <Td><Pill tone={txnStatusTone[t.status as keyof typeof txnStatusTone]}>{t.status}</Pill>{t.status === 'void' && <span className="block text-xs text-muted-foreground">{t.void_reason}</span>}</Td>
        <Td><div className="flex flex-wrap gap-1">
          {t.status === 'recorded' && (role.accounts || role.admin) && t.created_by !== uid && <Button size="sm" variant="outline" onClick={() => void call(() => supabase.rpc('fin_verify_transaction', { _id: t.id }))}>Verify</Button>}
          {canIssueReceipt(t) && <Button size="sm" variant="outline" title="Printable A4 receipt with QR" onClick={() => void import('@/lib/receipt-pdf').then(m => m.receiptPdf({ ref: t.ref, date: shortDate(t.txn_date), party: t.party_name ?? '', amount: Number(t.amount), mode: t.mode ?? '', utr: t.utr, description: t.description, account: t.fin_accounts?.name ?? null, status: t.status })).catch(setErr)}>Receipt</Button>}
          {t.status !== 'void' && t.status !== 'reconciled' && t.source === 'manual' && (role.manager || role.admin) && <Button size="sm" variant="ghost" onClick={() => { const r = window.prompt('Reason for voiding this entry'); if (r) void call(() => supabase.rpc('fin_void_transaction', { _id: t.id, _reason: r })); }}>Void</Button>}
        </div></Td></tr>)}</Table>}
    {adding && <EntryDialog onClose={() => setAdding(false)} onDone={() => { setAdding(false); void qc.invalidateQueries({ queryKey: ['fin-txns'] }); }} canCorrect={role.manager || role.admin} />}
  </Panel>;
}

function EntryDialog({ onClose, onDone, canCorrect }: { onClose: () => void; onDone: () => void; canCorrect: boolean }) {
  const accts = useAccounts(); const parties = useQuery({ queryKey: ['fin-vendors'], queryFn: async () => (await supabase.from('fin_vendors').select('id,name').eq('active', true).order('name')).data ?? [] });
  const dues = useQuery({ queryKey: ['fin-dues'], queryFn: async () => (await supabase.rpc('fin_dues_list')).data ?? [] });
  const [v, setV] = useState({ type: 'received', direction: 'in', amount: '', txn_date: todayIST(), account_id: '', mode: 'bank', utr: '', category: '', department: 'All', party_id: '', party_name: '', due_id: '', description: '', corrects_id: '' });
  const [file, setFile] = useState<File | null>(null); const [err, setErr] = useState<unknown>(null); const [busy, setBusy] = useState(false);
  const t = txnTypes.find(x => x.value === v.type)!;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    let proof = '';
    if (file) { proof = `entries/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`; const up = await supabase.storage.from('finance-proofs').upload(proof, file); if (up.error) { setBusy(false); return setErr(up.error); } }
    const { error } = await supabase.rpc('fin_record_transaction', { _input: { ...v, proof_path: proof, party_name: v.party_name || parties.data?.find(p => p.id === v.party_id)?.name || '' } as never });
    setBusy(false); if (error) setErr(error); else onDone();
  }
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>Record a financial entry</DialogTitle></DialogHeader>
    <form onSubmit={e => void submit(e)} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Type"><select className={inputCls} value={v.type} onChange={set('type')}>{txnTypes.filter(x => x.value !== 'adjustment' || canCorrect).map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></Field>
        {t.dir === 'either' && <Field label="Direction"><select className={inputCls} value={v.direction} onChange={set('direction')}><option value="in">Money in</option><option value="out">Money out</option></select></Field>}
        <Field label="Amount (₹)"><input type="number" min="0.01" step="0.01" required className={inputCls} value={v.amount} onChange={set('amount')} /></Field><Field label="Date"><input type="date" className={inputCls} value={v.txn_date} onChange={set('txn_date')} /></Field>
        <Field label="Account"><select className={inputCls} value={v.account_id} onChange={set('account_id')}><option value="">—</option>{(accts.data ?? []).filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        <Field label="Mode"><select className={inputCls} value={v.mode} onChange={set('mode')}>{['bank', 'upi', 'cash', 'cheque', 'card', 'other'].map(m => <option key={m}>{m}</option>)}</select></Field>
        <Field label="UTR / reference"><input className={inputCls} value={v.utr} onChange={set('utr')} /></Field><Field label="Category"><input className={inputCls} value={v.category} onChange={set('category')} placeholder="Rent, Travel, Fees…" /></Field>
        <Field label="Department"><input className={inputCls} value={v.department} onChange={set('department')} /></Field>
        <Field label="Party"><select className={inputCls} value={v.party_id} onChange={set('party_id')}><option value="">— or type below —</option>{(parties.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field></div>
      {!v.party_id && <Field label="Party name"><input className={inputCls} value={v.party_name} onChange={set('party_name')} /></Field>}
      <Field label="Settles receivable / payable (optional)"><select className={inputCls} value={v.due_id} onChange={set('due_id')}><option value="">—</option>{(dues.data ?? []).filter(d => d.status !== 'paid').map(d => <option key={d.id} value={d.id}>{d.direction === 'receivable' ? 'From' : 'To'} {d.party_name} · {money(d.outstanding)} {d.invoice_ref && `· ${d.invoice_ref}`}</option>)}</select></Field>
      {v.type === 'adjustment' && <Field label="Corrects entry (reference ID)" hint="Paste the entry ID being corrected; the original stays unchanged."><input className={inputCls} value={v.corrects_id} onChange={set('corrects_id')} /></Field>}
      <Field label="Description"><textarea className={areaCls} value={v.description} onChange={set('description')} /></Field>
      <Field label="Supporting document / proof"><input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field>
      <ErrorNote error={err} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy}>{busy ? 'Saving…' : 'Record'}</Button></div>
    </form></DialogContent></Dialog>;
}

function Reconcile({ role }: { role: Role }) {
  const qc = useQueryClient(); const accts = useAccounts(); const [acct, setAcct] = useState(''); const [err, setErr] = useState<unknown>(null); const [msg, setMsg] = useState('');
  const account = acct || accts.data?.[0]?.id || '';
  const lines = useQuery({ queryKey: ['fin-lines', account], enabled: Boolean(account), queryFn: async () => { const { data, error } = await supabase.from('fin_bank_lines').select('*, fin_transactions(ref,party_name,utr)').eq('account_id', account).order('line_date', { ascending: false }).limit(1000); if (error) throw error; return data; } });
  const open = useQuery({ queryKey: ['fin-open-txns'], queryFn: async () => (await supabase.from('fin_transactions').select('id,ref,amount,direction,txn_date,party_name,utr').in('status', ['recorded', 'verified']).order('txn_date', { ascending: false }).limit(500)).data ?? [] });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['fin-lines'] }); void qc.invalidateQueries({ queryKey: ['fin-open-txns'] }); void qc.invalidateQueries({ queryKey: ['fin-txns'] }); };
  const act = async (line: string, action: string, txn?: string, note = '') => { setErr(null); const { error } = await supabase.rpc('fin_bank_line_action', { _line: line, _action: action, ...(txn ? { _txn: txn } : {}), _note: note }); if (error) setErr(error); else refresh(); };
  async function importFile(f?: File) {
    if (!f || !account) return; setErr(null); setMsg('');
    const parsed = parseBankCsv(await f.text()); if (parsed.error) return setErr(new Error(parsed.error));
    const { data, error } = await supabase.rpc('fin_import_bank_lines', { _account: account, _lines: parsed.lines as never });
    if (error) return setErr(error); const r = data as Record<string, number>;
    setMsg(`${r['inserted']} new line(s), ${r['duplicates']} already imported, ${parsed.skipped + (r['invalid'] ?? 0)} skipped, ${r['matched']} matched automatically.`); refresh();
  }
  if (accts.isPending) return <Loading />;
  if (!accts.data?.length) return <Panel title="Bank reconciliation"><Empty>Add a bank account first (Bank & cash).</Empty></Panel>;
  const tone = { unmatched: 'danger', matched: 'info', reconciled: 'success', disputed: 'warning' } as const;
  return <Panel title="Bank reconciliation" actions={<>
    <select aria-label="Account" className={`${inputCls} w-auto`} value={account} onChange={e => setAcct(e.target.value)}>{accts.data.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
    {(role.accounts || role.admin) && <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"><Upload className="size-4" />Import statement (CSV)<input type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }} /></label>}
    {lines.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('reconciliation.csv', lines.data!.map(l => ({ date: l.line_date, description: l.description, ref: l.ref, amount: l.amount, status: l.status, entry: l.fin_transactions?.ref ?? '', note: l.note })))}>Report (CSV)</Button> : null}</>}>
    <p className="mb-3 text-xs text-muted-foreground">CSV needs a Date column and Amount (or Debit / Credit). Lines are matched to entries by UTR, or by amount within 3 days. Only a matched line can be reconciled; approval alone never counts as reconciled.</p>
    {msg && <p className="mb-2 text-sm text-[var(--dash-success)]">{msg}</p>}<ErrorNote error={err} />
    {lines.isPending ? <Loading /> : !lines.data?.length ? <Empty>No statement lines yet.</Empty> :
      <Table head={['Date', 'Bank description', 'Amount', 'Status', 'Matched entry', 'Action']}>{lines.data.map(l => <tr key={l.id}>
        <Td>{shortDate(l.line_date)}</Td><Td className="max-w-xs text-xs">{l.description}{l.ref && <span className="block font-mono">{l.ref}</span>}{l.note && <span className="block text-muted-foreground">{l.note}</span>}</Td>
        <Td className={`font-semibold ${Number(l.amount) > 0 ? 'text-[var(--dash-success)]' : ''}`}>{Number(l.amount) > 0 ? '+' : '−'}{money(Math.abs(Number(l.amount)))}</Td>
        <Td><Pill tone={tone[l.status as keyof typeof tone]}>{l.status}</Pill></Td>
        <Td className="text-xs">{l.fin_transactions ? <>{l.fin_transactions.ref}<span className="block text-muted-foreground">{l.fin_transactions.party_name}</span></> : l.status !== 'reconciled' && (role.accounts || role.admin) ?
          <select aria-label="Match to entry" className={`${inputCls} h-8 text-xs`} defaultValue="" onChange={e => e.target.value && void act(l.id, 'match', e.target.value)}><option value="">Match to…</option>{(open.data ?? []).filter(t => Number(t.amount) === Math.abs(Number(l.amount)) && t.direction === (Number(l.amount) > 0 ? 'in' : 'out')).map(t => <option key={t.id} value={t.id}>{t.ref} · {shortDate(t.txn_date)} · {t.party_name}</option>)}</select> : '—'}</Td>
        <Td>{(role.accounts || role.admin) && l.status !== 'reconciled' && <div className="flex flex-wrap gap-1">
          {l.status === 'matched' && <><Button size="sm" onClick={() => void act(l.id, 'reconcile')}>Reconcile</Button><Button size="sm" variant="ghost" onClick={() => void act(l.id, 'unmatch')}>Unmatch</Button></>}
          {l.status !== 'matched' && <>{Number(l.amount) < 0 ? <Button size="sm" variant="ghost" onClick={() => void act(l.id, 'bank_charge')}>Bank charge</Button> : <><Button size="sm" variant="ghost" onClick={() => void act(l.id, 'interest')}>Interest</Button><Button size="sm" variant="ghost" onClick={() => void act(l.id, 'received')}>Receipt</Button></>}
            <Button size="sm" variant="ghost" onClick={() => { const n = window.prompt('What is wrong with this line?'); if (n) void act(l.id, 'dispute', undefined, n); }}>Dispute</Button></>}
        </div>}{l.status === 'reconciled' && <span className="text-xs text-muted-foreground">Locked</span>}</Td></tr>)}</Table>}
  </Panel>;
}

function BankAccounts({ role }: { role: Role }) {
  const qc = useQueryClient(); const q = useAccounts(); const [v, setV] = useState({ name: '', kind: 'bank', bank_name: '', account_last4: '', opening_balance: '0', opening_date: todayIST(), low_balance_alert: '0' }); const [err, setErr] = useState<unknown>(null);
  const add = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); const { error } = await supabase.from('fin_accounts').insert({ ...v, opening_balance: Number(v.opening_balance), low_balance_alert: Number(v.low_balance_alert) }); if (error) setErr(error); else { setV({ ...v, name: '', account_last4: '' }); void qc.invalidateQueries({ queryKey: ['fin-accounts'] }); } };
  const can = role.manager || role.admin;
  return <div className="grid gap-5"><Panel title="Bank & cash accounts">{q.isPending ? <Loading /> : !q.data?.length ? <Empty>No accounts yet.</Empty> :
    <Table head={['Account', 'Type', 'Book balance', 'Low-balance alert', 'Unreconciled lines', '']}>{q.data.map(a => <tr key={a.id} className={a.active ? '' : 'opacity-60'}>
      <Td className="font-medium">{a.name}<span className="block text-xs text-muted-foreground">{a.bank_name}{a.account_last4 && ` ••${a.account_last4}`}</span></Td><Td className="capitalize">{a.kind}</Td>
      <Td className={`font-semibold ${Number(a.low_balance_alert) > 0 && Number(a.balance) < Number(a.low_balance_alert) ? 'text-[var(--dash-danger)]' : ''}`}>{money(a.balance)}</Td><Td>{money(a.low_balance_alert)}</Td><Td>{a.unreconciled}</Td>
      <Td>{can && <Button size="sm" variant="ghost" onClick={async () => { await supabase.from('fin_accounts').update({ active: !a.active }).eq('id', a.id); void qc.invalidateQueries({ queryKey: ['fin-accounts'] }); }}>{a.active ? 'Close' : 'Reopen'}</Button>}</Td></tr>)}</Table>}</Panel>
    {can ? <Panel title="Add an account"><form onSubmit={e => void add(e)} className="grid gap-3 sm:grid-cols-3">
      <Field label="Name"><input required className={inputCls} value={v.name} onChange={e => setV({ ...v, name: e.target.value })} placeholder="HDFC Current" /></Field>
      <Field label="Type"><select className={inputCls} value={v.kind} onChange={e => setV({ ...v, kind: e.target.value })}><option value="bank">Bank</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="wallet">Wallet</option></select></Field>
      <Field label="Bank"><input className={inputCls} value={v.bank_name} onChange={e => setV({ ...v, bank_name: e.target.value })} /></Field>
      <Field label="Last 4 digits only"><input className={inputCls} maxLength={4} pattern="[0-9]{0,4}" value={v.account_last4} onChange={e => setV({ ...v, account_last4: e.target.value })} /></Field>
      <Field label="Opening balance (₹)"><input type="number" step="0.01" className={inputCls} value={v.opening_balance} onChange={e => setV({ ...v, opening_balance: e.target.value })} /></Field>
      <Field label="As on"><input type="date" className={inputCls} value={v.opening_date} onChange={e => setV({ ...v, opening_date: e.target.value })} /></Field>
      <Field label="Alert below (₹)"><input type="number" min="0" className={inputCls} value={v.low_balance_alert} onChange={e => setV({ ...v, low_balance_alert: e.target.value })} /></Field>
      <div className="sm:col-span-3"><ErrorNote error={err} /><Button>Add account</Button></div></form></Panel> : <p className="text-sm text-muted-foreground">Only a Finance manager or Admin can add accounts.</p>}</div>;
}

function Budgets({ role }: { role: Role }) {
  const qc = useQueryClient(); const [month, setMonth] = useState(todayIST().slice(0, 7)); const [v, setV] = useState({ department: 'All', category: '', amount: '' }); const [err, setErr] = useState<unknown>(null);
  const q = useQuery({ queryKey: ['fin-budgets', month], queryFn: async () => { const { data, error } = await supabase.rpc('fin_budget_status', { _month: `${month}-01` }); if (error) throw error; return data; } });
  const add = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); const { error } = await supabase.from('fin_budgets').upsert({ month: `${month}-01`, department: v.department || 'All', category: v.category, amount: Number(v.amount) }, { onConflict: 'month,department,category' }); if (error) setErr(error); else { setV({ ...v, category: '', amount: '' }); void qc.invalidateQueries({ queryKey: ['fin-budgets'] }); } };
  return <div className="grid gap-5"><Panel title="Budgets" actions={<input type="month" aria-label="Month" className={`${inputCls} w-auto`} value={month} onChange={e => setMonth(e.target.value)} />}>
    <p className="mb-3 text-xs text-muted-foreground">Alerts go to Finance and Accounts at 75%, 90% and 100%. Above 100%, only an Admin can approve more payments in that category.</p>
    {q.isPending ? <Loading /> : !q.data?.length ? <Empty>No budgets for this month.</Empty> : <Table head={['Department', 'Category', 'Budget', 'Spent', 'Used']}>{q.data.map(b => { const lvl = budgetAlertLevel(Number(b.spent), Number(b.amount)); return <tr key={b.id}>
      <Td>{b.department}</Td><Td>{b.category}</Td><Td>{money(b.amount)}</Td><Td>{money(b.spent)}</Td>
      <Td><div className="flex items-center gap-2"><span className="h-2 w-24 overflow-hidden rounded bg-muted"><span className="block h-full" style={{ width: `${Math.min(100, Number(b.percent))}%`, background: lvl >= 90 ? 'var(--dash-danger)' : lvl >= 75 ? 'var(--dash-warning)' : 'var(--dash-success)' }} /></span><span className="text-xs font-semibold">{Number(b.percent)}%</span></div></Td></tr>; })}</Table>}</Panel>
    {(role.finance || role.admin) && <Panel title="Set a budget"><form onSubmit={e => void add(e)} className="grid gap-3 sm:grid-cols-4">
      <Field label="Department"><input className={inputCls} value={v.department} onChange={e => setV({ ...v, department: e.target.value })} /></Field><Field label="Category"><input required className={inputCls} value={v.category} onChange={e => setV({ ...v, category: e.target.value })} /></Field>
      <Field label="Amount (₹)"><input type="number" min="1" required className={inputCls} value={v.amount} onChange={e => setV({ ...v, amount: e.target.value })} /></Field><div className="self-end"><Button>Save</Button></div>
      <div className="sm:col-span-4"><ErrorNote error={err} /></div></form></Panel>}</div>;
}

function Dues() {
  const qc = useQueryClient(); const [dir, setDir] = useState<'receivable' | 'payable'>('receivable'); const [err, setErr] = useState<unknown>(null);
  const q = useQuery({ queryKey: ['fin-dues'], queryFn: async () => { const { data, error } = await supabase.rpc('fin_dues_list'); if (error) throw error; return data; } });
  const [v, setV] = useState({ party_name: '', invoice_ref: '', amount: '', due_date: todayIST(), description: '', next_follow_up: '' });
  const add = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); const { error } = await supabase.from('fin_dues').insert({ direction: dir, party_name: v.party_name, invoice_ref: v.invoice_ref, amount: Number(v.amount), due_date: v.due_date, description: v.description, next_follow_up: v.next_follow_up || null }); if (error) setErr(error); else { setV({ ...v, party_name: '', invoice_ref: '', amount: '' }); void qc.invalidateQueries({ queryKey: ['fin-dues'] }); } };
  const setHold = async (id: string, hold: string) => { await supabase.from('fin_dues').update({ hold_status: hold }).eq('id', id); void qc.invalidateQueries({ queryKey: ['fin-dues'] }); };
  const rows = (q.data ?? []).filter(d => d.direction === dir);
  const tone = { paid: 'success', overdue: 'danger', partial: 'info', not_due: 'muted', disputed: 'warning', on_hold: 'warning' } as const;
  return <div className="grid gap-5"><Panel title="Receivables & payables" actions={<><Button size="sm" variant={dir === 'receivable' ? 'default' : 'outline'} onClick={() => setDir('receivable')}>Receivables</Button><Button size="sm" variant={dir === 'payable' ? 'default' : 'outline'} onClick={() => setDir('payable')}>Payables</Button></>}>
    <p className="mb-3 text-xs text-muted-foreground">Settled amounts come from register entries linked to each line. Invoice numbers are references to Zoho Invoice only.</p>
    {q.isPending ? <Loading /> : !rows.length ? <Empty>Nothing here yet.</Empty> : <Table head={['Party', 'Invoice ref', 'Amount', 'Settled', 'Outstanding', 'Due', 'Status', '']}>{rows.map(d => <tr key={d.id}>
      <Td className="font-medium">{d.party_name}<span className="block text-xs text-muted-foreground">{d.description}</span></Td><Td className="font-mono text-xs">{d.invoice_ref || '—'}</Td><Td>{money(d.amount)}</Td><Td>{money(d.settled)}</Td><Td className="font-semibold">{money(d.outstanding)}</Td>
      <Td>{shortDate(d.due_date)}{d.next_follow_up && <span className="block text-xs text-muted-foreground">follow up {shortDate(d.next_follow_up)}</span>}</Td><Td><Pill tone={tone[d.status as keyof typeof tone] ?? 'muted'}>{d.status.replace('_', ' ')}</Pill></Td>
      <Td><select aria-label="Hold" className={`${inputCls} h-8 w-auto text-xs`} value={d.hold_status} onChange={e => void setHold(d.id, e.target.value)}><option value="none">Normal</option><option value="disputed">Disputed</option><option value="on_hold">On hold</option></select></Td></tr>)}</Table>}</Panel>
    <Panel title={`Add ${dir}`}><form onSubmit={e => void add(e)} className="grid gap-3 sm:grid-cols-3">
      <Field label={dir === 'receivable' ? 'Customer / party' : 'Vendor / party'}><input required className={inputCls} value={v.party_name} onChange={e => setV({ ...v, party_name: e.target.value })} /></Field>
      <Field label="Invoice / bill ref"><input className={inputCls} value={v.invoice_ref} onChange={e => setV({ ...v, invoice_ref: e.target.value })} /></Field>
      <Field label="Amount (₹)"><input type="number" min="1" step="0.01" required className={inputCls} value={v.amount} onChange={e => setV({ ...v, amount: e.target.value })} /></Field>
      <Field label="Due date"><input type="date" required className={inputCls} value={v.due_date} onChange={e => setV({ ...v, due_date: e.target.value })} /></Field>
      <Field label="Next follow-up"><input type="date" className={inputCls} value={v.next_follow_up} onChange={e => setV({ ...v, next_follow_up: e.target.value })} /></Field>
      <Field label="Description"><input className={inputCls} value={v.description} onChange={e => setV({ ...v, description: e.target.value })} /></Field>
      <div className="sm:col-span-3"><ErrorNote error={err} /><Button>Add</Button></div></form></Panel></div>;
}

function Vendors() {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [v, setV] = useState({ name: '', kind: 'vendor', contact_name: '', phone: '', email: '', gstin: '', bank_last4: '', notes: '' });
  const q = useQuery({ queryKey: ['fin-vendors-all'], queryFn: async () => { const { data, error } = await supabase.from('fin_vendors').select('*').order('name'); if (error) throw error; return data; } });
  const ledger = useQuery({ queryKey: ['fin-vendor-ledger'], queryFn: async () => (await supabase.from('fin_transactions').select('party_id,direction,amount,status').not('party_id', 'is', null)).data ?? [] });
  const add = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); const { error } = await supabase.from('fin_vendors').insert(v); if (error) setErr(error); else { setV({ ...v, name: '', contact_name: '', phone: '', email: '', gstin: '', bank_last4: '' }); void qc.invalidateQueries({ queryKey: ['fin-vendors-all'] }); } };
  const total = (id: string, dir: string) => (ledger.data ?? []).filter(t => t.party_id === id && t.direction === dir && t.status !== 'void').reduce((s, t) => s + Number(t.amount), 0);
  return <div className="grid gap-5"><Panel title="Vendors & parties">{q.isPending ? <Loading /> : !q.data?.length ? <Empty>No parties yet.</Empty> :
    <Table head={['Name', 'Type', 'Contact', 'GSTIN', 'Paid to', 'Received from']}>{q.data.map(p => <tr key={p.id}><Td className="font-medium">{p.name}</Td><Td className="capitalize">{p.kind}</Td><Td className="text-xs">{p.contact_name}<span className="block">{p.phone} {p.email}</span></Td><Td className="font-mono text-xs">{p.gstin}</Td><Td>{money(total(p.id, 'out'))}</Td><Td>{money(total(p.id, 'in'))}</Td></tr>)}</Table>}</Panel>
    <Panel title="Add a party"><form onSubmit={e => void add(e)} className="grid gap-3 sm:grid-cols-4">
      <Field label="Name"><input required className={inputCls} value={v.name} onChange={e => setV({ ...v, name: e.target.value })} /></Field>
      <Field label="Type"><select className={inputCls} value={v.kind} onChange={e => setV({ ...v, kind: e.target.value })}>{['vendor', 'supplier', 'partner', 'customer', 'other'].map(k => <option key={k}>{k}</option>)}</select></Field>
      <Field label="Contact person"><input className={inputCls} value={v.contact_name} onChange={e => setV({ ...v, contact_name: e.target.value })} /></Field><Field label="Phone"><input className={inputCls} value={v.phone} onChange={e => setV({ ...v, phone: e.target.value })} /></Field>
      <Field label="Email"><input className={inputCls} value={v.email} onChange={e => setV({ ...v, email: e.target.value })} /></Field><Field label="GSTIN"><input className={inputCls} value={v.gstin} onChange={e => setV({ ...v, gstin: e.target.value })} /></Field>
      <Field label="Bank last 4 digits"><input className={inputCls} maxLength={4} pattern="[0-9]{0,4}" value={v.bank_last4} onChange={e => setV({ ...v, bank_last4: e.target.value })} /></Field>
      <div className="self-end"><Button>Add</Button></div><div className="sm:col-span-4"><ErrorNote error={err} /></div></form></Panel></div>;
}

function ZohoInvoices() {
  const q = useQuery({ queryKey: ['zoho-invoices'], queryFn: async () => { const { data, error } = await supabase.from('zoho_invoices').select('*').order('invoice_date', { ascending: false }).limit(1000); if (error) throw error; return data; } });
  return <Panel title="Zoho Invoice (read-only)">
    <p className="mb-3 text-sm text-muted-foreground">Invoices and payment status come from Zoho Invoice. GST and invoice creation stay in Zoho; nothing can be created or edited here. The connection is managed by the Admin only.</p>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No invoices synced yet. Ask the Admin to connect Zoho Invoice in Admin → Integrations.</Empty> :
      <Table head={['Invoice', 'Customer', 'Date', 'Due', 'Total', 'Balance', 'Status']}>{q.data!.map(i => <tr key={i.zoho_id}><Td className="font-mono text-xs">{i.invoice_number}</Td><Td>{i.customer_name}</Td><Td>{shortDate(i.invoice_date)}</Td><Td>{shortDate(i.due_date)}</Td><Td>{money(i.total)}</Td><Td className="font-semibold">{money(i.balance)}</Td><Td><Pill tone={i.status === 'paid' ? 'success' : i.status === 'overdue' ? 'danger' : 'muted'}>{i.status}</Pill></Td></tr>)}</Table>}
  </Panel>;
}

function Reports() {
  const [month, setMonth] = useState(todayIST().slice(0, 7));
  const q = useQuery({ queryKey: ['fin-report', month], queryFn: async () => {
    const start = `${month}-01`; const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
    const { data, error } = await supabase.from('fin_transactions').select('ref,txn_date,direction,type,category,department,amount,mode,utr,party_name,status').gte('txn_date', start).lte('txn_date', end).neq('status', 'void').order('txn_date');
    if (error) throw error; return data;
  } });
  const rows = q.data ?? []; const sum = (d: string) => rows.filter(r => r.direction === d).reduce((s, r) => s + Number(r.amount), 0);
  const byCat = Object.entries(rows.filter(r => r.direction === 'out').reduce<Record<string, number>>((a, r) => ({ ...a, [r.category]: (a[r.category] ?? 0) + Number(r.amount) }), {})).sort((a, b) => b[1] - a[1]);
  const byDept = Object.entries(rows.filter(r => r.direction === 'out').reduce<Record<string, number>>((a, r) => ({ ...a, [r.department]: (a[r.department] ?? 0) + Number(r.amount) }), {})).sort((a, b) => b[1] - a[1]);
  return <div className="grid gap-5"><Panel title="Monthly MIS" actions={<><input type="month" aria-label="Month" className={`${inputCls} w-auto`} value={month} onChange={e => setMonth(e.target.value)} />{rows.length > 0 && <Button size="sm" variant="outline" onClick={() => downloadCsv(`mis-${month}.csv`, rows)}>Download entries (CSV)</Button>}</>}>
    {q.isPending ? <Loading /> : <div className="grid gap-3 sm:grid-cols-3"><KpiCard label="Money in" value={money(sum('in'))} tone="success" /><KpiCard label="Money out" value={money(sum('out'))} tone="warning" /><KpiCard label="Net" value={money(sum('in') - sum('out'))} tone={sum('in') >= sum('out') ? 'success' : 'danger'} /></div>}</Panel>
    <div className="grid gap-5 lg:grid-cols-2"><Panel title="Expense by category">{!byCat.length ? <Empty>No spending.</Empty> : <Table head={['Category', 'Amount']}>{byCat.map(([k, v]) => <tr key={k}><Td>{k}</Td><Td>{money(v)}</Td></tr>)}</Table>}</Panel>
      <Panel title="Expense by department">{!byDept.length ? <Empty>No spending.</Empty> : <Table head={['Department', 'Amount']}>{byDept.map(([k, v]) => <tr key={k}><Td>{k}</Td><Td>{money(v)}</Td></tr>)}</Table>}</Panel></div></div>;
}

const collectionModes: Record<string, string> = { upi: 'UPI', bank_transfer: 'Bank transfer', cash: 'Cash', cheque: 'Cheque', card: 'Card', gateway: 'Payment gateway', other: 'Other' };
/** Accounts / Finance check every BDE/BDM collection against the bank; only verified money counts as collected. */
function SalesCollections({ uid }: { uid: string }) {
  const qc = useQueryClient(); const list = useServerFn(listSalesCollections); const verify = useServerFn(verifyCrmCollection);
  const [err, setErr] = useState<unknown>(null); const [filter, setFilter] = useState<'unverified' | 'all'>('unverified'); const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['sales-collections'], queryFn: () => list() });
  const who = (id: string | null) => !id ? '—' : id === uid ? 'You' : q.data?.people.find(p => p.id === id)?.name ?? 'Employee';
  const act = async (id: string, approve: boolean) => {
    const note = approve ? '' : window.prompt('Reason for rejecting (e.g. not found in bank statement)') ?? ''; if (!approve && !note.trim()) return;
    setErr(null); setBusy(true);
    try { await verify({ data: { id, approve, note } }); void qc.invalidateQueries({ queryKey: ['sales-collections'] }); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const rows = (q.data?.rows ?? []).filter(r => filter === 'all' || r.status === 'unverified');
  const today = todayIST(); const t = collectionTotals(q.data?.rows ?? [], null, today); const m = collectionTotals(q.data?.rows ?? [], null, undefined, today.slice(0, 7));
  return <div className="grid gap-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Today's verified collection" value={money(t.verified)} note="Counted as collected" icon={CheckCircle2} tone="success" />
      <KpiCard label="Today's unverified collection" value={money(t.unverified)} note="Check against the bank" icon={AlertTriangle} tone="warning" />
      <KpiCard label="Collected this month" value={money(m.verified)} note="Verified only" />
      <KpiCard label="Waiting for verification" value={(q.data?.rows ?? []).filter(r => r.status === 'unverified').length} note={money((q.data?.rows ?? []).filter(r => r.status === 'unverified').reduce((n, r) => n + Number(r.amount), 0))} />
    </div>
    <Panel title="Sales collections" actions={<select aria-label="Show" className={`${inputCls} w-auto`} value={filter} onChange={e => setFilter(e.target.value as 'all')}><option value="unverified">Waiting for verification</option><option value="all">All collections</option></select>}>
      <p className="mb-3 text-sm text-muted-foreground">BDE/BDM record money they received. Match the UTR / reference with the bank statement, then verify or reject. You cannot verify an entry you recorded or are credited for.</p><ErrorNote error={err} />
      {q.isPending ? <Loading /> : !rows.length ? <Empty>{filter === 'unverified' ? 'Nothing waiting for verification.' : 'No collections yet.'}</Empty> : <Table head={['Collection', 'Date', 'Employee', 'Amount', 'Mode / reference', 'Status', '']}>{rows.map(r => <tr key={r.id}>
        <Td className="font-mono text-xs">{r.code}<span className="block font-sans text-[11px] text-muted-foreground">by {who(r.recorded_by)}</span></Td><Td>{shortDate(r.collected_on)}</Td><Td>{who(r.owner_id)}</Td><Td className="font-semibold tabular-nums">{money(Number(r.amount))}</Td>
        <Td>{collectionModes[r.mode] ?? r.mode}<span className="block text-xs text-muted-foreground">{r.reference ?? '—'}{r.payer_name ? ` · ${r.payer_name}` : ''}</span>{r.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}</Td>
        <Td><Pill tone={r.status === 'verified' ? 'success' : r.status === 'rejected' ? 'muted' : 'warning'}>{r.status}</Pill>{r.verified_by && <span className="block text-xs text-muted-foreground">{who(r.verified_by)}{r.verify_note ? ` · ${r.verify_note}` : ''}</span>}</Td>
        <Td>{r.status === 'unverified' && r.recorded_by !== uid && r.owner_id !== uid && <div className="flex flex-wrap gap-1"><Button size="sm" disabled={busy} onClick={() => void act(r.id, true)}>Verify</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void act(r.id, false)}>Reject</Button></div>}</Td>
      </tr>)}</Table>}
    </Panel>
  </div>;
}
