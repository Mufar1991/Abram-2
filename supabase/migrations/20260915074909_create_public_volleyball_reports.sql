/*
# Create public volleyball performance reports

1. New Tables
- `volleyball_reports` stores shared physical-test and match-statistic reports.
- `id` unique report identifier.
- `report_type` identifies `physical` or `match`.
- `athlete_name` stores athlete or team name.
- `team_group` stores team category.
- `report_date` stores the test or match date.
- `readiness_score` stores the calculated 0-100 score when available.
- `payload` stores the detailed form values and analysis as JSON.
- `created_at` stores archive ordering time.

2. Security
- Enable row level security.
- Allow anonymous and authenticated visitors to read, create, update, and delete intentionally shared public reports.

3. Important Notes
- No user accounts are required for this public archive.
- The JSON payload preserves the complete report detail without losing form fields.
*/

CREATE TABLE IF NOT EXISTS public.volleyball_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('physical', 'match')),
  athlete_name text NOT NULL,
  team_group text NOT NULL DEFAULT 'Umum',
  report_date date NOT NULL,
  readiness_score integer CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volleyball_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read volleyball reports" ON public.volleyball_reports;
CREATE POLICY "Public can read volleyball reports"
  ON public.volleyball_reports FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create volleyball reports" ON public.volleyball_reports;
CREATE POLICY "Public can create volleyball reports"
  ON public.volleyball_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update volleyball reports" ON public.volleyball_reports;
CREATE POLICY "Public can update volleyball reports"
  ON public.volleyball_reports FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete volleyball reports" ON public.volleyball_reports;
CREATE POLICY "Public can delete volleyball reports"
  ON public.volleyball_reports FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS volleyball_reports_date_idx ON public.volleyball_reports (report_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS volleyball_reports_type_idx ON public.volleyball_reports (report_type);
