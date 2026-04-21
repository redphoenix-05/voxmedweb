import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('admin'));

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (role) query = query.eq('role', role);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    // Don't allow deleting self
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Toggle user active status
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_active')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: !profile.is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
