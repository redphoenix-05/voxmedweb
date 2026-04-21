-- ============================================
-- VoxMed Connect - Seed Data (Bangladeshi)
-- Run this AFTER schema.sql via Supabase SQL Editor
-- ============================================

-- Ensure the `user_role` enum contains required labels before inserting profiles.
DO $$
BEGIN
  -- Create the enum if it doesn't exist yet (safe for re-runs).
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    EXECUTE 'CREATE TYPE public.user_role AS ENUM (''admin'',''hospital_admin'',''receptionist'',''lab_staff'',''doctor'',''patient'')';
  ELSE
    -- Add any missing enum labels one-by-one.
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
    ) THEN
      EXECUTE 'ALTER TYPE public.user_role ADD VALUE ''admin''';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'hospital_admin'
    ) THEN
      EXECUTE 'ALTER TYPE public.user_role ADD VALUE ''hospital_admin''';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'receptionist'
    ) THEN
      EXECUTE 'ALTER TYPE public.user_role ADD VALUE ''receptionist''';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'lab_staff'
    ) THEN
      EXECUTE 'ALTER TYPE public.user_role ADD VALUE ''lab_staff''';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'doctor'
    ) THEN
      EXECUTE 'ALTER TYPE public.user_role ADD VALUE ''doctor''';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'patient'
    ) THEN
      EXECUTE 'ALTER TYPE public.user_role ADD VALUE ''patient''';
    END IF;
  END IF;
END
$$;

-- ============================================
-- 1. CREATE ADMIN USER
-- ============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@voxmed.com',
  crypt('admin@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "VoxMed Admin", "role": "admin"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'admin@voxmed.com', 'email',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
);

