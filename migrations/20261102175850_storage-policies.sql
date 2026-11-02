-- Enable storage RLS policies for patient-records bucket
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON TABLE storage.objects TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public upload to patient-records'
  ) THEN
    CREATE POLICY "Allow public upload to patient-records"
      ON storage.objects FOR INSERT TO anon, authenticated
      WITH CHECK (bucket = 'patient-records');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read from patient-records'
  ) THEN
    CREATE POLICY "Allow public read from patient-records"
      ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket = 'patient-records');
  END IF;
END $$;
