-- Storage bucket for proof of payment and assignment uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('payments', 'payments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated upload to payments bucket
CREATE POLICY "Authenticated can upload payments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payments');

CREATE POLICY "Public read payments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payments');

-- Assignments bucket for submission files
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload assignments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assignments');

CREATE POLICY "Users can read own assignment files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'assignments');
