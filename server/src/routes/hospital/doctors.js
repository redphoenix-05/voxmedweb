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
      .select('*, profiles!profile_id(full_name, email, phone), departments(name), doctor_schedules(*)')
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
      .update({ status: 'approved' })
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
  max_patients: z.number().min(1).default(20),
  is_available: z.boolean().default(true),
});

// Set doctor schedule
router.post('/:id/schedule', validate(scheduleSchema), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctor_schedules')
      .upsert(
        { doctor_id: req.params.id, ...req.validated },
        { onConflict: 'doctor_id,day_of_week' }
      )
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ schedule: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set schedule' });
  }
});

export default router;
