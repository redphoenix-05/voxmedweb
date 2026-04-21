import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).max(100),
  role: z.literal('hospital_admin').default('hospital_admin'),
  hospital_name: z.string().min(2).max(200),
  hospital_location: z.string().min(2).max(500),
  license_number: z.string().min(2).max(100),
  emergency_phone: z.string().min(5).max(30),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Sign up (hospital admin only)
router.post('/signup', validate(signUpSchema), async (req, res) => {
  try {
    const { email, password, full_name, hospital_name, hospital_location, license_number, emergency_phone } = req.validated;

    // 1. Create auth user (profile auto-created by trigger with role=hospital_admin)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: hospital_name, role: 'hospital_admin' },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const userId = data.user.id;

    // 2. Create hospital record
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .insert({
        name: hospital_name,
        address: hospital_location,
        city: hospital_location,
        state: hospital_location,
        country: 'Bangladesh',
        email,
        phone: emergency_phone,
        license_number,
        status: 'pending',
      })
      .select('id')
      .single();

    if (hospitalError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: hospitalError.message });
    }

    // 3. Link admin to hospital via hospital_staff
    const { error: staffError } = await supabaseAdmin
      .from('hospital_staff')
      .insert({
        hospital_id: hospital.id,
        profile_id: userId,
        role: 'admin',
      });

    if (staffError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: staffError.message });
    }

    res.status(201).json({ message: 'Hospital registered successfully', user: { id: userId, email } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to register hospital' });
  }
});

// Sign in
router.post('/signin', validate(signInSchema), async (req, res) => {
  try {
    const { email, password } = req.validated;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { ...data.user, profile },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.profile });
});

// Update profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone) updates.phone = phone;
    if (avatar_url) updates.avatar_url = avatar_url;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Invalid refresh token' });

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export default router;
