import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { leadSchema,memberSchema,taskSchema,ticketSchema,targetSchema,stages } from './crm/rules';
import { incentivePlanSchema } from './crm/incentives';

export const getCrm = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  setResponseHeader('Cache-Control','no-store');
  const {data:role,error}=await context.supabase.rpc('crm_role');
  if(error||!role) throw new Error('Your account needs active CRM access. Ask your administrator.');
  const results=await Promise.all([
    context.supabase.from('crm_memberships').select('*'),
    context.supabase.from('crm_employee_profiles').select('*'),
    context.supabase.from('crm_customers').select('*').order('created_at',{ascending:false}).limit(1000),
    context.supabase.from('crm_leads').select('*').order('created_at',{ascending:false}).limit(1000),
    context.supabase.from('crm_tasks').select('*').order('due_date').limit(1000),
    context.supabase.from('crm_tickets').select('*').order('created_at',{ascending:false}).limit(1000),
  ]);
  const [members,profiles,customers,leads,tasks,tickets]=results;
  const since=new Date(Date.now()-400*864e5).toISOString().slice(0,10);
  const [activities,targets,collections,plans]=await Promise.all([context.supabase.from('crm_activities').select('*').order('created_at',{ascending:false}).limit(1000),context.supabase.from('crm_targets').select('*').order('month',{ascending:false}).limit(1000),
    context.supabase.from('crm_collections').select('*').gte('collected_on',since).order('created_at',{ascending:false}).limit(3000),context.supabase.from('crm_incentive_plans').select('*')]);
  if(results.some(r=>r.error)||activities.error||targets.error) throw new Error('CRM records could not be loaded.');
  const ist=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
  const [reports,coaching,assignments,documents,attendance,refunds]=await Promise.all([
    context.supabase.from('crm_daily_reports').select('*').gte('report_date',new Date(Date.now()-62*864e5).toISOString().slice(0,10)).order('report_date',{ascending:false}).limit(2000),
    context.supabase.from('crm_coaching_notes').select('*').order('session_date',{ascending:false}).limit(500),
    context.supabase.from('crm_lead_assignments').select('*').order('created_at',{ascending:false}).limit(500),
    context.supabase.from('crm_documents').select('*').order('created_at',{ascending:false}).limit(1000),
    context.supabase.from('attendance_records').select('user_id,day,status,check_in,check_out').gte('day',ist.slice(0,8)+'01').limit(3000),
    context.supabase.from('requests').select('id,code,title,status,amount,details,created_at,applicant_id,resolution').eq('type','customer_refund').order('created_at',{ascending:false}).limit(300),
  ]);
  // Pay rules from database/update-2026-11-17-sales-pay-volunteer-rewards.sql. That file is applied by the
  // owner to their own database, so these may not exist yet: an untyped client is used (the generated types
  // do not know them) and any failure is reported as "not set up" (null) instead of breaking the workspace.
  const db = context.supabase as unknown as SupabaseClient;
  const [payRow, volRev, wage] = await Promise.all([
    db.from('crm_pay_settings').select('collection_attendance,min_daily_collection,work_start,zero_cutoff,nudge_every_minutes').eq('id', true).maybeSingle(),
    db.rpc('crm_volunteer_revenue', { _since: since }),
    db.rpc('crm_my_daily_wage'),
  ]);
  return {role,userId:context.userId,today:ist,members:members?.data??[],profiles:profiles?.data??[],customers:customers?.data??[],leads:leads?.data??[],tasks:tasks?.data??[],tickets:tickets?.data??[],activities:activities.data??[],targets:targets.data??[],collections:collections.data??[],plans:plans.data??[],
    reports:reports.data??[],coaching:coaching.data??[],assignments:assignments.data??[],documents:documents.data??[],attendance:attendance.data??[],refunds:refunds.data??[],
    paySettings:payRow.error?null:(payRow.data??null),volunteerRevenue:volRev.error?null:(volRev.data??[]),dailyWage:wage.error?null:(wage.data??null)};
});
export const createCrmLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>leadSchema.parse(v)).handler(async({context,data})=>{
  const {data:role}=await context.supabase.rpc('crm_role'); if(!role||role==='support') throw new Error('Sales access required.');
  const {data:row,error}=await context.supabase.rpc('crm_create_lead',{_input:data});
  if(error) throw new Error('Lead could not be created. Check the assigned employee.'); return row;
});
export const moveCrmLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid(),stage:z.enum(stages)}).parse(v)).handler(async({context,data})=>{
  const {data:row,error}=await context.supabase.from('crm_leads').update({stage:data.stage}).eq('id',data.id).select('id').single();
  if(error||!row) throw new Error('Stage change denied or could not be saved.'); return {ok:true};
});
export const saveCrmMember=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>memberSchema.parse(v)).handler(async({context,data})=>{
  const {data:admin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(!admin) throw new Error('Admin access required.');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  let userId:string|undefined;
  for(let page=1;page<=100;page++){const {data:users,error}=await supabaseAdmin.auth.admin.listUsers({page,perPage:100}); if(error) throw new Error('Account lookup failed.'); const u=users.users.find(u=>u.email?.toLowerCase()===data.email.toLowerCase()); if(u){if(!u.email_confirmed_at)throw new Error('Employee must verify their email first.');userId=u.id;break;}if(users.users.length<100)break;}
  if(!userId) throw new Error('Employee must create and verify their account before onboarding.');
  const {error}=await context.supabase.rpc('crm_onboard_member',{_user_id:userId,_input:data}); if(error) throw new Error('Employee could not be saved. Check employee code and manager.'); return {ok:true};
});
const actionSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('task'),data:taskSchema}),
 z.object({kind:z.literal('task_status'),data:z.object({id:z.string().uuid(),status:z.enum(['open','done'])})}),
 z.object({kind:z.literal('ticket'),data:ticketSchema}),
 z.object({kind:z.literal('ticket_status'),data:z.object({id:z.string().uuid(),status:z.enum(['open','in_progress','resolved'])})}),
 z.object({kind:z.literal('target'),data:targetSchema}),
 z.object({kind:z.literal('activity'),data:z.object({leadId:z.string().uuid().optional(),ticketId:z.string().uuid().optional(),kind:z.enum(['note','call','email','meeting']),body:z.string().trim().min(1).max(3000)}).refine(v=>Boolean(v.leadId)!==Boolean(v.ticketId),'Select one lead or ticket')}),
]);
export const crmAction=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>actionSchema.parse(v)).handler(async({context,data:action})=>{
 let error;
 if(action.kind==='task'){const d=action.data;({error}=await context.supabase.from('crm_tasks').insert({title:d.title,owner_id:d.ownerId,due_date:d.dueDate,priority:d.priority}));}
 else if(action.kind==='task_status'){({error}=await context.supabase.from('crm_tasks').update({status:action.data.status}).eq('id',action.data.id).select('id').single());}
 else if(action.kind==='ticket'){const d=action.data;({error}=await context.supabase.from('crm_tickets').insert({customer_id:d.customerId,owner_id:d.ownerId,subject:d.subject,description:d.description,priority:d.priority}));}
 else if(action.kind==='ticket_status'){({error}=await context.supabase.from('crm_tickets').update({status:action.data.status}).eq('id',action.data.id).select('id').single());}
 else if(action.kind==='target'){const d=action.data;const r=await context.supabase.rpc('target_set',{_owner:d.ownerId,_month:d.month.slice(0,7)+'-01',_revenue:d.revenue,_wins:d.wins,_calls:d.calls,_reason:d.reason});if(r.error)throw new Error(r.error.message||'Target could not be saved.');}
 else {const d=action.data;const result=d.leadId?await context.supabase.from('crm_leads').select('owner_id').eq('id',d.leadId).single():await context.supabase.from('crm_tickets').select('owner_id').eq('id',d.ticketId??'').single();if(!result.data)throw new Error('Record access denied.');({error}=await context.supabase.from('crm_activities').insert({owner_id:result.data.owner_id??context.userId,actor_id:context.userId,lead_id:d.leadId??null,ticket_id:d.ticketId??null,kind:d.kind,body:d.body}));}
 if(error)throw new Error('Change denied or could not be saved.');return {ok:true};
});
export const crmCustomerLookup=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({reference:z.string().trim().min(6).max(60)}).parse(v)).handler(async({context,data})=>{
 const {data:role}=await context.supabase.rpc('crm_role');if(!role)throw new Error('Active CRM access required.');
 const {data:rows,error}=await context.supabase.rpc('crm_customer_lookup',{_reference:data.reference}); if(error)throw new Error('Customer lookup unavailable.'); return rows;
});
export const assignCrmLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({leadId:z.string().uuid(),ownerId:z.string().uuid().nullable()}).parse(v)).handler(async({context,data})=>{
 const {data:role}=await context.supabase.rpc('crm_role');if(role!=='admin'&&role!=='BDM')throw new Error('Only an admin or BDM can reassign leads.');
 const {error}=await context.supabase.rpc('crm_assign_lead',{_lead:data.leadId,_owner:data.ownerId as string});if(error)throw new Error('Lead could not be reassigned. Check that the employee is active and in your team.');return {ok:true};
});

