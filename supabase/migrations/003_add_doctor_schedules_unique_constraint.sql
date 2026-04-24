-- ============================================================
-- Migration 003: Deduplicate doctor_schedules + add UNIQUE constraint
-- ============================================================
-- Purpose: Removes duplicate (doctor_id, day_of_week) rows created by
--          repeated upserts before the ON CONFLICT fix, then adds the
--          UNIQUE constraint so future upserts work correctly.
--
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/jedgnisrjwemhazherro/sql
-- ============================================================

-- Step 1: Delete older duplicates, keeping only the most recent row
-- per (doctor_id, day_of_week) combination.
DELETE FROM public.doctor_schedules
WHERE id NOT IN (
  SELECT DISTINCT ON (doctor_id, day_of_week) id
  FROM public.doctor_schedules
  ORDER BY doctor_id, day_of_week, created_at DESC
);

-- Step 2: Verify no duplicates remain (should return 0 rows).
-- SELECT doctor_id, day_of_week, COUNT(*) AS cnt
-- FROM public.doctor_schedules
-- GROUP BY doctor_id, day_of_week
-- HAVING COUNT(*) > 1;

-- Step 3: Add the UNIQUE constraint now that the data is clean.
ALTER TABLE public.doctor_schedules
  ADD CONSTRAINT doctor_schedules_doctor_id_day_of_week_key
  UNIQUE (doctor_id, day_of_week);
