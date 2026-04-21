/**
 * VoxMed Connect - Cloud DB Seed Script
 * Uses cloud schema column names (NOT the local schema.sql)
 * Run: node scripts/seed-data.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── helpers ──────────────────────────────────────────────────────────────────
const log  = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.warn(`  ⚠ ${msg}`);

async function createUser(email, password, fullName, role) {
  // Check if already exists
  const { data: existing } = await sb.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing) { log(`User exists – skipping: ${email}`); return existing.id; }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) { warn(`createUser ${email}: ${error.message}`); return null; }

  const userId = data.user.id;

  // Wait for trigger to create profile row, then set role
  await new Promise(r => setTimeout(r, 800));
  await sb.from('profiles').update({ role, full_name: fullName }).eq('id', userId);

  log(`Created user [${role}]: ${email} → ${userId}`);
  return userId;
}

async function insert(table, rows, conflictCol = 'id') {
  const { error } = await sb.from(table).upsert(rows, { onConflict: conflictCol, ignoreDuplicates: true });
  if (error) warn(`Insert ${table}: ${error.message}`);
  else log(`Seeded ${table} (${rows.length} rows)`);
}

// ── main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 VoxMed Connect – seeding cloud database…\n');

  // ── 1. CREATE USERS ─────────────────────────────────────────────────────────
  console.log('── Users ──');

  const hAdmin1 = await createUser('dhakahospital@voxmed.com',    'hospital@123', 'Rafiqul Islam',      'hospital_admin');
  const hAdmin2 = await createUser('chittagong@voxmed.com',       'hospital@123', 'Nasrin Begum',       'hospital_admin');
  const hAdmin3 = await createUser('sylhethospital@voxmed.com',   'hospital@123', 'Kamal Hossain',      'hospital_admin');

  const doc1 = await createUser('dr.aminul@voxmed.com',   'doctor@123', 'Dr. Aminul Haque',    'doctor');
  const doc2 = await createUser('dr.farzana@voxmed.com',  'doctor@123', 'Dr. Farzana Akter',   'doctor');
  const doc3 = await createUser('dr.sharif@voxmed.com',   'doctor@123', 'Dr. Shariful Islam',  'doctor');
  const doc4 = await createUser('dr.tahmina@voxmed.com',  'doctor@123', 'Dr. Tahmina Sultana', 'doctor');

  const rec1 = await createUser('receptionist@voxmed.com',  'staff@123', 'Roksana Parvin',  'receptionist');
  const rec2 = await createUser('receptionist2@voxmed.com', 'staff@123', 'Mizanur Rahman',  'receptionist');

  const lab1 = await createUser('labstaff@voxmed.com',  'staff@123', 'Jahangir Alam',  'lab_staff');
  const lab2 = await createUser('labstaff2@voxmed.com', 'staff@123', 'Shirin Akhter', 'lab_staff');

  const pat1 = await createUser('patient@voxmed.com',  'patient@123', 'Md. Habibur Rahman', 'patient');
  const pat2 = await createUser('patient2@voxmed.com', 'patient@123', 'Sumaiya Khatun',     'patient');
  const pat3 = await createUser('patient3@voxmed.com', 'patient@123', 'Abul Kalam Azad',    'patient');
  const pat4 = await createUser('patient4@voxmed.com', 'patient@123', 'Fatema Begum',       'patient');

  if (!hAdmin1 || !hAdmin2 || !hAdmin3) {
    warn('One or more hospital admins failed – cannot seed dependent data.'); return;
  }

  // ── 2. HOSPITALS ─────────────────────────────────────────────────────────────
  console.log('\n── Hospitals ──');

  // UUIDs must only contain hex chars (0-9, a-f)
  const H1 = 'a1000000-0000-0000-0000-000000000001';
  const H2 = 'a1000000-0000-0000-0000-000000000002';
  const H3 = 'a1000000-0000-0000-0000-000000000003';

  await insert('hospitals', [
    {
      id: H1,
      name: 'Dhaka Medical College Hospital',
      description: 'One of the largest government teaching hospitals in Bangladesh, offering comprehensive medical services across all major specialties.',
      address: 'Bakshibazar Road, Chankharpool',
      city: 'Dhaka', state: 'Dhaka Division', country: 'Bangladesh',
      phone: '+880-2-55165088', email: 'info@dmch.gov.bd',
      license_number: 'LIC-HOS-BD-2024-001',
      status: 'approved', is_active: true,
    },
    {
      id: H2,
      name: 'Chittagong General Hospital',
      description: 'Premier healthcare facility in Chittagong division providing quality medical care.',
      address: 'K.B. Fazlul Kader Road, Panchlaish',
      city: 'Chittagong', state: 'Chittagong Division', country: 'Bangladesh',
      phone: '+880-31-652071', email: 'info@cgh.gov.bd',
      license_number: 'LIC-HOS-BD-2024-002',
      status: 'approved', is_active: true,
    },
    {
      id: H3,
      name: 'Sylhet Osmani Medical College Hospital',
      description: 'Leading medical institution in Sylhet serving the northeastern region of Bangladesh.',
      address: 'Osmani Hospital Road, Amberkhana',
      city: 'Sylhet', state: 'Sylhet Division', country: 'Bangladesh',
      phone: '+880-821-716475', email: 'info@somch.gov.bd',
      license_number: 'LIC-HOS-BD-2024-003',
      status: 'approved', is_active: true,
    },
  ]);

  // ── 3. HOSPITAL STAFF (admins + receptionists + lab) ─────────────────────────
  console.log('\n── Hospital Staff ──');

  const staffRows = [
    { hospital_id: H1, profile_id: hAdmin1, role: 'admin' },
    { hospital_id: H2, profile_id: hAdmin2, role: 'admin' },
    { hospital_id: H3, profile_id: hAdmin3, role: 'admin' },
  ];
  if (rec1) staffRows.push({ hospital_id: H1, profile_id: rec1, role: 'receptionist' });
  if (rec2) staffRows.push({ hospital_id: H2, profile_id: rec2, role: 'receptionist' });
  if (lab1) staffRows.push({ hospital_id: H1, profile_id: lab1, role: 'lab' });
  if (lab2) staffRows.push({ hospital_id: H2, profile_id: lab2, role: 'lab' });

  // hospital_staff has no unique constraint on (hospital_id, profile_id) in cloud — delete existing first
  const staffProfileIds = staffRows.map(r => r.profile_id).filter(Boolean);
  await sb.from('hospital_staff').delete().in('profile_id', staffProfileIds);
  const { error: staffErr } = await sb.from('hospital_staff').insert(staffRows);
  if (staffErr) warn(`Insert hospital_staff: ${staffErr.message}`);
  else log(`Seeded hospital_staff (${staffRows.length} rows)`);

  // ── 4. DEPARTMENTS ────────────────────────────────────────────────────────────
  console.log('\n── Departments ──');

  const DEP1 = 'ab000000-0000-0000-0000-000000000001';
  const DEP2 = 'ab000000-0000-0000-0000-000000000002';
  const DEP3 = 'ab000000-0000-0000-0000-000000000003';
  const DEP4 = 'ab000000-0000-0000-0000-000000000004';
  const DEP5 = 'ab000000-0000-0000-0000-000000000005';
  const DEP6 = 'ab000000-0000-0000-0000-000000000006';
  const DEP7 = 'ab000000-0000-0000-0000-000000000007';
  const DEP8 = 'ab000000-0000-0000-0000-000000000008';
  const DEP9 = 'ab000000-0000-0000-0000-000000000009';

  await insert('departments', [
    { id: DEP1, hospital_id: H1, name: 'Cardiology',       description: 'Heart and cardiovascular system' },
    { id: DEP2, hospital_id: H1, name: 'Neurology',        description: 'Brain and nervous system disorders' },
    { id: DEP3, hospital_id: H1, name: 'Orthopedics',      description: 'Bones, joints, and muscles' },
    { id: DEP4, hospital_id: H1, name: 'Gynaecology',      description: 'Women reproductive and maternal health' },
    { id: DEP5, hospital_id: H1, name: 'General Medicine', description: 'Primary care and diagnostics' },
    { id: DEP6, hospital_id: H2, name: 'Internal Medicine',description: 'General adult medicine' },
    { id: DEP7, hospital_id: H2, name: 'Paediatrics',      description: 'Children and infant healthcare' },
    { id: DEP8, hospital_id: H3, name: 'Dermatology',      description: 'Skin, hair, and nail disorders' },
    { id: DEP9, hospital_id: H3, name: 'Ophthalmology',    description: 'Eye diseases and surgery' },
  ]);

  // ── 5. DOCTORS ────────────────────────────────────────────────────────────────
  console.log('\n── Doctors ──');

  const D1 = 'ac000000-0000-0000-0000-000000000001';
  const D2 = 'ac000000-0000-0000-0000-000000000002';
  const D3 = 'ac000000-0000-0000-0000-000000000003';
  const D4 = 'ac000000-0000-0000-0000-000000000004';

  const docRows = [];
  if (doc1) docRows.push({
    id: D1,
    profile_id: doc1, hospital_id: H1,
    specialty: 'Cardiology', department: 'Cardiology',
    qualifications: ['MBBS (DMCH)', 'MD (Cardiology)', 'FCPS'],
    experience_years: 15, license_number: 'LIC-DOC-BD-2024-001',
    room_number: '301A', consultation_fee: 800,
    status: 'approved', approved_by_hospital: true,
    bio: 'Senior cardiologist with 15 years of experience specialising in interventional cardiology and heart failure management at DMCH.',
  });
  if (doc2) docRows.push({
    id: D2,
    profile_id: doc2, hospital_id: H1,
    specialty: 'Gynaecology & Obstetrics', department: 'Gynaecology',
    qualifications: ['MBBS (SSMC)', 'FCPS (Gynae)', 'MS'],
    experience_years: 10, license_number: 'LIC-DOC-BD-2024-002',
    room_number: '204B', consultation_fee: 700,
    status: 'approved', approved_by_hospital: true,
    bio: 'Experienced gynaecologist with a decade of dedicated service in maternal-foetal medicine and minimally invasive surgery.',
  });
  if (doc3) docRows.push({
    id: D3,
    profile_id: doc3, hospital_id: H2,
    specialty: 'Internal Medicine', department: 'Internal Medicine',
    qualifications: ['MBBS (CMCH)', 'MRCP (UK)'],
    experience_years: 8, license_number: 'LIC-DOC-BD-2024-003',
    room_number: '110C', consultation_fee: 600,
    status: 'approved', approved_by_hospital: true,
    bio: 'Internal medicine specialist at Chittagong General Hospital focusing on diabetes management, hypertension, and infectious diseases.',
  });
  if (doc4) docRows.push({
    id: D4,
    profile_id: doc4, hospital_id: H3,
    specialty: 'Dermatology', department: 'Dermatology',
    qualifications: ['MBBS (SOMC)', 'DDV', 'MD (Dermatology)'],
    experience_years: 7, license_number: 'LIC-DOC-BD-2024-004',
    room_number: '105A', consultation_fee: 500,
    status: 'approved', approved_by_hospital: true,
    bio: 'Dermatologist at Sylhet Osmani Medical College Hospital specialising in skin infections, acne management, and cosmetic dermatology.',
  });

  if (docRows.length) await insert('doctors', docRows);

  // ── 6. DOCTOR SCHEDULES ───────────────────────────────────────────────────────
  console.log('\n── Doctor Schedules ──');

  // cloud schema: day_of_week, start_time, end_time, slot_duration_minutes (required)
  const schedules = [];
  const addSchedule = (doctorId, slots) =>
    slots.forEach(([day, start, end]) =>
      schedules.push({ doctor_id: doctorId, day_of_week: day, start_time: start, end_time: end, slot_duration_minutes: 30 })
    );

  if (doc1) addSchedule(D1, [[0,'09:00','14:00'],[1,'09:00','17:00'],[2,'09:00','17:00'],[3,'09:00','13:00'],[4,'09:00','17:00'],[6,'10:00','14:00']]);
  if (doc2) addSchedule(D2, [[0,'10:00','15:00'],[1,'10:00','16:00'],[3,'10:00','16:00'],[4,'10:00','15:00'],[6,'10:00','13:00']]);
  if (doc3) addSchedule(D3, [[0,'08:00','14:00'],[1,'08:00','16:00'],[2,'08:00','16:00'],[4,'08:00','14:00'],[6,'09:00','13:00']]);
  if (doc4) addSchedule(D4, [[1,'09:00','15:00'],[2,'09:00','15:00'],[3,'09:00','15:00'],[4,'09:00','13:00'],[6,'10:00','13:00']]);

  if (schedules.length) {
    const doctorIds = [...new Set(schedules.map(s => s.doctor_id))];
    await sb.from('doctor_schedules').delete().in('doctor_id', doctorIds);
    const { error: schErr } = await sb.from('doctor_schedules').insert(schedules);
    if (schErr) warn(`Insert doctor_schedules: ${schErr.message}`);
    else log(`Seeded doctor_schedules (${schedules.length} rows)`);
  }

  // ── 7. MEDICAL TESTS ──────────────────────────────────────────────────────────
  console.log('\n── Medical Tests ──');
  // cloud columns: id, hospital_id, name, price, profit
  const T01 = 'ae000000-0000-0000-0000-000000000001';
  const T02 = 'ae000000-0000-0000-0000-000000000002';
  const T03 = 'ae000000-0000-0000-0000-000000000003';
  const T04 = 'ae000000-0000-0000-0000-000000000004';
  const T05 = 'ae000000-0000-0000-0000-000000000005';
  const T06 = 'ae000000-0000-0000-0000-000000000006';
  const T07 = 'ae000000-0000-0000-0000-000000000007';
  const T08 = 'ae000000-0000-0000-0000-000000000008';
  const T09 = 'ae000000-0000-0000-0000-000000000009';
  const T10 = 'ae000000-0000-0000-0000-000000000010';
  const T11 = 'ae000000-0000-0000-0000-000000000011';
  const T12 = 'ae000000-0000-0000-0000-000000000012';
  const T13 = 'ae000000-0000-0000-0000-000000000013';
  const T14 = 'ae000000-0000-0000-0000-000000000014';
  const T15 = 'ae000000-0000-0000-0000-000000000015';
  const T16 = 'ae000000-0000-0000-0000-000000000016';
  const T17 = 'ae000000-0000-0000-0000-000000000017';

  await insert('medical_tests', [
    { id: T01, hospital_id: H1, name: 'Complete Blood Count (CBC)',          price: 350,  profit: 35  },
    { id: T02, hospital_id: H1, name: 'Lipid Profile',                       price: 500,  profit: 50  },
    { id: T03, hospital_id: H1, name: 'Chest X-Ray',                         price: 800,  profit: 120 },
    { id: T04, hospital_id: H1, name: 'ECG / EKG',                           price: 600,  profit: 72  },
    { id: T05, hospital_id: H1, name: 'Urinalysis (R/E)',                    price: 200,  profit: 20  },
    { id: T06, hospital_id: H1, name: 'MRI Brain',                           price: 4500, profit: 900 },
    { id: T07, hospital_id: H1, name: 'Thyroid Function Test (TFT)',         price: 700,  profit: 70  },
    { id: T08, hospital_id: H1, name: 'Blood Sugar (Fasting)',               price: 150,  profit: 15  },
    { id: T09, hospital_id: H1, name: 'HbA1c (Glycated Haemoglobin)',        price: 900,  profit: 108 },
    { id: T10, hospital_id: H1, name: 'Hepatitis B Surface Antigen (HBsAg)',price: 400,  profit: 40  },
    { id: T11, hospital_id: H2, name: 'Complete Blood Count (CBC)',          price: 320,  profit: 32  },
    { id: T12, hospital_id: H2, name: 'Dengue NS1 Antigen',                  price: 600,  profit: 72  },
    { id: T13, hospital_id: H2, name: 'Chest X-Ray (PA View)',               price: 750,  profit: 112 },
    { id: T14, hospital_id: H2, name: 'Widal Test',                          price: 300,  profit: 30  },
    { id: T15, hospital_id: H3, name: 'Skin Biopsy',                         price: 1200, profit: 216 },
    { id: T16, hospital_id: H3, name: 'Patch Test (Allergy)',                 price: 800,  profit: 120 },
    { id: T17, hospital_id: H3, name: 'Blood Sugar (Random)',                 price: 120,  profit: 12  },
  ]);

  // ── 8. APPOINTMENTS ───────────────────────────────────────────────────────────
  console.log('\n── Appointments ──');

  if (!pat1 || !pat2 || !pat3 || !pat4 || !doc1 || !doc2 || !doc3 || !doc4) {
    warn('Skipping appointments — some patients/doctors missing');
  } else {
    const now = new Date();
    const dayMs = 86400000;
    const dt = (offsetDays, hour, minute = 0) => {
      const d = new Date(now.getTime() + offsetDays * dayMs);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };
    const dtEnd = (offsetDays, hour, minute = 0) => {
      const d = new Date(now.getTime() + offsetDays * dayMs);
      d.setHours(hour, minute + 30, 0, 0);
      return d.toISOString();
    };

    const APT1 = 'af000000-0000-0000-0000-000000000001';
    const APT2 = 'af000000-0000-0000-0000-000000000002';
    const APT3 = 'af000000-0000-0000-0000-000000000003';
    const APT4 = 'af000000-0000-0000-0000-000000000004';
    const APT5 = 'af000000-0000-0000-0000-000000000005';
    const APT6 = 'af000000-0000-0000-0000-000000000006';

    await insert('appointments', [
      { id: APT1, patient_id: pat1, doctor_id: D1, hospital_id: H1, scheduled_start_at: dt(1, 10),    scheduled_end_at: dtEnd(1, 10),    status: 'scheduled', type: 'in_person', reason: 'Chest pain and shortness of breath' },
      { id: APT2, patient_id: pat1, doctor_id: D1, hospital_id: H1, scheduled_start_at: dt(-3, 14),   scheduled_end_at: dtEnd(-3, 14),   status: 'completed', type: 'in_person', reason: 'Routine cardiac check-up' },
      { id: APT3, patient_id: pat2, doctor_id: D2, hospital_id: H1, scheduled_start_at: dt(-5, 11),   scheduled_end_at: dtEnd(-5, 11),   status: 'completed', type: 'in_person', reason: 'Antenatal check-up' },
      { id: APT4, patient_id: pat3, doctor_id: D3, hospital_id: H2, scheduled_start_at: dt(2, 9, 30), scheduled_end_at: dtEnd(2, 9, 30), status: 'scheduled', type: 'in_person', reason: 'Diabetes follow-up visit' },
      { id: APT5, patient_id: pat4, doctor_id: D4, hospital_id: H3, scheduled_start_at: dt(-2, 10, 30),scheduled_end_at: dtEnd(-2, 10, 30),status: 'completed',type: 'in_person', reason: 'Skin rash consultation' },
      { id: APT6, patient_id: pat1, doctor_id: D1, hospital_id: H1, scheduled_start_at: dt(-10, 16),  scheduled_end_at: dtEnd(-10, 16),  status: 'completed', type: 'in_person', reason: 'Blood work results review' },
    ]);

    // store for records/payments below
    seed._apts = { APT1, APT2, APT3, APT4, APT5, APT6 };
    seed._docs = { D1, D2, D3, D4 };
    seed._tests = { T01, T04, T16 };
  }

  // ── 9. MEDICAL RECORDS ────────────────────────────────────────────────────────
  console.log('\n── Medical Records ──');

  const apts = seed._apts || {};
  const docs = seed._docs || {};
  if (pat1 && pat2 && pat4 && doc1 && doc2 && doc4 && apts.APT2) {
    await insert('medical_records', [
      {
        patient_id: pat1, doctor_id: docs.D1,
        appointment_id: apts.APT2,
        record_type: 'lab_result', title: 'CBC Results',
        description: 'Normal CBC results',
        data: { haemoglobin: '13.8 g/dL', WBC: '7200/uL', platelets: '2.2 lac/cumm' },
        record_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      },
      {
        patient_id: pat1, doctor_id: docs.D1,
        appointment_id: apts.APT6,
        record_type: 'lab_result', title: 'ECG Report',
        description: 'Normal sinus rhythm. Heart rate 78 bpm. No ST changes or arrhythmias detected.',
        data: { heart_rate: '78 bpm', rhythm: 'Normal sinus rhythm' },
        record_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      },
      {
        patient_id: pat2, doctor_id: docs.D2,
        appointment_id: apts.APT3,
        record_type: 'consultation_note', title: 'Antenatal Visit – 28 weeks',
        description: 'Normal pregnancy at 28 weeks. Foetal heartbeat 140 bpm. BP 110/70. Next visit in 4 weeks.',
        data: { gestational_age: '28 weeks', bp: '110/70', foetal_hr: '140 bpm' },
        record_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      },
      {
        patient_id: pat4, doctor_id: docs.D4,
        appointment_id: apts.APT5,
        record_type: 'lab_result', title: 'Patch Test Results',
        description: 'Contact dermatitis. Positive for nickel sulphate and fragrance mix. Topical corticosteroid prescribed.',
        data: { diagnosis: 'Contact dermatitis', allergens: ['nickel sulphate', 'fragrance mix'] },
        record_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      },
    ]);
  }

  // ── 10. PAYMENTS ──────────────────────────────────────────────────────────────
  console.log('\n── Payments ──');

  const tests = seed._tests || {};
  if (pat1 && pat2 && pat3 && pat4 && apts.APT2) {
    await insert('payments', [
      { appointment_id: apts.APT2, patient_id: pat1, hospital_id: H1, amount: 800,  admin_profit: 80,  hospital_profit: 720, status: 'paid',    payment_method: 'bkash'  },
      { test_id: tests.T01,        patient_id: pat1, hospital_id: H1, amount: 350,  admin_profit: 35,  hospital_profit: 315, status: 'paid',    payment_method: 'nagad'  },
      { test_id: tests.T04,        patient_id: pat1, hospital_id: H1, amount: 600,  admin_profit: 72,  hospital_profit: 528, status: 'paid',    payment_method: 'cash'   },
      { appointment_id: apts.APT3, patient_id: pat2, hospital_id: H1, amount: 700,  admin_profit: 70,  hospital_profit: 630, status: 'paid',    payment_method: 'rocket' },
      { test_id: tests.T16,        patient_id: pat4, hospital_id: H3, amount: 800,  admin_profit: 120, hospital_profit: 680, status: 'paid',    payment_method: 'bkash'  },
      { appointment_id: apts.APT5, patient_id: pat4, hospital_id: H3, amount: 500,  admin_profit: 50,  hospital_profit: 450, status: 'paid',    payment_method: 'cash'   },
      { appointment_id: apts.APT4, patient_id: pat3, hospital_id: H2, amount: 600,  admin_profit: 60,  hospital_profit: 540, status: 'pending', payment_method: 'bkash'  },
    ]);
  }

  console.log('\n✅  Seeding complete!\n');
  console.log('  Credentials:');
  console.log('  Admin:          admin@voxmed.com          / Admin@123456');
  console.log('  Hospital 1:     dhakahospital@voxmed.com  / hospital@123   (Dhaka Medical College Hospital)');
  console.log('  Hospital 2:     chittagong@voxmed.com     / hospital@123   (Chittagong General Hospital)');
  console.log('  Hospital 3:     sylhethospital@voxmed.com / hospital@123   (Sylhet Osmani Medical College Hospital)');
  console.log('  Doctor 1:       dr.aminul@voxmed.com      / doctor@123     (Cardiology – DMCH)');
  console.log('  Doctor 2:       dr.farzana@voxmed.com     / doctor@123     (Gynaecology – DMCH)');
  console.log('  Doctor 3:       dr.sharif@voxmed.com      / doctor@123     (Internal Medicine – CGH)');
  console.log('  Doctor 4:       dr.tahmina@voxmed.com     / doctor@123     (Dermatology – SOMCH)');
  console.log('  Receptionist 1: receptionist@voxmed.com   / staff@123      (DMCH)');
  console.log('  Receptionist 2: receptionist2@voxmed.com  / staff@123      (CGH)');
  console.log('  Lab Staff 1:    labstaff@voxmed.com       / staff@123      (DMCH)');
  console.log('  Lab Staff 2:    labstaff2@voxmed.com      / staff@123      (CGH)');
  console.log('  Patient 1:      patient@voxmed.com        / patient@123');
  console.log('  Patient 2:      patient2@voxmed.com       / patient@123');
  console.log('  Patient 3:      patient3@voxmed.com       / patient@123');
  console.log('  Patient 4:      patient4@voxmed.com       / patient@123');
}

seed().catch(err => { console.error('Fatal error:', err); process.exit(1); });
