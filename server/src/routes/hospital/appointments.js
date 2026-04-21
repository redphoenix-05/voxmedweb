import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('hospital_admin'), attachHospital);

// Get all appointments for hospital
router.get('/', async (req, res) => {
  try {
    const { doctor_id, date, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        profiles!patient_id(full_name, email, phone),
        doctors!doctor_id(id, profile_id, profiles!profile_id(full_name))
      `, { count: 'exact' })
      .eq('hospital_id', req.hospitalId)
      .order('scheduled_start_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (doctor_id) query = query.eq('doctor_id', doctor_id);
    if (date) query = query.gte('scheduled_start_at', `${date}T00:00:00`).lt('scheduled_start_at', `${date}T23:59:59`);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ appointments: data, total: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ appointment: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;