// Acknowledgement details for one Education Support lead. Lead visibility is checked with the caller's own access first;
// only then are the PDF fields (no contact, bank or Aadhaar data) read from the registration.
export const crmAcknowledgement=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({leadId:z.string().uuid()}).parse(v)).handler(async({context,data})=>{
 setResponseHeader('Cache-Control','no-store');
 const {data:role}=await context.supabase.rpc('crm_role');if(!role)throw new Error('Active CRM access required.');
 const {data:lead}=await context.supabase.from('crm_leads').select('source,source_id').eq('id',data.leadId).maybeSingle();
 if(!lead)throw new Error('Lead access denied.');
 if(lead.source!=='education'||!lead.source_id)throw new Error('This lead has no scholarship acknowledgement.');
 const {ackSourceColumns,ackDataFromRow}=await import('./education-support/acknowledgement');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:row,error}=await supabaseAdmin.from('education_support_registrations').select(ackSourceColumns).eq('id',lead.source_id).maybeSingle();
 if(error||!row)throw new Error('Registration could not be found.');
 const r=row as unknown as import('./education-support/acknowledgement').AckSourceRow;
 if(!/^\d{15}$/.test(r.ack_number))throw new Error('Acknowledgement number is issued after the payment ID.');
 return ackDataFromRow(r);
});

