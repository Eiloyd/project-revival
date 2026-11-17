import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Copy, Lightbulb, MessageCircle, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { ErrorNote, Field, Panel, Pill, areaCls, inputCls } from '../work/common';
import { crmAction, moveCrmLead, type getCrm } from '@/lib/crm.functions';
import { stageLabels } from '@/lib/crm/rules';
import { suggestCallFollowUp } from '@/lib/crm/call-coach.functions';
import { activityBody, channelLabels, followUpDate, followUpPriority, type CallCoachResult } from '@/lib/crm/call-coach';

type Data = Awaited<ReturnType<typeof getCrm>>;
const interestTone = { hot: 'success', warm: 'warning', cold: 'muted' } as const;

/** BDE writes what happened on a call or meeting; the AI suggests the next step and a follow-up message, which the BDE edits and saves to the lead. */
export function CallCoachPanel({ d, initialLeadId }: { d: Data; initialLeadId?: string | null }) {
  const suggest = useServerFn(suggestCallFollowUp), action = useServerFn(crmAction), move = useServerFn(moveCrmLead); const qc = useQueryClient();
  const myLeads = d.leads.filter(l => (d.role === 'BDE' || d.role === 'sales' ? l.owner_id === d.userId : true) && !['won', 'lost'].includes(l.stage));
  const [leadId, setLeadId] = useState(initialLeadId ?? ''); const [kind, setKind] = useState<'call' | 'meeting'>('call');
  const [notes, setNotes] = useState(''); const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  const [r, setR] = useState<CallCoachResult | null>(null); const [step, setStep] = useState(''); const [message, setMessage] = useState(''); const [due, setDue] = useState(''); const [moveStage, setMoveStage] = useState(false);
  const lead = d.leads.find(l => l.id === leadId); const customer = lead ? d.customers.find(c => c.id === lead.customer_id) : null;
  const phone = (customer?.phone ?? '').replace(/\D/g, ''); const waPhone = phone.length === 10 ? `91${phone}` : phone;

  async function generate(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setNotice(''); setR(null);
    try {
      const res = await suggest({ data: { ...(leadId ? { leadId } : {}), kind, notes, language } });
      if (res.error || !res.result) setError(new Error(res.error ?? 'No suggestion came back.'));
      else { setR(res.result); setStep(res.result.nextStep); setMessage(res.result.followUpMessage); setDue(followUpDate(d.today, res.result.followUpInDays)); setMoveStage(lead ? res.result.suggestedStage !== lead.stage : false); }
    } catch (err) { setError(err); } finally { setBusy(false); }
  }
  async function save() {
    if (!r || !lead) return; setBusy(true); setError(null); setNotice('');
    try {
      await action({ data: { kind: 'activity', data: { leadId: lead.id, kind, body: activityBody(notes, { summary: r.summary, nextStep: step }) } } });
      if (due) await action({ data: { kind: 'task', data: { title: `${lead.title}: ${step}`.slice(0, 200), ownerId: lead.owner_id ?? d.userId, dueDate: due, priority: followUpPriority(r.interest) } } });
      if (moveStage && r.suggestedStage !== lead.stage) await move({ data: { id: lead.id, stage: r.suggestedStage } });
      await qc.invalidateQueries({ queryKey: ['crm'] });
      setNotice(`Saved to "${lead.title}": ${kind} logged${due ? `, follow-up task on ${due}` : ''}${moveStage && r.suggestedStage !== lead.stage ? `, moved to ${stageLabels[r.suggestedStage]}` : ''}.`);
      setNotes(''); setR(null);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }
  return <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <Panel title="Call / meeting notes">
      <form onSubmit={e => void generate(e)} className="grid gap-3">
        <Field label="Lead (optional, but needed to save)"><select className={inputCls} value={leadId} onChange={e => { setLeadId(e.target.value); setR(null); }}><option value="">No lead — just suggest</option>{myLeads.map(l => <option key={l.id} value={l.id}>{l.title} · {d.customers.find(c => c.id === l.customer_id)?.full_name ?? 'Customer'} · {stageLabels[l.stage as keyof typeof stageLabels] ?? l.stage}</option>)}</select></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Conversation"><select className={inputCls} value={kind} onChange={e => setKind(e.target.value as 'call' | 'meeting')}><option value="call">Phone call</option><option value="meeting">Meeting</option></select></Field>
          <Field label="Message language"><select className={inputCls} value={language} onChange={e => setLanguage(e.target.value as typeof language)}><option>English</option><option>Hindi</option><option>Hinglish</option></select></Field>
        </div>
        <Field label="What happened?"><textarea aria-label="Call notes" className={`${areaCls} min-h-40`} value={notes} maxLength={4000} required onChange={e => setNotes(e.target.value)} placeholder="e.g. Spoke to Ravi, founder of an agri-tech startup. Wants seed funding, asked about the jury process and fees. Will share pitch deck by Thursday. Prefers WhatsApp." /></Field>
        <p className="text-xs text-muted-foreground">Your notes, the lead's title, stage, value and last 5 activities go to the AI. Phone numbers and email addresses of the customer are not sent.</p>
        <Button type="submit" disabled={busy || notes.trim().length < 15}><Lightbulb className="size-4" />{busy && !r ? 'Thinking…' : 'Suggest next step'}</Button>
      </form>
      <div className="mt-2"><ErrorNote error={error} />{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}</div>
    </Panel>
    <Panel title="AI suggestion">
      {!r ? <p className="py-6 text-sm text-muted-foreground">Write your notes and press "Suggest next step". You can edit everything before saving.</p> : <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2"><Pill tone={interestTone[r.interest]}>{r.interest === 'hot' ? 'Hot lead' : r.interest === 'warm' ? 'Warm lead' : 'Cold lead'}</Pill><Pill tone="info">Follow up by {channelLabels[r.followUpChannel]}</Pill></div>
        <p className="text-sm">{r.summary}</p>
        <Field label="Next step"><input aria-label="Next step" className={inputCls} value={step} maxLength={180} onChange={e => setStep(e.target.value)} /></Field>
        <Field label="Follow-up date"><input aria-label="Follow-up date" type="date" className={inputCls} value={due} min={d.today} onChange={e => setDue(e.target.value)} /></Field>
        <Field label={`Follow-up message (${channelLabels[r.followUpChannel]})`}><textarea aria-label="Follow-up message" className={`${areaCls} min-h-36`} value={message} onChange={e => setMessage(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(message).then(() => setNotice('Message copied.'))}><Copy className="size-3.5" />Copy message</Button>
          {waPhone.length >= 10 && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" />Open in WhatsApp</a></Button>}
        </div>
        {lead && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={moveStage} disabled={r.suggestedStage === lead.stage} onChange={e => setMoveStage(e.target.checked)} /><span>{r.suggestedStage === lead.stage ? `Stage stays ${stageLabels[r.suggestedStage]}` : `Move lead from ${stageLabels[lead.stage as keyof typeof stageLabels] ?? lead.stage} to ${stageLabels[r.suggestedStage]}`}<span className="block text-xs text-muted-foreground">{r.stageReason}</span></span></label>}
        {lead ? <Button type="button" disabled={busy || !step.trim()} onClick={() => void save()}><Save className="size-4" />{busy ? 'Saving…' : 'Save to lead + create follow-up'}</Button> : <p className="text-xs text-muted-foreground">Choose a lead above to save this as an activity and follow-up task.</p>}
      </div>}
    </Panel>
  </div>;
}
