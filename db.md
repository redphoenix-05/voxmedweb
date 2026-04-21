# VoxMed Database Schema

**Project:** `jedgnisrjwemhazherro` (Supabase)  
**URL:** `https://jedgnisrjwemhazherro.supabase.co`

---

## Enums

| Enum | Values |
|---|---|
| `user_role` | `patient`, `doctor`, `admin`, `hospital_admin`, `receptionist`, `lab_staff` |
| `hospital_role` | `admin`, `receptionist`, `lab` |
| `hospital_status` | `pending`, `approved`, `rejected` |
| `doctor_status` | `pending`, `approved`, `rejected` |
| `appointment_status` | `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`, `rescheduled` |
| `appointment_type` | `in_person`, `video`, `follow_up` |
| `payment_status` | `pending`, `paid`, `refunded` |
| `record_type` | `prescription`, `lab_result`, `radiology`, `consultation_note`, `discharge_summary`, `other` |
| `adherence_status` | `pending`, `taken`, `missed`, `skipped` |
| `consultation_status` | `active`, `closed` |
| `notification_type` | (various) |
| `prescription_status` | `active`, `completed`, `cancelled` |
| `renewal_status` | `pending`, `approved`, `rejected` |

---

## Tables

### `profiles`
User profiles — one per auth user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → `auth.users(id)` |
| `role` | user_role | default `patient` |
| `full_name` | text | NOT NULL |
| `email` | text | UNIQUE, NOT NULL |
| `phone` | text | |
| `date_of_birth` | date | |
| `gender` | text | |
| `blood_group` | text | |
| `address` | text | |
| `avatar_url` | text | |
| `emergency_contact` | jsonb | |
| `is_active` | boolean | default `true`, NOT NULL |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now() |

---

### `hospitals`
Registered hospitals.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | NOT NULL |
| `description` | text | |
| `address` | text | NOT NULL |
| `city` | text | NOT NULL |
| `state` | text | |
| `country` | text | NOT NULL |
| `zip_code` | text | |
| `latitude` | float8 | |
| `longitude` | float8 | |
| `phone` | text | |
| `email` | text | |
| `website` | text | |
| `logo_url` | text | |
| `cover_image_url` | text | |
| `operating_hours` | jsonb | |
| `services` | text[] | |
| `rating` | real | default 0 |
| `is_active` | boolean | default true |
| `license_number` | text | |
| `status` | hospital_status | default `pending` |
| `approved_by` | uuid | |
| `profit_earned` | numeric | default 0 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `hospital_staff`
Links users to hospitals with a role.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `hospital_id` | uuid | FK → `hospitals(id)` |
| `profile_id` | uuid | FK → `profiles(id)` |
| `role` | hospital_role | `admin` / `receptionist` / `lab` |
| `created_at` | timestamptz | |

> **Key:** Hospital admin link uses `role = 'admin'`. Used by `attachHospital` middleware.

---

### `doctors`
Doctor profiles — one per doctor (FK to profiles).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid | UNIQUE FK → `profiles(id)` |
| `hospital_id` | uuid | FK → `hospitals(id)`, nullable |
| `specialty` | text | NOT NULL — **text, NOT FK to departments** |
| `sub_specialty` | text | |
| `department` | text | **text, NOT FK to departments table** |
| `qualifications` | text[] | |
| `experience_years` | integer | |
| `license_number` | text | |
| `bio` | text | |
| `consultation_fee` | numeric | |
| `room_number` | text | |
| `patients_count` | integer | default 0 |
| `reviews_count` | integer | default 0 |
| `rating` | real | default 0 |
| `is_available` | boolean | default true |
| `chamber_address` | text | |
| `chamber_city` | text | |
| `status` | doctor_status | default `pending` |
| `approved_by_hospital` | boolean | default false |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

> **Approval flow:** Doctor registers (mobile app) → `status=pending`, `approved_by_hospital=false` → hospital approves via web → `status=approved`, `approved_by_hospital=true`, profile `role` updated to `doctor`

> **FK names for Supabase queries:**
> - profiles join: `profiles!doctors_profile_id_fkey`
> - schedules join: `doctor_schedules!doctor_schedules_doctor_id_fkey`

---

### `doctor_schedules`
Weekly recurring schedules per doctor.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `day_of_week` | smallint | 0=Sun … 6=Sat |
| `start_time` | time | |
| `end_time` | time | |
| `slot_duration_minutes` | integer | default 30 |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | |

