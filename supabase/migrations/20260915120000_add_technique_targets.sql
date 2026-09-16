/*
# Add technique_targets to coach_settings

1. Modified Tables
- `coach_settings`:
   - Add `technique_targets` jsonb column to store target success values for each technical metric.
   - Default is object with keys for Servis, Passing, Smash, Block, Dig all set to 10.

2. Important Notes
- Additive column, no data loss.
- Stores object like { "Servis": 10, "Passing": 10, "Smash": 10, "Block": 10, "Dig": 10 }.
*/

ALTER TABLE public.coach_settings
  ADD COLUMN IF NOT EXISTS technique_targets jsonb NOT NULL DEFAULT '{"Servis":10,"Passing":10,"Smash":10,"Block":10,"Dig":10}'::jsonb;
