-- ============================================================
-- Migration 002: Fix RLS Policies — Doctor Visibility Bug
-- ============================================================
-- Problem: Doctors who register via the Flutter mobile app
--          never appear in the hospital admin's doctor list
--          on the web management dashboard.
--
-- Root cause: The `doctors` table has no INSERT policy for
--   authenticated users. When the app calls
--   supabase.from('doctors').insert({...}), Supabase silently
--   rejects the insert (0 rows, no error thrown). The doctor
--   row is never created, so the hospital dashboard shows
--   nothing to approve.
--
-- Secondary issue: Even if a doctor row existed with
--   status = 'pending', the only SELECT policy on `doctors`
--   filters status = 'approved'. The doctor themselves
--   cannot see their own pending profile.
--
-- Note: The web dashboard (voxmedweb) uses the service_role
--   key which bypasses RLS. The SELECT policies below are
--   defence-in-depth for the Flutter app side.
--
-- Run this in: Supabase dashboard → SQL Editor → New query
-- ============================================================

-- 1. Allow a doctor (authenticated user) to INSERT their own
--    profile row. The profile_id must equal the caller's auth uid.
CREATE POLICY "Doctors can insert own profile"
  ON public.doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- 2. Allow a doctor to SELECT their own row regardless of status.
--    Without this, a pending doctor cannot see their own profile
--    in the Flutter app (the only existing SELECT policy filters
--    status = 'approved').
CREATE POLICY "Doctors can view own profile"
  ON public.doctors
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- 3. Allow hospital staff with role = 'admin' in hospital_staff
--    to SELECT all doctors belonging to their hospital, including
--    pending ones.
--    Note: the hospital_role enum values are: admin, receptionist, lab
--    This policy is defence-in-depth — the web dashboard already
--    bypasses RLS via service_role, but this ensures any future
--    client-side hospital admin features work correctly.
CREATE POLICY "Hospital admin views own hospital doctors"
  ON public.doctors
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hs.hospital_id
      FROM public.hospital_staff hs
      WHERE hs.profile_id = auth.uid()
        AND hs.role = 'admin'
    )
  );

-- ============================================================
-- Verification (optional — run separately to confirm)
-- ============================================================
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'doctors'
-- ORDER BY policyname;