> UNIQUE constraint on `(doctor_id, day_of_week, start_time)`

---

### `doctor_absences`
One-off absence dates for doctors.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `date` | date | NOT NULL |
| `reason` | text | |
| `is_emergency` | boolean | default false |
| `created_at` | timestamptz | |

---

### `departments`
Hospital departments (reference table).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `hospital_id` | uuid | FK → `hospitals(id)` |
| `name` | text | NOT NULL |
| `description` | text | |
| `created_at` | timestamptz | |

> **Note:** `doctors.department` is a free-text column, NOT a FK to this table.

---

### `appointments`
Patient appointments with doctors.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `hospital_id` | uuid | FK → `hospitals(id)`, nullable |
| `scheduled_start_at` | timestamptz | NOT NULL |
| `scheduled_end_at` | timestamptz | NOT NULL |
| `status` | appointment_status | default `scheduled` |
| `type` | appointment_type | default `in_person` |
| `reason` | text | |
| `notes` | text | |
| `rescheduled_from` | uuid | self-FK → `appointments(id)` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `payments`
Payment records for appointments and tests.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `appointment_id` | uuid | FK → `appointments(id)`, nullable |
| `test_id` | uuid | FK → `medical_tests(id)`, nullable |
| `patient_id` | uuid | FK → `profiles(id)` |
| `hospital_id` | uuid | FK → `hospitals(id)` |
| `amount` | numeric | NOT NULL |
| `admin_profit` | numeric | default 0 |
| `hospital_profit` | numeric | default 0 |
| `status` | payment_status | default `pending` |
| `payment_method` | text | |
| `created_at` | timestamptz | |

---

### `medical_records`
Patient medical records.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `doctor_id` | uuid | FK → `doctors(id)`, nullable |
| `appointment_id` | uuid | FK → `appointments(id)`, nullable |
| `record_type` | record_type | NOT NULL |
| `title` | text | NOT NULL |
| `description` | text | |
| `data` | jsonb | |
| `file_url` | text | |
| `ocr_extracted` | boolean | default false |
| `record_date` | date | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `prescriptions`
Doctor-issued prescriptions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `appointment_id` | uuid | FK → `appointments(id)`, nullable |
| `diagnosis` | text | |
| `notes` | text | |
| `status` | prescription_status | default `active` |
| `issued_date` | date | default today |
| `valid_until` | date | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `prescription_items`
Individual medication items in a prescription.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `prescription_id` | uuid | FK → `prescriptions(id)` |
| `medication_name` | text | NOT NULL |
| `dosage` | text | NOT NULL |
| `frequency` | text | NOT NULL |
| `duration_days` | integer | |
| `instructions` | text | |
| `quantity` | integer | |
| `remaining` | integer | |
| `created_at` | timestamptz | |

---

### `adherence_logs`
Medication adherence tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `prescription_item_id` | uuid | FK → `prescription_items(id)` |
| `scheduled_time` | timestamptz | NOT NULL |
| `response_time` | timestamptz | |
| `status` | adherence_status | default `pending` |
| `voice_transcript` | text | |
| `ai_confidence_score` | real | |
| `created_at` | timestamptz | |

---

### `prescription_renewals`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `prescription_id` | uuid | FK → `prescriptions(id)` |
| `patient_id` | uuid | FK → `profiles(id)` |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `status` | renewal_status | default `pending` |
| `requested_at` | timestamptz | |
| `responded_at` | timestamptz | |
| `doctor_notes` | text | |
| `new_prescription_id` | uuid | FK → `prescriptions(id)` |

---

### `medical_tests`
Tests offered by a hospital.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `hospital_id` | uuid | FK → `hospitals(id)` |
| `name` | text | |
| `price` | numeric | |
| `profit` | numeric | |
| `created_at` | timestamptz | |

---

### `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `profiles(id)` |
| `type` | notification_type | |
| `title` | text | NOT NULL |
| `body` | text | |
| `data` | jsonb | |
| `is_read` | boolean | default false |
| `created_at` | timestamptz | |

---

### `reviews`
Patient reviews for doctors.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `appointment_id` | uuid | FK → `appointments(id)`, nullable |
| `rating` | smallint | NOT NULL |
| `comment` | text | |
| `created_at` | timestamptz | |

> UNIQUE on `(patient_id, appointment_id)`

---

