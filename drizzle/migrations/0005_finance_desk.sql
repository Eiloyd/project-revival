CREATE OR REPLACE FUNCTION public.fin_access(_scope text DEFAULT 'read') RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF public.has_role(auth.uid(), 'admin') THEN RETURN true; END IF;
 RETURN EXISTS (SELECT 1 FROM public.department_staff d WHERE d.user_id=auth.uid() AND d.active AND
 CASE _scope WHEN 'accounts' THEN d.department='accounts' WHEN 'finance' THEN d.department='finance'
 WHEN 'manager' THEN d.department IN ('accounts','finance') AND d.level='manager'
 ELSE d.department IN ('accounts','finance') END);
END $$;
REVOKE ALL ON FUNCTION public.fin_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_access(text) TO authenticated, service_role;
CREATE SEQUENCE IF NOT EXISTS public.fin_ref_seq;
CREATE SEQUENCE IF NOT EXISTS public.crm_collection_ref_seq;

CREATE TABLE IF NOT EXISTS public.fin_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, kind text NOT NULL DEFAULT 'bank' CHECK(kind IN ('bank','cash','upi','wallet')), bank_name text NOT NULL DEFAULT '', account_last4 text NOT NULL DEFAULT '' CHECK(account_last4 ~ '^[0-9]{0,4}$'), opening_balance numeric(18,2) NOT NULL DEFAULT 0, opening_date date NOT NULL DEFAULT current_date, low_balance_alert numeric(18,2) NOT NULL DEFAULT 0 CHECK(low_balance_alert>=0), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_accounts TO authenticated, service_role;
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_accounts;
CREATE POLICY finance_read ON public.fin_accounts FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_accounts;
CREATE POLICY finance_insert ON public.fin_accounts FOR INSERT TO authenticated WITH CHECK(public.fin_access('manager'));
DROP POLICY IF EXISTS finance_update ON public.fin_accounts;
CREATE POLICY finance_update ON public.fin_accounts FOR UPDATE TO authenticated USING(public.fin_access('manager')) WITH CHECK(public.fin_access('manager'));

CREATE TABLE IF NOT EXISTS public.fin_vendors (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, kind text NOT NULL DEFAULT 'vendor', contact_name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', gstin text NOT NULL DEFAULT '', bank_last4 text NOT NULL DEFAULT '' CHECK(bank_last4 ~ '^[0-9]{0,4}$'), notes text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_vendors TO authenticated, service_role;
ALTER TABLE public.fin_vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_vendors;
CREATE POLICY finance_read ON public.fin_vendors FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_vendors;
CREATE POLICY finance_insert ON public.fin_vendors FOR INSERT TO authenticated WITH CHECK(public.fin_access('read'));
DROP POLICY IF EXISTS finance_update ON public.fin_vendors;
CREATE POLICY finance_update ON public.fin_vendors FOR UPDATE TO authenticated USING(public.fin_access('read')) WITH CHECK(public.fin_access('read'));

CREATE TABLE IF NOT EXISTS public.fin_budgets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), month date NOT NULL CHECK(extract(day from month)=1), department text NOT NULL DEFAULT 'All', category text NOT NULL, amount numeric(18,2) NOT NULL CHECK(amount>0), created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid(), UNIQUE(month,department,category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_budgets TO authenticated, service_role;
ALTER TABLE public.fin_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_budgets;
CREATE POLICY finance_read ON public.fin_budgets FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_budgets;
CREATE POLICY finance_insert ON public.fin_budgets FOR INSERT TO authenticated WITH CHECK(public.fin_access('finance'));
DROP POLICY IF EXISTS finance_update ON public.fin_budgets;
CREATE POLICY finance_update ON public.fin_budgets FOR UPDATE TO authenticated USING(public.fin_access('finance')) WITH CHECK(public.fin_access('finance'));

CREATE TABLE IF NOT EXISTS public.fin_dues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), direction text NOT NULL CHECK(direction IN ('receivable','payable')), party_id uuid REFERENCES public.fin_vendors(id), party_name text NOT NULL DEFAULT '', invoice_ref text NOT NULL DEFAULT '', amount numeric(18,2) NOT NULL CHECK(amount>0), due_date date NOT NULL, description text NOT NULL DEFAULT '', next_follow_up date, hold_status text NOT NULL DEFAULT 'none' CHECK(hold_status IN ('none','disputed','on_hold')), created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_dues TO authenticated, service_role;
ALTER TABLE public.fin_dues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_dues;
CREATE POLICY finance_read ON public.fin_dues FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_dues;
CREATE POLICY finance_insert ON public.fin_dues FOR INSERT TO authenticated WITH CHECK(public.fin_access('read'));
DROP POLICY IF EXISTS finance_update ON public.fin_dues;
CREATE POLICY finance_update ON public.fin_dues FOR UPDATE TO authenticated USING(public.fin_access('read')) WITH CHECK(public.fin_access('read'));

