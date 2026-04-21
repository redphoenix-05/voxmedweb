import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('admin'));

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('doctors')
      .select('*, profiles!profile_id(full_name, email), hospitals!hospital_id(name)')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ doctors: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Approve doctor
router.patch('/:id/approve', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update({ status: 'approved' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    // Update profile role
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
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ doctor: data, message: 'Doctor rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject doctor' });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('doctors').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

export default router;
