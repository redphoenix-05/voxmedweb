-- Migration: Add public_doctors view + fix approval flow
-- Run this in your Supabase SQL editor.

-- 1. Create the public_doctors view used by the mobile app.
--    Only shows doctors that are fully approved by their hospital.
CREATE OR REPLACE VIEW public_doctors AS
SELECT
  d.id,
  d.profile_id,
  d.hospital_id,
  d.specialty,
  d.sub_specialty,
  d.department,
  d.qualifications,
  d.experience_years,
  d.license_number,
  d.bio,
  d.consultation_fee,
  d.room_number,
  d.patients_count,
  d.reviews_count,
  d.rating,
  d.is_available,
  d.chamber_address,
  d.chamber_city,
  d.status,
  d.approved_by_hospital,
  d.created_at,
  d.updated_at
FROM doctors d
WHERE d.status = 'approved'
  AND d.approved_by_hospital = true
  AND d.is_available = true;

-- 2. Grant read access to app users
GRANT SELECT ON public_doctors TO anon, authenticated;

-- 3. Fix any existing approved doctors who are stuck with is_available=false
--    (This corrects doctors approved before this bug was caught)
UPDATE doctors
SET is_available = true
WHERE status = 'approved'
  AND approved_by_hospital = true
  AND is_available = false;
