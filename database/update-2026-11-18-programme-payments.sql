-- RILOYD update (18 Nov 2026): transaction IDs from the Young Innovators, Prototype Funding and Funding Programme forms.
-- Safe to run more than once. Does not delete or change any data.

CREATE TABLE IF NOT EXISTS public.programme_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  programme text DEFAULT '' NOT NULL,
  application_id uuid,
  application_kind text,
  amount_paise integer NOT NULL,
  currency text DEFAULT 'INR' NOT NULL,
  payer_name text NOT NULL,
  payer_email text NOT NULL,
  payer_phone text DEFAULT '' NOT NULL,
  provider text DEFAULT 'zoho' NOT NULL,
  provider_payment_id text,
  provider_reference text,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text DEFAULT 'created' NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
GRANT ALL ON public.programme_payments TO service_role;
GRANT SELECT ON public.programme_payments TO authenticated;
ALTER TABLE public.programme_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read programme payments" ON public.programme_payments;
CREATE POLICY "Admins read programme payments" ON public.programme_payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- One transaction ID can be used only once (rejected ones can be sent again).
DO $$ BEGIN
  IF NOT EXISTS (SELECT provider_reference FROM public.programme_payments WHERE provider_reference IS NOT NULL AND status <> 'failed' GROUP BY provider_reference HAVING count(*) > 1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS programme_payments_reference_once ON public.programme_payments (provider_reference) WHERE provider_reference IS NOT NULL AND status <> 'failed';
  ELSE
    RAISE NOTICE 'Duplicate transaction IDs exist; unique index skipped. Reject the duplicates in Admin → Programme payments, then run this file again.';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS programme_payments_status_created ON public.programme_payments (status, created_at DESC);

NOTIFY pgrst, 'reload schema';
