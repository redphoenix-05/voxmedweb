import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('hospital_admin'), attachHospital);

const staffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).max(100),
  phone: z.string().optional(),
  role: z.enum(['receptionist', 'lab_staff']),
});

// Get all staff for hospital
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hospital_staff')
      .select('*, profiles!hospital_staff_user_id_fkey(full_name, email, phone, is_active)')
      .eq('hospital_id', req.hospitalId)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ staff: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create staff account
router.post('/', validate(staffSchema), async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.validated;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError) return res.status(400).json({ error: authError.message });

    // Update phone
    if (phone) {
      await supabaseAdmin.from('profiles').update({ phone }).eq('id', authData.user.id);
    }

    // Link to hospital
    const { data, error } = await supabaseAdmin
      .from('hospital_staff')
      .insert({ user_id: authData.user.id, hospital_id: req.hospitalId, role })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ staff: data, message: 'Staff account created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    const { data: staff } = await supabaseAdmin
      .from('hospital_staff')
      .select('user_id')
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .single();

    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    await supabaseAdmin.from('hospital_staff').delete().eq('id', req.params.id);
    await supabaseAdmin.from('profiles').update({ is_active: false }).eq('id', staff.user_id);

    res.json({ message: 'Staff removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

export default router;