-- ============================================
-- 2. CREATE HOSPITAL ADMINS (3 hospitals)
-- ============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES
(
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'dhakahospital@voxmed.com',
  crypt('hospital@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Rafiqul Islam", "role": "hospital_admin"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'b0000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000000',
  'chittagong@voxmed.com',
  crypt('hospital@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Nasrin Begum", "role": "hospital_admin"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'b0000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000000',
  'sylhethospital@voxmed.com',
  crypt('hospital@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Kamal Hossain", "role": "hospital_admin"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
(
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  'dhakahospital@voxmed.com', 'email',
  '{"sub": "b0000000-0000-0000-0000-000000000002", "email": "dhakahospital@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'b0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000012',
  'chittagong@voxmed.com', 'email',
  '{"sub": "b0000000-0000-0000-0000-000000000012", "email": "chittagong@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'b0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000013',
  'sylhethospital@voxmed.com', 'email',
  '{"sub": "b0000000-0000-0000-0000-000000000013", "email": "sylhethospital@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
);

-- ============================================
-- 3. CREATE DOCTORS (4 doctors)
-- ============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES
(
  'c0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'dr.aminul@voxmed.com',
  crypt('doctor@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Dr. Aminul Haque", "role": "doctor"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'c0000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000000',
  'dr.farzana@voxmed.com',
  crypt('doctor@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Dr. Farzana Akter", "role": "doctor"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'c0000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000000',
  'dr.sharif@voxmed.com',
  crypt('doctor@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Dr. Shariful Islam", "role": "doctor"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'c0000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000000',
  'dr.tahmina@voxmed.com',
  crypt('doctor@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Dr. Tahmina Sultana", "role": "doctor"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
(
  'c0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000003',
  'dr.aminul@voxmed.com', 'email',
  '{"sub": "c0000000-0000-0000-0000-000000000003", "email": "dr.aminul@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000014',
  'c0000000-0000-0000-0000-000000000014',
  'dr.farzana@voxmed.com', 'email',
  '{"sub": "c0000000-0000-0000-0000-000000000014", "email": "dr.farzana@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000015',
  'c0000000-0000-0000-0000-000000000015',
  'dr.sharif@voxmed.com', 'email',
  '{"sub": "c0000000-0000-0000-0000-000000000015", "email": "dr.sharif@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000016',
  'c0000000-0000-0000-0000-000000000016',
  'dr.tahmina@voxmed.com', 'email',
  '{"sub": "c0000000-0000-0000-0000-000000000016", "email": "dr.tahmina@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
);

-- ============================================
-- 4. CREATE RECEPTIONISTS (2)
-- ============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES
(
  'd0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'receptionist@voxmed.com',
  crypt('staff@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Roksana Parvin", "role": "receptionist"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'd0000000-0000-0000-0000-000000000017',
  '00000000-0000-0000-0000-000000000000',
  'receptionist2@voxmed.com',
  crypt('staff@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Mizanur Rahman", "role": "receptionist"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
(
  'd0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000004',
  'receptionist@voxmed.com', 'email',
  '{"sub": "d0000000-0000-0000-0000-000000000004", "email": "receptionist@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'd0000000-0000-0000-0000-000000000017',
  'd0000000-0000-0000-0000-000000000017',
  'receptionist2@voxmed.com', 'email',
  '{"sub": "d0000000-0000-0000-0000-000000000017", "email": "receptionist2@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
);

-- ============================================
-- 5. CREATE LAB STAFF (2)
-- ============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES
(
  'e0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'labstaff@voxmed.com',
  crypt('staff@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Jahangir Alam", "role": "lab_staff"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'e0000000-0000-0000-0000-000000000018',
  '00000000-0000-0000-0000-000000000000',
  'labstaff2@voxmed.com',
  crypt('staff@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Shirin Akhter", "role": "lab_staff"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
(
  'e0000000-0000-0000-0000-000000000005',
  'e0000000-0000-0000-0000-000000000005',
  'labstaff@voxmed.com', 'email',
  '{"sub": "e0000000-0000-0000-0000-000000000005", "email": "labstaff@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'e0000000-0000-0000-0000-000000000018',
  'e0000000-0000-0000-0000-000000000018',
  'labstaff2@voxmed.com', 'email',
  '{"sub": "e0000000-0000-0000-0000-000000000018", "email": "labstaff2@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
);

-- ============================================
-- 6. CREATE PATIENTS (4)
-- ============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES
(
  'f0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'patient@voxmed.com',
  crypt('patient@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Md. Habibur Rahman", "role": "patient"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'f0000000-0000-0000-0000-000000000019',
  '00000000-0000-0000-0000-000000000000',
  'patient2@voxmed.com',
  crypt('patient@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Sumaiya Khatun", "role": "patient"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'f0000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'patient3@voxmed.com',
  crypt('patient@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Abul Kalam Azad", "role": "patient"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
),
(
  'f0000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000000',
  'patient4@voxmed.com',
  crypt('patient@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Fatema Begum", "role": "patient"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
(
  'f0000000-0000-0000-0000-000000000006',
  'f0000000-0000-0000-0000-000000000006',
  'patient@voxmed.com', 'email',
  '{"sub": "f0000000-0000-0000-0000-000000000006", "email": "patient@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'f0000000-0000-0000-0000-000000000019',
  'f0000000-0000-0000-0000-000000000019',
  'patient2@voxmed.com', 'email',
  '{"sub": "f0000000-0000-0000-0000-000000000019", "email": "patient2@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'f0000000-0000-0000-0000-000000000020',
  'f0000000-0000-0000-0000-000000000020',
  'patient3@voxmed.com', 'email',
  '{"sub": "f0000000-0000-0000-0000-000000000020", "email": "patient3@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
),
(
  'f0000000-0000-0000-0000-000000000021',
  'f0000000-0000-0000-0000-000000000021',
  'patient4@voxmed.com', 'email',
  '{"sub": "f0000000-0000-0000-0000-000000000021", "email": "patient4@voxmed.com"}'::jsonb,
  NOW(), NOW(), NOW()
);

-- ============================================
-- 7. UPDATE PHONE NUMBERS (Bangladeshi +880 format)
-- ============================================

UPDATE profiles SET phone = '+880-1711-000001' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE profiles SET phone = '+880-1712-000002' WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE profiles SET phone = '+880-1713-000012' WHERE id = 'b0000000-0000-0000-0000-000000000012';
UPDATE profiles SET phone = '+880-1714-000013' WHERE id = 'b0000000-0000-0000-0000-000000000013';
UPDATE profiles SET phone = '+880-1715-000003' WHERE id = 'c0000000-0000-0000-0000-000000000003';
UPDATE profiles SET phone = '+880-1716-000014' WHERE id = 'c0000000-0000-0000-0000-000000000014';
UPDATE profiles SET phone = '+880-1717-000015' WHERE id = 'c0000000-0000-0000-0000-000000000015';
UPDATE profiles SET phone = '+880-1718-000016' WHERE id = 'c0000000-0000-0000-0000-000000000016';
UPDATE profiles SET phone = '+880-1719-000004' WHERE id = 'd0000000-0000-0000-0000-000000000004';
UPDATE profiles SET phone = '+880-1720-000017' WHERE id = 'd0000000-0000-0000-0000-000000000017';
UPDATE profiles SET phone = '+880-1721-000005' WHERE id = 'e0000000-0000-0000-0000-000000000005';
UPDATE profiles SET phone = '+880-1722-000018' WHERE id = 'e0000000-0000-0000-0000-000000000018';
UPDATE profiles SET phone = '+880-1723-000006' WHERE id = 'f0000000-0000-0000-0000-000000000006';
UPDATE profiles SET phone = '+880-1724-000019' WHERE id = 'f0000000-0000-0000-0000-000000000019';
UPDATE profiles SET phone = '+880-1725-000020' WHERE id = 'f0000000-0000-0000-0000-000000000020';
UPDATE profiles SET phone = '+880-1726-000021' WHERE id = 'f0000000-0000-0000-0000-000000000021';

-- ============================================
-- 8. CREATE HOSPITALS (3)
-- ============================================

INSERT INTO hospitals (
  id, admin_id, name, address, city, state, phone, email,
  license_number, description, status
) VALUES
(
  'h0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'Dhaka Medical College Hospital',
  'Bakshibazar Road, Chankharpool',
  'Dhaka',
  'Dhaka Division',
  '+880-2-55165088',
  'info@dmch.gov.bd',
  'LIC-HOS-BD-2024-001',
  'One of the largest government teaching hospitals in Bangladesh, offering comprehensive medical services across all major specialties.',
  'approved'
),
(
  'h0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000012',
  'Chittagong General Hospital',
  'K.B. Fazlul Kader Road, Panchlaish',
  'Chittagong',
  'Chittagong Division',
  '+880-31-652071',
  'info@cgh.gov.bd',
  'LIC-HOS-BD-2024-002',
  'Premier healthcare facility in Chittagong division providing quality medical care to patients from across southeastern Bangladesh.',
  'approved'
),
(
  'h0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000013',
  'Sylhet Osmani Medical College Hospital',
  'Osmani Hospital Road, Amberkhana',
  'Sylhet',
  'Sylhet Division',
  '+880-821-716475',
  'info@somch.gov.bd',
  'LIC-HOS-BD-2024-003',
  'Leading medical institution in Sylhet serving the northeastern region of Bangladesh with modern diagnostic and treatment facilities.',
  'approved'
);

-- ============================================
-- 9. CREATE DEPARTMENTS
-- ============================================

INSERT INTO departments (id, hospital_id, name, description) VALUES
  ('dep00000-0000-0000-0000-000000000001', 'h0000000-0000-0000-0000-000000000001', 'Cardiology', 'Heart and cardiovascular system'),
  ('dep00000-0000-0000-0000-000000000002', 'h0000000-0000-0000-0000-000000000001', 'Neurology', 'Brain and nervous system disorders'),
  ('dep00000-0000-0000-0000-000000000003', 'h0000000-0000-0000-0000-000000000001', 'Orthopedics', 'Bones, joints, and muscles'),
  ('dep00000-0000-0000-0000-000000000004', 'h0000000-0000-0000-0000-000000000001', 'Gynaecology', 'Women reproductive and maternal health'),
  ('dep00000-0000-0000-0000-000000000005', 'h0000000-0000-0000-0000-000000000001', 'General Medicine', 'Primary care and diagnostics'),
  ('dep00000-0000-0000-0000-000000000006', 'h0000000-0000-0000-0000-000000000002', 'Internal Medicine', 'General adult medicine'),
  ('dep00000-0000-0000-0000-000000000007', 'h0000000-0000-0000-0000-000000000002', 'Paediatrics', 'Children and infant healthcare'),
  ('dep00000-0000-0000-0000-000000000008', 'h0000000-0000-0000-0000-000000000003', 'Dermatology', 'Skin, hair, and nail disorders'),
  ('dep00000-0000-0000-0000-000000000009', 'h0000000-0000-0000-0000-000000000003', 'Ophthalmology', 'Eye diseases and surgery');

-- ============================================
-- 10. CREATE DOCTOR RECORDS (4 doctors)
-- ============================================

INSERT INTO doctors (
  id, user_id, hospital_id, department_id, specialization, qualification,
  experience_years, license_number, room_number, consultation_fee, status, bio
) VALUES
(
  'doc00000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000003',
  'h0000000-0000-0000-0000-000000000001',
  'dep00000-0000-0000-0000-000000000001',
  'Cardiology',
  'MBBS (DMCH), MD (Cardiology), FCPS',
  15,
  'LIC-DOC-BD-2024-001',
  '301A',
  800.00,
  'approved',
  'Senior cardiologist with 15 years of experience specialising in interventional cardiology and heart failure management at DMCH.'
),
(
  'doc00000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000014',
  'h0000000-0000-0000-0000-000000000001',
  'dep00000-0000-0000-0000-000000000004',
  'Gynaecology & Obstetrics',
  'MBBS (SSMC), FCPS (Gynae), MS',
  10,
  'LIC-DOC-BD-2024-002',
  '204B',
  700.00,
  'approved',
  'Experienced gynaecologist and obstetrician with a decade of dedicated service in maternal-foetal medicine and minimally invasive surgery.'
),
(
  'doc00000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000015',
  'h0000000-0000-0000-0000-000000000002',
  'dep00000-0000-0000-0000-000000000006',
  'Internal Medicine',
  'MBBS (CMCH), MRCP (UK)',
  8,
  'LIC-DOC-BD-2024-003',
  '110C',
  600.00,
  'approved',
  'Internal medicine specialist at Chittagong General Hospital focusing on diabetes management, hypertension, and infectious diseases.'
),
(
  'doc00000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000016',
  'h0000000-0000-0000-0000-000000000003',
  'dep00000-0000-0000-0000-000000000008',
  'Dermatology',
  'MBBS (SOMC), DDV, MD (Dermatology)',
  7,
  'LIC-DOC-BD-2024-004',
  '105A',
  500.00,
  'approved',
  'Dermatologist at Sylhet Osmani Medical College Hospital specialising in skin infections, acne management, and cosmetic dermatology.'
);

-- ============================================
-- 11. CREATE DOCTOR SCHEDULES
-- ============================================

-- Dr. Aminul Haque (Cardiology - DMCH)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES
  ('doc00000-0000-0000-0000-000000000001', 0, '09:00', '14:00', 15),
  ('doc00000-0000-0000-0000-000000000001', 1, '09:00', '17:00', 25),
  ('doc00000-0000-0000-0000-000000000001', 2, '09:00', '17:00', 25),
  ('doc00000-0000-0000-0000-000000000001', 3, '09:00', '13:00', 12),
  ('doc00000-0000-0000-0000-000000000001', 4, '09:00', '17:00', 25),
  ('doc00000-0000-0000-0000-000000000001', 6, '10:00', '14:00', 10);

-- Dr. Farzana Akter (Gynaecology - DMCH)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES
  ('doc00000-0000-0000-0000-000000000002', 0, '10:00', '15:00', 15),
  ('doc00000-0000-0000-0000-000000000002', 1, '10:00', '16:00', 20),
  ('doc00000-0000-0000-0000-000000000002', 3, '10:00', '16:00', 20),
  ('doc00000-0000-0000-0000-000000000002', 4, '10:00', '15:00', 15),
  ('doc00000-0000-0000-0000-000000000002', 6, '10:00', '13:00', 10);

-- Dr. Shariful Islam (Internal Medicine - CGH)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES
  ('doc00000-0000-0000-0000-000000000003', 0, '08:00', '14:00', 20),
  ('doc00000-0000-0000-0000-000000000003', 1, '08:00', '16:00', 30),
  ('doc00000-0000-0000-0000-000000000003', 2, '08:00', '16:00', 30),
  ('doc00000-0000-0000-0000-000000000003', 4, '08:00', '14:00', 20),
  ('doc00000-0000-0000-0000-000000000003', 6, '09:00', '13:00', 12);

-- Dr. Tahmina Sultana (Dermatology - SOMCH)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES
  ('doc00000-0000-0000-0000-000000000004', 1, '09:00', '15:00', 20),
  ('doc00000-0000-0000-0000-000000000004', 2, '09:00', '15:00', 20),
  ('doc00000-0000-0000-0000-000000000004', 3, '09:00', '15:00', 20),
  ('doc00000-0000-0000-0000-000000000004', 4, '09:00', '13:00', 12),
  ('doc00000-0000-0000-0000-000000000004', 6, '10:00', '13:00', 8);

-- ============================================
-- 12. LINK STAFF TO HOSPITALS
-- ============================================

INSERT INTO hospital_staff (user_id, hospital_id, role) VALUES
  ('d0000000-0000-0000-0000-000000000004', 'h0000000-0000-0000-0000-000000000001', 'receptionist'),
  ('d0000000-0000-0000-0000-000000000017', 'h0000000-0000-0000-0000-000000000002', 'receptionist'),
  ('e0000000-0000-0000-0000-000000000005', 'h0000000-0000-0000-0000-000000000001', 'lab_staff'),
  ('e0000000-0000-0000-0000-000000000018', 'h0000000-0000-0000-0000-000000000002', 'lab_staff');

-- ============================================
-- 13. CREATE MEDICAL TESTS
-- ============================================

INSERT INTO medical_tests (id, hospital_id, name, description, category, price, hospital_profit_percent, admin_profit_percent) VALUES
  -- Dhaka Medical College Hospital
  ('test0000-0000-0000-0000-000000000001', 'h0000000-0000-0000-0000-000000000001', 'Complete Blood Count (CBC)', 'রক্তের বিভিন্ন উপাদান পরিমাপ | Measures different components of blood', 'Blood', 350.00, 90, 10),
  ('test0000-0000-0000-0000-000000000002', 'h0000000-0000-0000-0000-000000000001', 'Lipid Profile', 'কোলেস্টেরল ও ট্রাইগ্লিসারাইড | Cholesterol and triglyceride levels', 'Blood', 500.00, 90, 10),
  ('test0000-0000-0000-0000-000000000003', 'h0000000-0000-0000-0000-000000000001', 'Chest X-Ray', 'বুকের এক্স-রে | Imaging of chest and lungs', 'Radiology', 800.00, 85, 15),
  ('test0000-0000-0000-0000-000000000004', 'h0000000-0000-0000-0000-000000000001', 'ECG / EKG', 'হৃদযন্ত্রের বৈদ্যুতিক কার্যক্রম | Heart electrical activity recording', 'Cardiology', 600.00, 88, 12),
  ('test0000-0000-0000-0000-000000000005', 'h0000000-0000-0000-0000-000000000001', 'Urinalysis (R/E)', 'প্রস্রাব পরীক্ষা | Urine routine examination', 'Lab', 200.00, 90, 10),
  ('test0000-0000-0000-0000-000000000006', 'h0000000-0000-0000-0000-000000000001', 'MRI Brain', 'মস্তিষ্কের এমআরআই | Magnetic resonance imaging of brain', 'Radiology', 4500.00, 80, 20),
  ('test0000-0000-0000-0000-000000000007', 'h0000000-0000-0000-0000-000000000001', 'Thyroid Function Test (TFT)', 'থাইরয়েড হরমোন | TSH, Free T3, Free T4 levels', 'Blood', 700.00, 90, 10),
  ('test0000-0000-0000-0000-000000000008', 'h0000000-0000-0000-0000-000000000001', 'Blood Sugar (Fasting)', 'রক্তের শর্করা (খালি পেটে) | Fasting glucose measurement', 'Blood', 150.00, 90, 10),
  ('test0000-0000-0000-0000-000000000009', 'h0000000-0000-0000-0000-000000000001', 'HbA1c (Glycated Haemoglobin)', '৩ মাসের গড় রক্তের সুগার | 3-month average blood sugar', 'Blood', 900.00, 88, 12),
  ('test0000-0000-0000-0000-000000000010', 'h0000000-0000-0000-0000-000000000001', 'Hepatitis B Surface Antigen (HBsAg)', 'হেপাটাইটিস বি পরীক্ষা | Hepatitis B screening', 'Blood', 400.00, 90, 10),
  -- Chittagong General Hospital
  ('test0000-0000-0000-0000-000000000011', 'h0000000-0000-0000-0000-000000000002', 'Complete Blood Count (CBC)', 'রক্ত পরীক্ষা | Full blood panel', 'Blood', 320.00, 90, 10),
  ('test0000-0000-0000-0000-000000000012', 'h0000000-0000-0000-0000-000000000002', 'Dengue NS1 Antigen', 'ডেঙ্গু পরীক্ষা | Rapid dengue fever detection', 'Blood', 600.00, 88, 12),
  ('test0000-0000-0000-0000-000000000013', 'h0000000-0000-0000-0000-000000000002', 'Chest X-Ray (PA View)', 'বুকের এক্স-রে | Posterior-anterior chest imaging', 'Radiology', 750.00, 85, 15),
  ('test0000-0000-0000-0000-000000000014', 'h0000000-0000-0000-0000-000000000002', 'Widal Test', 'টাইফয়েড পরীক্ষা | Typhoid fever diagnosis', 'Blood', 300.00, 90, 10),
  -- Sylhet Osmani Medical College Hospital
  ('test0000-0000-0000-0000-000000000015', 'h0000000-0000-0000-0000-000000000003', 'Skin Biopsy', 'চামড়ার বায়োপসি | Tissue sample for dermatological diagnosis', 'Dermatology', 1200.00, 82, 18),
  ('test0000-0000-0000-0000-000000000016', 'h0000000-0000-0000-0000-000000000003', 'Patch Test (Allergy)', 'অ্যালার্জি পরীক্ষা | Skin allergy patch testing', 'Dermatology', 800.00, 85, 15),
  ('test0000-0000-0000-0000-000000000017', 'h0000000-0000-0000-0000-000000000003', 'Blood Sugar (Random)', 'রক্তের সুগার (যেকোনো সময়) | Random blood glucose', 'Blood', 120.00, 90, 10);

-- ============================================
-- 14. CREATE APPOINTMENTS
-- ============================================

INSERT INTO appointments (
  id, patient_id, doctor_id, hospital_id,
  appointment_date, appointment_time, status, reason, booked_by
) VALUES
  (
    'apt00000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000006',
    'doc00000-0000-0000-0000-000000000001',
    'h0000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '1 day', '10:00', 'scheduled',
    'বুকে ব্যথা ও শ্বাসকষ্ট | Chest pain and shortness of breath',
    'd0000000-0000-0000-0000-000000000004'
  ),
  (
    'apt00000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000006',
    'doc00000-0000-0000-0000-000000000001',
    'h0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '3 days', '14:00', 'completed',
    'নিয়মিত হার্ট চেকআপ | Routine cardiac check-up',
    'd0000000-0000-0000-0000-000000000004'
  ),
  (
    'apt00000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000019',
    'doc00000-0000-0000-0000-000000000002',
    'h0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '5 days', '11:00', 'completed',
    'প্রসবপূর্ব চেকআপ | Antenatal check-up',
    'd0000000-0000-0000-0000-000000000004'
  ),
  (
    'apt00000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000020',
    'doc00000-0000-0000-0000-000000000003',
    'h0000000-0000-0000-0000-000000000002',
    CURRENT_DATE + INTERVAL '2 days', '09:30', 'scheduled',
    'ডায়াবেটিস ফলো-আপ | Diabetes follow-up visit',
    'd0000000-0000-0000-0000-000000000017'
  ),
  (
    'apt00000-0000-0000-0000-000000000005',
    'f0000000-0000-0000-0000-000000000021',
    'doc00000-0000-0000-0000-000000000004',
    'h0000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '2 days', '10:30', 'completed',
    'চর্মরোগ পরামর্শ | Skin rash consultation',
    NULL
  ),
  (
    'apt00000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000006',
    'doc00000-0000-0000-0000-000000000001',
    'h0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '10 days', '16:00', 'completed',
    'রক্ত পরীক্ষার ফলাফল পর্যালোচনা | Blood work results review',
    NULL
  );

-- ============================================
-- 15. CREATE MEDICAL RECORDS
-- ============================================

INSERT INTO medical_records (
  patient_id, doctor_id, hospital_id, test_id, appointment_id,
  diagnosis, notes, uploaded_by
) VALUES
  (
    'f0000000-0000-0000-0000-000000000006',
    'doc00000-0000-0000-0000-000000000001',
    'h0000000-0000-0000-0000-000000000001',
    'test0000-0000-0000-0000-000000000001',
    'apt00000-0000-0000-0000-000000000002',
    'স্বাভাবিক রক্ত পরীক্ষা | Normal CBC results',
    'All blood components within normal range. Haemoglobin 13.8 g/dL. WBC 7200/uL. Platelets 2.2 lac/cumm.',
    'e0000000-0000-0000-0000-000000000005'
  ),
  (
    'f0000000-0000-0000-0000-000000000006',
    'doc00000-0000-0000-0000-000000000001',
    'h0000000-0000-0000-0000-000000000001',
    'test0000-0000-0000-0000-000000000004',
    'apt00000-0000-0000-0000-000000000006',
    'স্বাভাবিক সাইনাস ছন্দ | Normal sinus rhythm',
    'ECG shows normal sinus rhythm. Heart rate 78 bpm. No ST changes or arrhythmias detected.',
    'e0000000-0000-0000-0000-000000000005'
  ),
  (
    'f0000000-0000-0000-0000-000000000019',
    'doc00000-0000-0000-0000-000000000002',
    'h0000000-0000-0000-0000-000000000001',
    NULL,
    'apt00000-0000-0000-0000-000000000003',
    'স্বাভাবিক গর্ভাবস্থা ২৮ সপ্তাহ | Normal pregnancy at 28 weeks',
    'Foetal heartbeat normal at 140 bpm. Weight gain appropriate. Blood pressure 110/70 mmHg. Next visit in 4 weeks.',
    'e0000000-0000-0000-0000-000000000005'
  ),
  (
    'f0000000-0000-0000-0000-000000000021',
    'doc00000-0000-0000-0000-000000000004',
    'h0000000-0000-0000-0000-000000000003',
    'test0000-0000-0000-0000-000000000016',
    'apt00000-0000-0000-0000-000000000005',
    'যোগাযোগজনিত ডার্মাটাইটিস | Contact dermatitis',
    'Patch test positive for nickel sulphate and fragrance mix. Advised to avoid triggers. Prescribed topical corticosteroid cream.',
    'e0000000-0000-0000-0000-000000000018'
  );

-- ============================================
-- 16. CREATE PAYMENTS
-- ============================================

INSERT INTO payments (
  appointment_id, test_id, patient_id, hospital_id,
  amount, admin_profit, hospital_profit, status, payment_method
) VALUES
  (
    'apt00000-0000-0000-0000-000000000002', NULL,
    'f0000000-0000-0000-0000-000000000006', 'h0000000-0000-0000-0000-000000000001',
    800.00, 80.00, 720.00, 'paid', 'bkash'
  ),
  (
    NULL, 'test0000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000006', 'h0000000-0000-0000-0000-000000000001',
    350.00, 35.00, 315.00, 'paid', 'nagad'
  ),
  (
    NULL, 'test0000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000006', 'h0000000-0000-0000-0000-000000000001',
    600.00, 72.00, 528.00, 'paid', 'cash'
  ),
  (
    'apt00000-0000-0000-0000-000000000003', NULL,
    'f0000000-0000-0000-0000-000000000019', 'h0000000-0000-0000-0000-000000000001',
    700.00, 70.00, 630.00, 'paid', 'rocket'
  ),
  (
    NULL, 'test0000-0000-0000-0000-000000000016',
    'f0000000-0000-0000-0000-000000000021', 'h0000000-0000-0000-0000-000000000003',
    800.00, 120.00, 680.00, 'paid', 'bkash'
  ),
  (
    'apt00000-0000-0000-0000-000000000005', NULL,
    'f0000000-0000-0000-0000-000000000021', 'h0000000-0000-0000-0000-000000000003',
    500.00, 50.00, 450.00, 'paid', 'cash'
  ),
  (
    'apt00000-0000-0000-0000-000000000004', NULL,
    'f0000000-0000-0000-0000-000000000020', 'h0000000-0000-0000-0000-000000000002',
    600.00, 60.00, 540.00, 'pending', 'bkash'
  );

-- ============================================
-- SEED DATA SUMMARY
-- ============================================
-- Admin:          admin@voxmed.com          / admin@123
-- Hospital 1:     dhakahospital@voxmed.com  / hospital@123   (Dhaka Medical College Hospital)
-- Hospital 2:     chittagong@voxmed.com     / hospital@123   (Chittagong General Hospital)
-- Hospital 3:     sylhethospital@voxmed.com / hospital@123   (Sylhet Osmani Medical College Hospital)
-- Doctor 1:       dr.aminul@voxmed.com      / doctor@123     (Cardiology - DMCH)
-- Doctor 2:       dr.farzana@voxmed.com     / doctor@123     (Gynaecology - DMCH)
-- Doctor 3:       dr.sharif@voxmed.com      / doctor@123     (Internal Medicine - CGH)
-- Doctor 4:       dr.tahmina@voxmed.com     / doctor@123     (Dermatology - SOMCH)
-- Receptionist 1: receptionist@voxmed.com   / staff@123      (DMCH)
-- Receptionist 2: receptionist2@voxmed.com  / staff@123      (CGH)
-- Lab Staff 1:    labstaff@voxmed.com       / staff@123      (DMCH)
-- Lab Staff 2:    labstaff2@voxmed.com      / staff@123      (CGH)
-- Patient 1:      patient@voxmed.com        / patient@123    (Md. Habibur Rahman)
-- Patient 2:      patient2@voxmed.com       / patient@123    (Sumaiya Khatun)
-- Patient 3:      patient3@voxmed.com       / patient@123    (Abul Kalam Azad)
-- Patient 4:      patient4@voxmed.com       / patient@123    (Fatema Begum)
