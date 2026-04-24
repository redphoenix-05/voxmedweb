import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('hospital_admin'), attachHospital);

// Get doctors for this hospital
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('doctors')
      .select('*, profiles!doctors_profile_id_fkey(full_name, email, phone), doctor_schedules!doctor_schedules_doctor_id_fkey(*)')
      .eq('hospital_id', req.hospitalId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ doctors: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Approve doctor for hospital
router.patch('/:id/approve', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update({ status: 'approved', approved_by_hospital: true, is_available: true })
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    await supabaseAdmin.from('profiles').update({ role: 'doctor' }).eq('id', data.profile_id);
    res.json({ doctor: data, message: 'Doctor approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
});

// Reject doctor
router.patch('/:id/reject', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update({ status: 'rejected' })
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ doctor: data, message: 'Doctor rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject doctor' });
  }
});

const assignSchema = z.object({
  room_number: z.string().optional(),
  department_id: z.string().uuid().optional(),
  consultation_fee: z.number().min(0).optional(),
});

// Assign room/department to doctor
router.patch('/:id/assign', validate(assignSchema), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update(req.validated)
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ doctor: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign doctor' });
  }
});

const scheduleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  slot_duration_minutes: z.number().min(5).default(30),
  is_active: z.boolean().default(true),
});

// Set doctor schedule — select-then-update-or-insert avoids relying on a
// UNIQUE(doctor_id, day_of_week) constraint that may not exist in the cloud.
router.post('/:id/schedule', validate(scheduleSchema), async (req, res) => {
  try {
    // Check whether a schedule already exists for this doctor + day
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('doctor_schedules')
      .select('id')
      .eq('doctor_id', req.params.id)
      .eq('day_of_week', req.validated.day_of_week)
      .maybeSingle();

    if (selectError) return res.status(400).json({ error: selectError.message });

    let data, error;
    if (existing) {
      // Update existing row
      ({ data, error } = await supabaseAdmin
        .from('doctor_schedules')
        .update(req.validated)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      // Insert new row
      ({ data, error } = await supabaseAdmin
        .from('doctor_schedules')
        .insert({ doctor_id: req.params.id, ...req.validated })
        .select()
        .single());
    }

    if (error) return res.status(400).json({ error: error.message });
    res.json({ schedule: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set schedule' });
  }
});

export default router;
