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

    // Step 1: fetch hospitals
    let query = supabaseAdmin
      .from('hospitals')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data: hospitalsData, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    if (!hospitalsData || hospitalsData.length === 0) {
      return res.json({ hospitals: [] });
    }

    // Step 2: fetch admin staff for those hospitals in one query
    const hospitalIds = hospitalsData.map(h => h.id);
    const { data: staffData } = await supabaseAdmin
      .from('hospital_staff')
      .select('hospital_id, profiles!hospital_staff_profile_id_fkey(full_name, email)')
      .in('hospital_id', hospitalIds)
      .eq('role', 'admin');

    // Build a map: hospitalId → admin profile
    const adminMap = {};
    for (const s of staffData || []) {
      adminMap[s.hospital_id] = s.profiles || null;
    }

    const hospitals = hospitalsData.map(h => ({ ...h, admin: adminMap[h.id] || null }));
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
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Hospital not found' });

    const { data: staffData } = await supabaseAdmin
      .from('hospital_staff')
      .select('profiles!hospital_staff_profile_id_fkey(full_name, email)')
      .eq('hospital_id', req.params.id)
      .eq('role', 'admin')
      .maybeSingle();

    res.json({ hospital: { ...data, admin: staffData?.profiles || null } });
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
