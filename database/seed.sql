-- Starting values for acknowledgement number counters (each form starts at serial 00001).
INSERT INTO public.ack_form_counters (form_code, form_name, last_serial) VALUES
  ('01', 'Scholarship', 0),
  ('02', 'Young Innovators', 0),
  ('03', 'Funding Programme', 0),
  ('04', 'Foundation', 0),
  ('05', 'Registration', 0),
  ('06', 'Enquiry', 0)
ON CONFLICT (form_code) DO NOTHING;