CREATE TABLE IF NOT EXISTS public.fin_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ref text NOT NULL UNIQUE DEFAULT ('FIN-' || lpad(nextval('public.fin_ref_seq')::text,6,'0')), txn_date date NOT NULL DEFAULT current_date, direction text NOT NULL CHECK(direction IN ('in','out')), type text NOT NULL CHECK(type IN ('received','paid','reimbursement','salary','commission','refund','advance','transfer','bank_charge','interest','adjustment')), amount numeric(18,2) NOT NULL CHECK(amount>0), account_id uuid REFERENCES public.fin_accounts(id), mode text NOT NULL DEFAULT 'bank', utr text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '', department text NOT NULL DEFAULT 'All', party_id uuid REFERENCES public.fin_vendors(id), party_name text NOT NULL DEFAULT '', due_id uuid REFERENCES public.fin_dues(id), description text NOT NULL DEFAULT '', proof_path text NOT NULL DEFAULT '', source text NOT NULL DEFAULT 'manual', source_id uuid, corrects_id uuid REFERENCES public.fin_transactions(id), status text NOT NULL DEFAULT 'recorded' CHECK(status IN ('recorded','verified','reconciled','void')), created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), verified_by uuid, verified_at timestamptz, reconciled_by uuid, reconciled_at timestamptz, void_reason text NOT NULL DEFAULT '', voided_by uuid, voided_at timestamptz, UNIQUE(source,source_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_transactions TO authenticated, service_role;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_transactions;
CREATE POLICY finance_read ON public.fin_transactions FOR SELECT TO authenticated USING (public.fin_access());

CREATE TABLE IF NOT EXISTS public.fin_bank_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES public.fin_accounts(id), line_date date NOT NULL, description text NOT NULL DEFAULT '', ref text NOT NULL DEFAULT '', amount numeric(18,2) NOT NULL CHECK(amount<>0), status text NOT NULL DEFAULT 'unmatched' CHECK(status IN ('unmatched','matched','reconciled','disputed')), transaction_id uuid REFERENCES public.fin_transactions(id), note text NOT NULL DEFAULT '', imported_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), reconciled_at timestamptz, reconciled_by uuid, UNIQUE(account_id,line_date,description,ref,amount), CHECK(status NOT IN ('matched','reconciled') OR transaction_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_bank_lines TO authenticated, service_role;
ALTER TABLE public.fin_bank_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_bank_lines;
CREATE POLICY finance_read ON public.fin_bank_lines FOR SELECT TO authenticated USING (public.fin_access());

CREATE TABLE IF NOT EXISTS public.crm_collections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE DEFAULT ('COL-' || lpad(nextval('public.crm_collection_ref_seq')::text,6,'0')), lead_id uuid REFERENCES public.crm_leads(id), owner_id uuid NOT NULL, amount numeric(18,2) NOT NULL CHECK(amount>0 AND amount<=100000000), collected_on date NOT NULL, mode text NOT NULL CHECK(mode IN ('upi','bank_transfer','cash','cheque','card','gateway','other')), reference text NOT NULL DEFAULT '', payer_name text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','verified','rejected')), recorded_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), verified_by uuid, verified_at timestamptz, verify_note text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_collections TO authenticated, service_role;
ALTER TABLE public.crm_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.crm_collections;
CREATE POLICY finance_read ON public.crm_collections FOR SELECT TO authenticated USING (public.fin_access() OR owner_id=auth.uid() OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id=crm_collections.owner_id AND m.active AND m.manager_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.crm_incentive_plans (
 role text PRIMARY KEY CHECK(role IN ('BDE','BDM')), slabs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(slabs)='array'), active boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_incentive_plans TO authenticated, service_role;
ALTER TABLE public.crm_incentive_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.crm_incentive_plans;
CREATE POLICY finance_read ON public.crm_incentive_plans FOR SELECT TO authenticated USING (public.fin_access() OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id=auth.uid() AND m.active));

CREATE TABLE IF NOT EXISTS public.zoho_invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), zoho_id text NOT NULL UNIQUE, invoice_number text NOT NULL DEFAULT '', customer_name text NOT NULL DEFAULT '', invoice_date date, due_date date, total numeric(18,2) NOT NULL DEFAULT 0, balance numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT '', currency text NOT NULL DEFAULT 'INR', synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zoho_invoices TO authenticated, service_role;
ALTER TABLE public.zoho_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.zoho_invoices;
CREATE POLICY finance_read ON public.zoho_invoices FOR SELECT TO authenticated USING (public.fin_access());
CREATE UNIQUE INDEX IF NOT EXISTS fin_bank_lines_transaction_unique ON public.fin_bank_lines(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fin_transactions_date_idx ON public.fin_transactions(txn_date,account_id);
CREATE INDEX IF NOT EXISTS crm_collections_owner_date_idx ON public.crm_collections(owner_id,collected_on,status);
ALTER TABLE public.volunteer_withdrawals ADD COLUMN IF NOT EXISTS proof_path text;
ALTER TABLE public.volunteer_withdrawals ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.volunteer_withdrawals ADD COLUMN IF NOT EXISTS verified_by uuid;

CREATE OR REPLACE FUNCTION public.fin_account_balances()
RETURNS TABLE(id uuid,name text,kind text,bank_name text,account_last4 text,opening_balance numeric,opening_date date,low_balance_alert numeric,active boolean,balance numeric,unreconciled bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT a.id,a.name,a.kind,a.bank_name,a.account_last4,a.opening_balance,a.opening_date,a.low_balance_alert,a.active,
 a.opening_balance+coalesce((SELECT sum(CASE WHEN t.direction='in' THEN t.amount ELSE -t.amount END) FROM public.fin_transactions t WHERE t.account_id=a.id AND t.status<>'void' AND t.txn_date>=a.opening_date),0),
 (SELECT count(*) FROM public.fin_bank_lines l WHERE l.account_id=a.id AND l.status<>'reconciled') FROM public.fin_accounts a ORDER BY a.name;
END $$;
CREATE OR REPLACE FUNCTION public.fin_budget_status(_month date DEFAULT current_date)
RETURNS TABLE(id uuid,month date,department text,category text,amount numeric,spent numeric,percent numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT b.id,b.month,b.department,b.category,b.amount,s.n,round(100*s.n/b.amount,2)
 FROM public.fin_budgets b CROSS JOIN LATERAL (SELECT coalesce(sum(t.amount),0) n FROM public.fin_transactions t WHERE t.status<>'void' AND t.direction='out' AND t.category=b.category AND (b.department='All' OR t.department=b.department) AND date_trunc('month',t.txn_date)::date=b.month) s
 WHERE b.month=date_trunc('month',_month)::date;
END $$;
CREATE OR REPLACE FUNCTION public.fin_dues_list()
RETURNS TABLE(id uuid,direction text,party_name text,invoice_ref text,amount numeric,due_date date,description text,next_follow_up date,hold_status text,settled numeric,outstanding numeric,status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT d.id,d.direction,d.party_name,d.invoice_ref,d.amount,d.due_date,d.description,d.next_follow_up,d.hold_status,s.n,greatest(0,d.amount-s.n),
 CASE WHEN s.n>=d.amount THEN 'paid' WHEN d.hold_status<>'none' THEN d.hold_status WHEN d.due_date<(now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'overdue' WHEN s.n>0 THEN 'partial' ELSE 'not_due' END
 FROM public.fin_dues d CROSS JOIN LATERAL (SELECT coalesce(sum(t.amount),0) n FROM public.fin_transactions t WHERE t.due_id=d.id AND t.status<>'void' AND t.direction=CASE d.direction WHEN 'receivable' THEN 'in' ELSE 'out' END) s ORDER BY d.due_date;
END $$;
CREATE OR REPLACE FUNCTION public.fin_record_transaction(_input jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_type text:=_input->>'type'; v_dir text; v_correct uuid:=nullif(_input->>'corrects_id','')::uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 IF (v_type='adjustment' OR v_correct IS NOT NULL) AND NOT public.fin_access('manager') THEN RAISE EXCEPTION 'Manager required for corrections'; END IF;
 v_dir:=CASE WHEN v_type IN ('received','interest') THEN 'in' WHEN v_type IN ('transfer','adjustment') THEN _input->>'direction' ELSE 'out' END;
 IF nullif(_input->>'account_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_accounts WHERE id=(_input->>'account_id')::uuid AND active) THEN RAISE EXCEPTION 'Active account required'; END IF;
 IF nullif(_input->>'due_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_dues WHERE id=(_input->>'due_id')::uuid AND direction=CASE v_dir WHEN 'in' THEN 'receivable' ELSE 'payable' END) THEN RAISE EXCEPTION 'Due direction mismatch'; END IF;
 INSERT INTO public.fin_transactions(type,direction,amount,txn_date,account_id,mode,utr,category,department,party_id,party_name,due_id,description,proof_path,corrects_id,created_by)
 VALUES(v_type,v_dir,(_input->>'amount')::numeric,coalesce(nullif(_input->>'txn_date','')::date,(now() AT TIME ZONE 'Asia/Kolkata')::date),nullif(_input->>'account_id','')::uuid,coalesce(_input->>'mode','bank'),coalesce(_input->>'utr',''),coalesce(_input->>'category',''),coalesce(nullif(_input->>'department',''),'All'),nullif(_input->>'party_id','')::uuid,coalesce(_input->>'party_name',''),nullif(_input->>'due_id','')::uuid,coalesce(_input->>'description',''),coalesce(_input->>'proof_path',''),v_correct,auth.uid()) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
CREATE OR REPLACE FUNCTION public.fin_verify_transaction(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.fin_transactions;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('accounts') THEN RAISE EXCEPTION 'Accounts access required'; END IF;
 SELECT * INTO t FROM public.fin_transactions WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR t.status<>'recorded' THEN RAISE EXCEPTION 'Entry must be recorded'; END IF;
 IF t.created_by IS NULL OR t.created_by=auth.uid() THEN RAISE EXCEPTION 'A different person must verify'; END IF;
 UPDATE public.fin_transactions SET status='verified',verified_at=now(),verified_by=auth.uid() WHERE id=_id;
END $$;
CREATE OR REPLACE FUNCTION public.fin_void_transaction(_id uuid,_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('manager') THEN RAISE EXCEPTION 'Manager access required'; END IF;
 IF nullif(trim(_reason),'') IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
 UPDATE public.fin_transactions SET status='void',void_reason=_reason,voided_by=auth.uid(),voided_at=now() WHERE id=_id AND status IN ('recorded','verified') AND source='manual' AND NOT EXISTS(SELECT 1 FROM public.fin_bank_lines WHERE transaction_id=_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Entry locked or matched; unmatch first'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.fin_bank_line_action(_line uuid,_action text,_txn uuid DEFAULT NULL,_note text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.fin_bank_lines; t public.fin_transactions; v_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('accounts') THEN RAISE EXCEPTION 'Accounts access required'; END IF;
 SELECT * INTO l FROM public.fin_bank_lines WHERE id=_line FOR UPDATE;
 IF NOT FOUND OR l.status='reconciled' THEN RAISE EXCEPTION 'Line not found or locked'; END IF;
 IF _action='match' THEN
  SELECT * INTO t FROM public.fin_transactions WHERE id=_txn FOR UPDATE;
  IF NOT FOUND OR t.status NOT IN ('recorded','verified') OR t.account_id IS DISTINCT FROM l.account_id OR t.amount<>abs(l.amount) OR t.direction<>(CASE WHEN l.amount>0 THEN 'in' ELSE 'out' END) THEN RAISE EXCEPTION 'Entry does not match account, amount or direction'; END IF;
  UPDATE public.fin_bank_lines SET transaction_id=_txn,status='matched',note=coalesce(_note,'') WHERE id=_line;
 ELSIF _action='reconcile' THEN
  IF l.status<>'matched' THEN RAISE EXCEPTION 'Match the line first'; END IF;
  SELECT * INTO t FROM public.fin_transactions WHERE id=l.transaction_id FOR UPDATE;
  IF t.status<>'verified' OR t.account_id IS DISTINCT FROM l.account_id OR t.amount<>abs(l.amount) OR t.direction<>(CASE WHEN l.amount>0 THEN 'in' ELSE 'out' END) THEN RAISE EXCEPTION 'Matched entry must be verified and consistent'; END IF;
  UPDATE public.fin_transactions SET status='reconciled',reconciled_by=auth.uid(),reconciled_at=now() WHERE id=t.id;
  UPDATE public.fin_bank_lines SET status='reconciled',reconciled_by=auth.uid(),reconciled_at=now() WHERE id=_line;
 ELSIF _action='unmatch' THEN
  UPDATE public.fin_bank_lines SET status='unmatched',transaction_id=NULL,note=coalesce(_note,'') WHERE id=_line;
 ELSIF _action='dispute' THEN
  IF nullif(trim(_note),'') IS NULL THEN RAISE EXCEPTION 'Dispute note required'; END IF;
  UPDATE public.fin_bank_lines SET status='disputed',transaction_id=NULL,note=_note WHERE id=_line;
 ELSIF _action IN ('bank_charge','interest','received') THEN
  IF l.transaction_id IS NOT NULL THEN RAISE EXCEPTION 'Unmatch first'; END IF;
  IF (_action='bank_charge' AND l.amount>0) OR (_action IN ('interest','received') AND l.amount<0) THEN RAISE EXCEPTION 'Invalid direction'; END IF;
  v_id:=public.fin_record_transaction(jsonb_build_object('type',_action,'amount',abs(l.amount),'txn_date',l.line_date,'account_id',l.account_id,'utr',l.ref,'description',l.description,'category',CASE WHEN _action='bank_charge' THEN 'Bank charges' WHEN _action='interest' THEN 'Interest' ELSE '' END));
  UPDATE public.fin_bank_lines SET status='matched',transaction_id=v_id,note=coalesce(_note,'') WHERE id=_line;
 ELSE RAISE EXCEPTION 'Unknown bank action'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.fin_import_bank_lines(_account uuid,_lines jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; v_date date; v_amount numeric; v_id uuid; v_txn uuid; v_candidates uuid[]; n_insert int:=0; n_duplicate int:=0; n_invalid int:=0; n_matched int:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('accounts') THEN RAISE EXCEPTION 'Accounts access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.fin_accounts WHERE id=_account AND active) THEN RAISE EXCEPTION 'Active account required'; END IF;
 IF jsonb_typeof(_lines)<>'array' OR jsonb_array_length(_lines)>10000 THEN RAISE EXCEPTION 'Expected at most 10000 bank lines'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_account::text,0));
 FOR r IN SELECT value FROM jsonb_array_elements(_lines) LOOP
  BEGIN
   v_date:=(r->>'date')::date; v_amount:=(r->>'amount')::numeric(18,2);
   IF v_date IS NULL OR v_amount IS NULL OR v_amount=0 THEN n_invalid:=n_invalid+1; CONTINUE; END IF;
  EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow OR invalid_datetime_format OR numeric_value_out_of_range THEN n_invalid:=n_invalid+1; CONTINUE;
  END;
  v_id:=NULL;
  INSERT INTO public.fin_bank_lines(account_id,line_date,description,ref,amount) VALUES(_account,v_date,coalesce(r->>'description',''),coalesce(r->>'ref',''),v_amount) ON CONFLICT(account_id,line_date,description,ref,amount) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN n_duplicate:=n_duplicate+1; CONTINUE; END IF;
  n_insert:=n_insert+1;
  SELECT array_agg(t.id) INTO v_candidates FROM public.fin_transactions t WHERE t.account_id=_account AND t.status IN ('recorded','verified') AND t.amount=abs(v_amount) AND t.direction=CASE WHEN v_amount>0 THEN 'in' ELSE 'out' END
   AND ((nullif(r->>'ref','') IS NOT NULL AND t.utr=r->>'ref') OR abs(t.txn_date-v_date)<=3)
   AND NOT EXISTS(SELECT 1 FROM public.fin_bank_lines b WHERE b.transaction_id=t.id);
  IF cardinality(v_candidates)=1 THEN
   v_txn:=v_candidates[1];
   BEGIN
    PERFORM public.fin_bank_line_action(v_id,'match',v_txn,'Auto-matched (unique candidate)'); n_matched:=n_matched+1;
   EXCEPTION WHEN unique_violation THEN NULL;
   END;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('inserted',n_insert,'duplicates',n_duplicate,'invalid',n_invalid,'matched',n_matched);
END $$;

CREATE OR REPLACE FUNCTION public.crm_record_collection(_lead uuid,_owner uuid,_amount numeric,_date date,_mode text,_reference text,_payer text,_note text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid:=_owner; v_lead_owner uuid; v_code text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND NOT EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=auth.uid() AND active AND role IN ('BDE','BDM')) THEN RAISE EXCEPTION 'Sales access required'; END IF;
 IF _lead IS NOT NULL THEN
  SELECT owner_id INTO v_lead_owner FROM public.crm_leads WHERE id=_lead;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  v_owner:=coalesce(v_owner,v_lead_owner);
  IF v_lead_owner IS NOT NULL AND v_owner IS DISTINCT FROM v_lead_owner THEN RAISE EXCEPTION 'Collection owner must match lead owner'; END IF;
 END IF;
 v_owner:=coalesce(v_owner,auth.uid());
 IF NOT EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=v_owner AND active AND role IN ('BDE','BDM')) THEN RAISE EXCEPTION 'Active sales owner required'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND v_owner<>auth.uid() AND NOT EXISTS(SELECT 1 FROM public.crm_memberships me JOIN public.crm_memberships employee ON employee.manager_id=me.user_id WHERE me.user_id=auth.uid() AND me.active AND me.role='BDM' AND employee.user_id=v_owner AND employee.active) THEN RAISE EXCEPTION 'Owner outside your team'; END IF;
 IF _date IS NULL OR _date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Valid collection date required'; END IF;
 IF _mode<>'cash' AND nullif(trim(_reference),'') IS NULL THEN RAISE EXCEPTION 'Payment reference required'; END IF;
 IF length(_reference)>80 OR length(_payer)>120 OR length(_note)>500 THEN RAISE EXCEPTION 'Collection text too long'; END IF;
 INSERT INTO public.crm_collections(lead_id,owner_id,amount,collected_on,mode,reference,payer_name,note,recorded_by)
 VALUES(_lead,v_owner,_amount,_date,_mode,coalesce(_reference,''),coalesce(_payer,''),coalesce(_note,''),auth.uid()) RETURNING code INTO v_code;
 RETURN v_code;
END $$;
CREATE OR REPLACE FUNCTION public.crm_verify_collection(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.crm_collections; v_status text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Accounts or Finance access required'; END IF;
 SELECT * INTO c FROM public.crm_collections WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR c.status<>'unverified' THEN RAISE EXCEPTION 'Collection must be unverified'; END IF;
 IF auth.uid() IN (c.owner_id,c.recorded_by) THEN RAISE EXCEPTION 'A different person must verify'; END IF;
 IF _approve IS NULL OR (NOT _approve AND nullif(trim(_note),'') IS NULL) THEN RAISE EXCEPTION 'Decision and rejection reason required'; END IF;
 v_status:=CASE WHEN _approve THEN 'verified' ELSE 'rejected' END;
 UPDATE public.crm_collections SET status=v_status,verified_by=auth.uid(),verified_at=now(),verify_note=coalesce(_note,'') WHERE id=_id;
 RETURN v_status;
END $$;

CREATE OR REPLACE FUNCTION public.finance_withdrawals()
RETURNS TABLE(id uuid,request_number text,volunteer_id uuid,volunteer_name text,volunteer_code text,kyc_status text,amount numeric,payout_masked text,method text,status text,requested_at timestamptz,processed_at timestamptz,paid_at timestamptz,transaction_id text,rejection_reason text,proof_path text,verified_at timestamptz,verified_by uuid,verified_by_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT w.id,w.request_number,w.volunteer_id,v.full_name,v.volunteer_code,v.kyc_status,w.amount::numeric,w.payout_masked,w.method,w.status,w.requested_at,w.processed_at,w.paid_at,w.transaction_id,w.rejection_reason,w.proof_path,w.verified_at,w.verified_by,p.display_name
 FROM public.volunteer_withdrawals w JOIN public.volunteers v ON v.id=w.volunteer_id LEFT JOIN public.profiles p ON p.id=w.verified_by ORDER BY w.requested_at DESC;
END $$;
DROP FUNCTION IF EXISTS public.volunteer_process_withdrawal(uuid,text,text,text);
CREATE OR REPLACE FUNCTION public.volunteer_process_withdrawal(_id uuid,_status text,_transaction_id text DEFAULT NULL,_reason text DEFAULT NULL,_proof_path text DEFAULT NULL,_account_id uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE w public.volunteer_withdrawals; v public.volunteers;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 SELECT * INTO w FROM public.volunteer_withdrawals WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR w.status NOT IN ('pending','processing') THEN RAISE EXCEPTION 'Withdrawal not found or final'; END IF;
 SELECT * INTO v FROM public.volunteers WHERE id=w.volunteer_id FOR UPDATE;
 IF v.user_id=auth.uid() THEN RAISE EXCEPTION 'Cannot process your own withdrawal'; END IF;
 IF _status='processing' THEN
  IF NOT public.fin_access('accounts') OR w.status<>'pending' THEN RAISE EXCEPTION 'Accounts must verify a pending withdrawal'; END IF;
  IF v.kyc_status<>'verified' THEN RAISE EXCEPTION 'Verified KYC required'; END IF;
  UPDATE public.volunteer_withdrawals SET status='processing',verified_at=now(),verified_by=auth.uid(),processed_at=now(),updated_by=auth.uid() WHERE id=_id;
 ELSIF _status='paid' THEN
  IF NOT public.fin_access('finance') OR w.status<>'processing' OR w.verified_by IS NULL OR w.verified_by=auth.uid() THEN RAISE EXCEPTION 'A different Finance person must pay after verification'; END IF;
  IF v.kyc_status<>'verified' THEN RAISE EXCEPTION 'Verified KYC required'; END IF;
  IF nullif(trim(_transaction_id),'') IS NULL OR nullif(trim(_proof_path),'') IS NULL THEN RAISE EXCEPTION 'UTR and proof required'; END IF;
  IF _account_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_accounts WHERE id=_account_id AND active) THEN RAISE EXCEPTION 'Active account required'; END IF;
  UPDATE public.volunteer_withdrawals SET status='paid',paid_at=now(),processed_at=now(),transaction_id=_transaction_id,proof_path=_proof_path,updated_by=auth.uid() WHERE id=_id;
  INSERT INTO public.fin_transactions(txn_date,direction,type,amount,account_id,mode,utr,category,department,party_name,description,proof_path,source,source_id,status,created_by,verified_by,verified_at)
  VALUES((now() AT TIME ZONE 'Asia/Kolkata')::date,'out','commission',w.amount,_account_id,w.method,_transaction_id,'Volunteer commission','volunteers',v.full_name,w.request_number,_proof_path,'volunteer_withdrawal',w.id,'verified',auth.uid(),w.verified_by,w.verified_at);
 ELSIF _status='rejected' THEN
  IF NOT (public.fin_access('accounts') OR public.fin_access('finance')) OR nullif(trim(_reason),'') IS NULL THEN RAISE EXCEPTION 'Authorized rejection and reason required'; END IF;
  UPDATE public.volunteer_withdrawals SET status='rejected',rejection_reason=_reason,processed_at=now(),updated_by=auth.uid() WHERE id=_id;
 ELSE RAISE EXCEPTION 'Unsupported withdrawal status'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.fin_overview() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o jsonb; v_month date:=date_trunc('month',now() AT TIME ZONE 'Asia/Kolkata')::date; request_stats jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 SELECT jsonb_build_object(
 'bank_balance',coalesce(sum(balance) FILTER(WHERE active AND kind<>'cash'),0),
 'cash_balance',coalesce(sum(balance) FILTER(WHERE active AND kind='cash'),0),
 'accounts',count(*) FILTER(WHERE active),
 'low_balance',count(*) FILTER(WHERE active AND low_balance_alert>0 AND balance<low_balance_alert)) INTO o FROM public.fin_account_balances();
 SELECT o || jsonb_build_object(
 'received_month',coalesce(sum(amount) FILTER(WHERE direction='in' AND txn_date>=v_month),0),
 'paid_month',coalesce(sum(amount) FILTER(WHERE direction='out' AND txn_date>=v_month),0),
 'unverified_entries',count(*) FILTER(WHERE status='recorded'),
 'missing_proof',count(*) FILTER(WHERE direction='out' AND nullif(proof_path,'') IS NULL)) INTO o FROM public.fin_transactions WHERE status<>'void';
 SELECT o || jsonb_build_object(
 'receivables',coalesce(sum(outstanding) FILTER(WHERE direction='receivable'),0),
 'payables',coalesce(sum(outstanding) FILTER(WHERE direction='payable'),0),
 'overdue_receivables',count(*) FILTER(WHERE direction='receivable' AND outstanding>0 AND due_date<(now() AT TIME ZONE 'Asia/Kolkata')::date),
 'overdue_payables',count(*) FILTER(WHERE direction='payable' AND outstanding>0 AND due_date<(now() AT TIME ZONE 'Asia/Kolkata')::date)) INTO o FROM public.fin_dues_list();
 SELECT o || jsonb_build_object('volunteer_pending',count(*),'volunteer_pending_amount',coalesce(sum(amount),0)) INTO o FROM public.volunteer_withdrawals WHERE status IN ('pending','processing');
 o:=o || jsonb_build_object('unreconciled_lines',(SELECT count(*) FROM public.fin_bank_lines WHERE status<>'reconciled'),'budgets_over_75',(SELECT count(*) FROM public.fin_budget_status(v_month) WHERE percent>=75));
 SELECT o || jsonb_build_object('monthly',coalesce(jsonb_agg(jsonb_build_object('month',to_char(m.month,'YYYY-MM'),'income',s.income,'expense',s.expense) ORDER BY m.month),'[]'::jsonb)) INTO o
 FROM generate_series(v_month-interval '11 months',v_month,interval '1 month') m(month)
 CROSS JOIN LATERAL (SELECT coalesce(sum(t.amount) FILTER(WHERE t.direction='in'),0) income,coalesce(sum(t.amount) FILTER(WHERE t.direction='out'),0) expense FROM public.fin_transactions t WHERE t.status<>'void' AND t.txn_date>=m.month::date AND t.txn_date<(m.month+interval '1 month')::date) s;
 SELECT o || jsonb_build_object('categories',coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb)) INTO o FROM (SELECT category,sum(amount) amount FROM public.fin_transactions WHERE status<>'void' AND direction='out' AND txn_date>=v_month AND txn_date<(v_month+interval '1 month')::date GROUP BY category ORDER BY sum(amount) DESC) c;
 IF to_regclass('public.requests') IS NOT NULL THEN
  EXECUTE $q$
   SELECT jsonb_build_object(
    'pending_expenses',count(*) FILTER(WHERE j->>'status'='pending' AND j->>'type' IN ('expense','expense_claim','reimbursement')),
    'pending_expense_amount',coalesce(sum(nullif(j->>'amount','')::numeric) FILTER(WHERE j->>'status'='pending' AND j->>'type' IN ('expense','expense_claim','reimbursement')),0),
    'pending_approvals',count(*) FILTER(WHERE j->>'status'='pending' AND (j->>'kind'='money' OR nullif(j->>'amount','')::numeric>0)),
    'ready_to_pay',count(*) FILTER(WHERE j->>'status'='approved' AND nullif(j->>'amount','')::numeric>0),
    'ready_to_pay_amount',coalesce(sum(nullif(j->>'amount','')::numeric) FILTER(WHERE j->>'status'='approved' AND nullif(j->>'amount','')::numeric>0),0))
   FROM (SELECT to_jsonb(r) j FROM public.requests r) x
  $q$ INTO request_stats;
 ELSE
  request_stats:=jsonb_build_object('pending_expenses',NULL,'pending_expense_amount',NULL,'pending_approvals',NULL,'ready_to_pay',NULL,'ready_to_pay_amount',NULL);
 END IF;
 RETURN o || request_stats;
END $$;

DO $$
DECLARE r record;
BEGIN
 FOR r IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('fin_account_balances','fin_bank_line_action','fin_budget_status','fin_dues_list','fin_import_bank_lines','fin_overview','fin_record_transaction','fin_verify_transaction','fin_void_transaction','finance_withdrawals','crm_record_collection','crm_verify_collection','volunteer_process_withdrawal') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon',r.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role',r.signature);
 END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE public.fin_ref_seq,public.crm_collection_ref_seq TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.fin_transactions,public.fin_bank_lines,public.crm_collections,public.crm_incentive_plans,public.zoho_invoices FROM authenticated;