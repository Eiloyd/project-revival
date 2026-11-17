import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { areaCls, ErrorNote, Field, inputCls, Panel, Pill } from '@/components/work/common';
import { triageTicket } from '@/lib/support/ticket-triage.functions';
import type { TriageResult } from '@/lib/support/ticket-triage';

export function TicketAiAssistant({ subject = '', description = '', onApply, onReply }: {
  subject?: string; description?: string; onApply?: (result: TriageResult) => Promise<void>; onReply?: (reply: string) => void;
}) {
  const run = useServerFn(triageTicket);
  const [text, setText] = useState(description); const [heading, setHeading] = useState(subject);
  const [tone, setTone] = useState<'friendly' | 'formal'>('friendly'); const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null); const [reply, setReply] = useState('');
  async function analyse() {
    setBusy(true); setError(null); setResult(null); setNotice('');
    try { const response = await run({ data: { subject: heading, description: text, tone, language } });
      if (!response.result) throw new Error(response.error ?? 'No AI answer.');
      setResult(response.result); setReply(`Subject: ${response.result.replySubject}\n\n${response.result.replyBody}`);
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function action(fn: () => Promise<void>) { setBusy(true); setError(null); try { await fn(); } catch (e) { setError(e); } finally { setBusy(false); } }
  return <Panel title="AI ticket helper"><div className="grid gap-4">
    <p className="text-sm text-muted-foreground">Only the subject and description below are sent. Remove names, email addresses, phone numbers and sensitive details embedded in the text. Suggestions are drafts, not policy or refund approval.</p>
    <Field label="Subject (optional)"><input className={inputCls} value={heading} maxLength={200} onChange={e => setHeading(e.target.value)} /></Field>
    <Field label="Ticket description"><textarea className={areaCls} minLength={10} maxLength={4000} value={text} onChange={e => setText(e.target.value)} /></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Tone"><select className={inputCls} value={tone} onChange={e => setTone(e.target.value as typeof tone)}><option value="friendly">Friendly</option><option value="formal">Formal</option></select></Field>
      <Field label="Language"><select className={inputCls} value={language} onChange={e => setLanguage(e.target.value as typeof language)}><option>English</option><option>Hindi</option></select></Field></div>
    <Button disabled={busy || text.trim().length < 10} onClick={() => void analyse()}><Sparkles className="size-4" />{busy ? 'Working…' : 'AI suggest'}</Button>
    <ErrorNote error={error} />
    {result && <div className="grid gap-3" aria-live="polite"><div className="flex flex-wrap gap-2"><Pill>{result.category}</Pill><Pill>{result.priority}</Pill><Pill>{result.requestType}</Pill></div>
      <p className="text-sm"><b>Reason:</b> {result.reason}</p><p className="text-sm"><b>Summary:</b> {result.summary}</p><p className="text-sm"><b>Next step:</b> {result.suggestedNextStep}</p>
      <Field label="Reply draft — review before using"><textarea className={`${areaCls} min-h-48`} value={reply} onChange={e => setReply(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">{onApply && <Button disabled={busy} onClick={() => void action(async () => { await onApply(result); setNotice('Category, priority and request type applied.'); })}>Apply classification</Button>}
        {onReply && <Button variant="outline" onClick={() => { onReply(reply); setNotice('Draft placed in resolution box. Save the note to keep it.'); }}>Use reply in resolution</Button>}
        <Button variant="outline" disabled={busy} onClick={() => void action(async () => { await navigator.clipboard.writeText(reply); setNotice('Reply copied.'); })}><Copy className="size-4" />Copy reply</Button></div>
    </div>}{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </div></Panel>;
}
