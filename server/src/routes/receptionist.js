import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('receptionist'), attachHospital);

// Get doctor schedules for the hospital
router.get('/schedules', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select('id, specialty, consultation_fee, profiles!doctors_profile_id_fkey(full_name), doctor_schedules(*)')
      .eq('hospital_id', req.hospitalId)
      .eq('status', 'approved');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ doctors: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

const bookingSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  scheduled_start_at: z.string(),
  scheduled_end_at: z.string(),
  reason: z.string().optional(),
});

// Book appointment manually
router.post('/book', validate(bookingSchema), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        ...req.validated,
        hospital_id: req.hospitalId,
        type: 'in_person',
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ appointment: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Search patients
router.get('/patients', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ error: 'Query too short' });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('role', 'patient')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(20);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ patients: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

export default router;
