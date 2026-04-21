import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, authorize('admin'));

// Get all hospitals
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('hospitals')
      .select(`*, hospital_staff!hospital_staff_hospital_id_fkey(
        role,
        profiles:profiles!hospital_staff_profile_id_fkey(full_name, email)
      )`)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Attach the admin profile directly on each hospital for easy use
    const hospitals = (data || []).map(h => {
      const adminStaff = (h.hospital_staff || []).find(s => s.role === 'admin');
      return { ...h, admin: adminStaff?.profiles || null };
    });

    res.json({ hospitals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// Get single hospital
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .select(`*, hospital_staff!hospital_staff_hospital_id_fkey(
        role,
        profiles:profiles!hospital_staff_profile_id_fkey(full_name, email)
      )`)
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Hospital not found' });
    const adminStaff = (data.hospital_staff || []).find(s => s.role === 'admin');
    res.json({ hospital: { ...data, admin: adminStaff?.profiles || null } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
});

// Approve hospital
router.patch('/:id/approve', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ status: 'approved' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ hospital: data, message: 'Hospital approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve hospital' });
  }
});

// Reject hospital
router.patch('/:id/reject', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ status: 'rejected' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ hospital: data, message: 'Hospital rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject hospital' });
  }
});

// Delete hospital
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('hospitals').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Hospital deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hospital' });
  }
});

export default router;