const paySettingsSchema=z.object({collection_attendance:z.boolean(),min_daily_collection:z.number().int().min(1).max(1000000),work_start:z.string().regex(/^\d{2}:\d{2}$/),zero_cutoff:z.string().regex(/^\d{2}:\d{2}$/),nudge_every_minutes:z.number().int().min(5).max(120)});
/** Admin-only pay rules (collection-linked attendance, daily-wage cut-off times). The database re-checks the caller. */
export const savePaySettings=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>paySettingsSchema.parse(v)).handler(async({context,data})=>{
 const {data:admin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(!admin) throw new Error('Admin access required.');
 const db=context.supabase as unknown as SupabaseClient;
 const {error}=await db.from('crm_pay_settings').update(data).eq('id',true);
 if(error) throw new Error(/does not exist|Could not find the table/i.test(error.message)?'Pay settings are not set up in the database yet. Run database/update-2026-11-17-sales-pay-volunteer-rewards.sql once.':'Pay settings could not be saved.');
 return {ok:true};
});

const collectionSchema=z.object({leadId:z.string().uuid().nullable(),ownerId:z.string().uuid().nullable(),amount:z.number().positive().max(1e8),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),mode:z.enum(['upi','bank_transfer','cash','cheque','card','gateway','other']),reference:z.string().trim().max(80),payer:z.string().trim().max(120),note:z.string().trim().max(500)});
/** Records money received from a customer as Unverified; Accounts/Finance (or an admin) verifies it. */
export const recordCrmCollection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>collectionSchema.parse(v)).handler(async({context,data})=>{
 const {data:code,error}=await context.supabase.rpc('crm_record_collection',{_lead:data.leadId as string,_owner:data.ownerId as string,_amount:data.amount,_date:data.date,_mode:data.mode,_reference:data.reference,_payer:data.payer,_note:data.note});
 if(error) throw new Error(error.message||'Collection could not be saved.'); return {code};
});
export const verifyCrmCollection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid(),approve:z.boolean(),note:z.string().trim().max(300)}).parse(v)).handler(async({context,data})=>{
 const {data:result,error}=await context.supabase.rpc('crm_verify_collection',{_id:data.id,_approve:data.approve,_note:data.note});
 if(error) throw new Error(error.message||'Collection could not be updated.'); return {result};
});
/** Accounts/Finance view of sales collections (RLS limits rows to finance staff, admins and the owning sales team). */
export const listSalesCollections=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','no-store');
 const {data:rows,error}=await context.supabase.from('crm_collections').select('*').order('created_at',{ascending:false}).limit(500);
 if(error) throw new Error('Collections could not be loaded.');
 const ids=Array.from(new Set((rows??[]).flatMap(r=>[r.owner_id,r.recorded_by,r.verified_by]).filter(Boolean))) as string[];
 const people=await Promise.all(ids.slice(0,80).map(async id=>{const {data:n}=await context.supabase.rpc('person_name',{_uid:id} as never);return {id,name:typeof n==='string'?n:'Employee'};}));
 return {rows:rows??[],people};
});
/** Admin proposes a BDE/BDM incentive plan; a second admin approves it (critical change). */
export const proposeIncentivePlan=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>incentivePlanSchema.parse(v)).handler(async({context,data})=>{
 const {data:admin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(!admin) throw new Error('Admin access required.');
 const slabs=[...data.slabs].sort((a,b)=>a.min-b.min);
 const summary=`${data.role} incentive plan: ${data.active?'on':'off'} · ${slabs.map(s=>`${s.min}%+ → ${s.rate}%${s.bonus?` + ₹${s.bonus}`:''}`).join(', ')||'no slabs'}`;
 const {data:code,error}=await context.supabase.rpc('critical_change_propose',{_kind:'incentive_plan',_target:data.role,_payload:{slabs,active:data.active},_summary:summary.slice(0,300)});
 if(error) throw new Error(error.message||'Change could not be proposed.'); return {code};
});
