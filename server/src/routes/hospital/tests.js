import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('hospital_admin'), attachHospital);

const testSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0),
  hospital_profit_percent: z.number().min(0).max(100).default(90),
  admin_profit_percent: z.number().min(0).max(100).default(10),
});

// Get all tests for hospital
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('medical_tests')
      .select('*')
      .eq('hospital_id', req.hospitalId)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ tests: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Add test
router.post('/', validate(testSchema), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('medical_tests')
      .insert({ ...req.validated, hospital_id: req.hospitalId })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ test: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add test' });
  }
});

// Update test
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'description', 'category', 'price', 'hospital_profit_percent', 'admin_profit_percent', 'is_active'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from('medical_tests')
      .update(updates)
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ test: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// Delete test
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('medical_tests')
      .delete()
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Test deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

export default router;
