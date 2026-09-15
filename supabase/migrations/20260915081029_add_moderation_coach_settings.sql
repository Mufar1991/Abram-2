/*
# Add moderation, coach notes, and coach settings

1. Modified Tables
- `volleyball_reports`:
  - Add `status` text column (default 'approved') for moderation queue.
  - Add `coach_notes` text column for per-athlete coach notes.
- Both columns are nullable and have safe defaults so existing rows are unaffected.

2. New Tables
- `coach_settings`:
  - `id` uuid primary key.
  - `coach_name` text (default 'Muhammad Farid, S.Pd.') for PDF signature.
  - `pin_hash` text for admin access PIN (stored as simple hash).
  - `updated_at` timestamptz.

3. Security
- Enable RLS on `coach_settings`.
- Allow anon + authenticated to read coach_name (needed for PDF reports).
- Allow anon + authenticated to update settings (public app, no auth).
- volleyball_reports policies already allow full CRUD for anon + authenticated.

4. Important Notes
- No data is lost — all new columns are additive with defaults.
- Existing reports default to 'approved' status so they remain visible.
- Coach settings seeded with default coach name.
*/

-- Add status and coach_notes to volleyball_reports
ALTER TABLE public.volleyball_reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.volleyball_reports
  ADD COLUMN IF NOT EXISTS coach_notes text DEFAULT '';

-- Create coach_settings table
CREATE TABLE IF NOT EXISTS public.coach_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_name text NOT NULL DEFAULT 'Muhammad Farid, S.Pd.',
  pin_hash text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read coach settings" ON public.coach_settings;
CREATE POLICY "Public can read coach settings"
  ON public.coach_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can update coach settings" ON public.coach_settings;
CREATE POLICY "Public can update coach settings"
  ON public.coach_settings FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert coach settings" ON public.coach_settings;
CREATE POLICY "Public can insert coach settings"
  ON public.coach_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Seed default settings row if not exists
INSERT INTO public.coach_settings (coach_name)
SELECT 'Muhammad Farid, S.Pd.'
WHERE NOT EXISTS (SELECT 1 FROM public.coach_settings LIMIT 1);

-- Add index on status for moderation queries
CREATE INDEX IF NOT EXISTS volleyball_reports_status_idx ON public.volleyball_reports (status);