### `video_calls`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `appointment_id` | uuid | FK → `appointments(id)` |
| `room_id` | text | UNIQUE |
| `patient_id` | uuid | FK → `profiles(id)` |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `status` | text | default `pending` |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz | |
| `duration_seconds` | integer | |
| `recording_url` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `consultation_sessions`
Multi-doctor consultation sessions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `created_by` | uuid | FK → `doctors(id)` |
| `title` | text | |
| `status` | consultation_status | default `active` |
| `notes` | text | |
| `soap_note` | jsonb | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `consultation_members`
Doctors in a consultation session.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid | FK → `consultation_sessions(id)` |
| `doctor_id` | uuid | FK → `doctors(id)` |
| `role` | text | default `specialist` |
| `joined_at` | timestamptz | |

---

### `consultation_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid | FK → `consultation_sessions(id)` |
| `sender_id` | uuid | FK → `profiles(id)` |
| `content` | text | NOT NULL |
| `created_at` | timestamptz | |

---

### `ai_conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `title` | text | |
| `triage_result` | jsonb | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `ai_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `conversation_id` | uuid | FK → `ai_conversations(id)` |
| `role` | text | NOT NULL (`user` / `assistant`) |
| `content` | text | NOT NULL |
| `metadata` | jsonb | |
| `created_at` | timestamptz | |

---

### `call_transcripts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `video_call_id` | uuid | FK → `video_calls(id)` |
| `speaker_role` | text | NOT NULL |
| `content` | text | NOT NULL |
| `timestamp_ms` | bigint | NOT NULL |
| `confidence` | real | |
| `is_final` | boolean | default true |
| `created_at` | timestamptz | |

---

### `emergency_call_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `reason` | text | |
| `severity` | text | default `high` |
| `status` | text | default `pending` |
| `accepted_by` | uuid | FK → `doctors(id)`, nullable |
| `video_call_id` | uuid | FK → `video_calls(id)`, nullable |
| `expires_at` | timestamptz | default now()+5min |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `wearable_data`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid | FK → `profiles(id)` |
| `metric_type` | text | NOT NULL |
| `value` | jsonb | NOT NULL |
| `recorded_at` | timestamptz | NOT NULL |
| `source` | text | |
| `created_at` | timestamptz | |

---

## Seed Data (Known IDs)

### Hospitals
| Name | ID | Status |
|---|---|---|
| Dhaka Medical College Hospital | `a1000000-0000-0000-0000-000000000001` | approved |
| Chittagong General Hospital | `a1000000-0000-0000-0000-000000000002` | approved |
| Sylhet Osmani Medical College Hospital | `a1000000-0000-0000-0000-000000000003` | approved |
| Square Hospital | `081c6e6f-c3a5-4ab8-bfb3-3bf3eab8d831` | approved |
| Saint Jude Medical Center | `aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | pending |
| Green Valley Clinic | `aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | pending |
| Central Medical Pavilion | `aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | pending |

### Hospital Admins
| Email | Hospital |
|---|---|
| `dhakahospital@voxmed.com` | Dhaka Medical College Hospital |
| `chittagong@voxmed.com` | Chittagong General Hospital |
| `sylhethospital@voxmed.com` | Sylhet Osmani Medical College Hospital |
| `square@hospital.com` | Square Hospital |

### Test Credentials
| Email | Password | Role |
|---|---|---|
| `admin@voxmed.com` | `Admin@123456` | admin |
| `square@hospital.com` | (set at registration) | hospital_admin |
| `dhakahospital@voxmed.com` | `hospital@123` | hospital_admin |
| `dr.aminul@voxmed.com` | `doctor@123` | doctor |
| `dr.rafiq.test@voxmed.com` | `Test@123456` | patient (pending doctor – Square Hospital) |
| `dr.nadia.test@voxmed.com` | `Test@123456` | patient (pending doctor – Square Hospital) |

---

## Approval Flows

### Hospital Registration
1. Hospital registers on web (`POST /auth/signup`) → status `pending`
2. VoxMed admin approves in admin panel → status `approved`
3. Hospital admin can now log in and manage doctors

### Doctor Registration
1. Doctor registers in mobile app (`POST /auth/signup/doctor`) → `doctors.status = pending`, `approved_by_hospital = false`, profile `role = patient`
2. Hospital admin approves in hospital panel (`PATCH /hospital/doctors/:id/approve`) → `doctors.status = approved`, `approved_by_hospital = true`, profile `role = doctor`
3. Doctor now appears to patients in mobile app
