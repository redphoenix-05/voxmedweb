import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('lab_staff'), attachHospital);

// Get patients for this hospital (with appointments)
router.get('/patients', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*, profiles!appointments_patient_id_fkey(id, full_name, email, phone)')
      .eq('hospital_id', req.hospitalId)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ appointments: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get medical records
router.get('/records', async (req, res) => {
  try {
    const { patient_id } = req.query;
    let query = supabaseAdmin
      .from('medical_records')
      .select('*, profiles!medical_records_patient_id_fkey(full_name, email), medical_tests(name)')
      .eq('hospital_id', req.hospitalId)
      .order('created_at', { ascending: false });

    if (patient_id) query = query.eq('patient_id', patient_id);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ records: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

const recordSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid().optional(),
  test_id: z.string().uuid().optional(),
  appointment_id: z.string().uuid().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

// Create medical record
router.post('/records', validate(recordSchema), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('medical_records')
      .insert({
        ...req.validated,
        hospital_id: req.hospitalId,
        uploaded_by: req.user.id,
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ record: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create record' });
  }
});

export default router;
