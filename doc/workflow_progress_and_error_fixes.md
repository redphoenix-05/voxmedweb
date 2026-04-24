# Workflow Progress And Error Fixes

## Fix #1 — Login to Dashboard Navigation

- Date: 2026-04-22
- Area: Login page / ProtectedRoute

### Issue Observed

Users could authenticate successfully but were not consistently reaching the dashboard after login.

### Root Cause

The login page performed navigation immediately after calling the auth context login method. Protected routes could evaluate before the updated auth state was fully reflected. When that happened, the guard redirected back to `/login`. The login page had no follow-up redirect for already-authenticated users once auth state finished updating.

### Fix Applied

- Updated `ProtectedRoute` to preserve the originally requested route when redirecting unauthenticated users to `/login`.
- Updated the login page to wait for settled auth state and redirect authenticated users after context state is available.
- Updated the login redirect fallback so unsupported roles go to `/unauthorized` instead of looping back through `/` and `/login`.

### Files Changed

- `client/src/components/ProtectedRoute.jsx`
- `client/src/pages/auth/LoginPage.jsx`

### Validation

- Ran `npm run build` in `client/` — passed

---

## Fix #2 — Doctor Not Appearing for Hospital Approval

- Date: 2026-04-24
- Area: Supabase RLS policies (`doctors` table)

### Issue Observed

When a new doctor registers under a hospital via the Flutter mobile app, they do not appear in the hospital's Doctor Management page on the web dashboard. Seeded doctors appear correctly; newly self-registered doctors are invisible.

### Root Cause

The `doctors` table has RLS enabled with only two policies:
1. `SELECT` for `status = 'approved'` — patients see only approved doctors ✓
2. `ALL` for `service_role` — web dashboard bypasses RLS ✓

**Missing:** No `INSERT` policy for `authenticated` users.

The Flutter app calls `supabase.from('doctors').insert({...})` using the doctor's JWT (authenticated role). Because no INSERT policy covers authenticated users, Supabase silently rejects the insert — no error is returned, 0 rows are written. The doctor row never exists in the database, so the web dashboard (which queries with service_role) correctly returns zero results.

Seeded doctors are written using the service_role key (via `seed-data.js`) which bypasses RLS entirely — hence they appear fine.

**Secondary:** Even if a doctor row existed with `status = 'pending'`, a doctor cannot query their own pending profile from the Flutter app because the only SELECT policy filters `status = 'approved'`.

### Fix

Apply `supabase/migrations/002_fix_rls_policies.sql` in the Supabase SQL Editor.

The migration adds three policies:
- `Doctors can insert own profile` — fixes the silent INSERT failure
- `Doctors can view own profile` — allows pending doctors to see their own record
- `Hospital admin views own hospital doctors` — defence-in-depth for future Flutter hospital admin views

### How to Apply

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project `jedgnisrjwemhazherro`
2. **SQL Editor → New query**
3. Paste and run `supabase/migrations/002_fix_rls_policies.sql`

### Files Changed

- `supabase/migrations/002_fix_rls_policies.sql` — new migration
- `voxmed/docs/rls_fix_doctor_visibility.md` — full root cause + fix documentation
- `voxmed/docs/database_schema.md` — updated RLS section, added `hospital_staff` table, `hospital_status`/`doctor_status` enums, approval columns on `doctors` and `hospitals`
- `voxmed/docs/progress.md` — updated progress tracker with new cross-platform section

### Validation (after applying fix)

Register a new doctor in the Flutter app → the `doctors` row will be created with `status = 'pending'` → the hospital admin web dashboard will immediately show the doctor in the pending list under Doctor Management.
