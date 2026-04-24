-- ============================================
-- VoxMed Connect - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'hospital_admin', 'receptionist', 'lab_staff', 'doctor', 'patient');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOSPITALS TABLE
-- ============================================

CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_document_url TEXT,
  logo_url TEXT,
  description TEXT,
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOSPITAL STAFF TABLE
-- ============================================

CREATE TABLE hospital_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  role user_role NOT NULL CHECK (role IN ('receptionist', 'lab_staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hospital_id)
);

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCTORS TABLE
-- ============================================

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  license_number TEXT NOT NULL UNIQUE,
  license_document_url TEXT,
  room_number TEXT,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  status approval_status DEFAULT 'pending',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCTOR SCHEDULES TABLE
-- ============================================

CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_patients INTEGER DEFAULT 20,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- ============================================
-- MEDICAL TESTS TABLE
-- ============================================

CREATE TABLE medical_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL,
  hospital_profit_percent DECIMAL(5,2) DEFAULT 90.00,
  admin_profit_percent DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  booked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEDICAL RECORDS / REPORTS TABLE
-- ============================================

CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  test_id UUID REFERENCES medical_tests(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  report_url TEXT,
  report_name TEXT,
  diagnosis TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_id UUID REFERENCES medical_tests(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  admin_profit DECIMAL(10,2) DEFAULT 0,
  hospital_profit DECIMAL(10,2) DEFAULT 0,
  status payment_status DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Hospitals: public read for approved, admin full access
CREATE POLICY "Public can view approved hospitals" ON hospitals FOR SELECT USING (status = 'approved');
CREATE POLICY "Hospital admin manages own hospital" ON hospitals FOR ALL USING (admin_id = auth.uid());
CREATE POLICY "Service role full access hospitals" ON hospitals FOR ALL USING (auth.role() = 'service_role');

-- Doctors: similar pattern
CREATE POLICY "Public can view approved doctors" ON doctors FOR SELECT USING (status = 'approved');
CREATE POLICY "Service role full access doctors" ON doctors FOR ALL USING (auth.role() = 'service_role');

-- Appointments
CREATE POLICY "Patients view own appointments" ON appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Service role full access appointments" ON appointments FOR ALL USING (auth.role() = 'service_role');

-- Medical records
CREATE POLICY "Patients view own records" ON medical_records FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Service role full access records" ON medical_records FOR ALL USING (auth.role() = 'service_role');

-- General service role policies for remaining tables
CREATE POLICY "Service role full access staff" ON hospital_staff FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access departments" ON departments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access schedules" ON doctor_schedules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access tests" ON medical_tests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payments" ON payments FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER medical_tests_updated_at BEFORE UPDATE ON medical_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================
-- Create buckets: 'licenses', 'reports', 'avatars'
-- Set policies as needed

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_hospitals_status ON hospitals(status);
CREATE INDEX idx_hospitals_admin ON hospitals(admin_id);
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_payments_hospital ON payments(hospital_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);

-- ============================================
-- VIEWS
-- ============================================

-- public_doctors: patient-facing view of approved, available doctors
-- Used by the mobile app to list doctors patients can book/chat with.
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

-- Grant SELECT on the view to the anon and authenticated roles
GRANT SELECT ON public_doctors TO anon, authenticated;
