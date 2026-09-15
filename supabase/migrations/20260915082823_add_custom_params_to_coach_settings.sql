/*
# Add custom_params to coach_settings

1. Modified Tables
- `coach_settings`:
  - Add `custom_params` jsonb column to store custom physical test parameters.
  - Default is empty array '[]'.

2. Security
- No policy changes needed — existing policies already allow full CRUD.

3. Important Notes
- Additive column, no data loss.
- Stores array of {id, name, unit} objects for custom test metrics.
*/

ALTER TABLE public.coach_settings
  ADD COLUMN IF NOT EXISTS custom_params jsonb NOT NULL DEFAULT '[]'::jsonb;
