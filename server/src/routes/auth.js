import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
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

const doctorSignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).max(100),
  hospital_id: z.string().uuid(),
  specialty: z.string().min(2).max(100),
  experience_years: z.number().int().min(0).max(60),
  license_number: z.string().min(2).max(100),
  bio: z.string().max(1000).optional(),
});

// Public: list approved hospitals (used in doctor registration form)
router.get('/hospitals', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .select('id, name, city')
      .eq('status', 'approved')
      .order('name');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ hospitals: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
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

    // Use a fresh client per request so signInWithPassword never pollutes
    // the supabaseAdmin singleton's session state (which would switch
    // subsequent DB calls from service-role key → user JWT, breaking RLS bypass)
    const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
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

    const refreshClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await refreshClient.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Invalid refresh token' });

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Sign up (doctor)
router.post('/signup/doctor', validate(doctorSignUpSchema), async (req, res) => {
  try {
    const { email, password, full_name, hospital_id, specialty, experience_years, license_number, bio } = req.validated;

    // Verify the hospital exists and is approved
    const { data: hospital, error: hospitalErr } = await supabaseAdmin
      .from('hospitals')
      .select('id, name')
      .eq('id', hospital_id)
      .eq('status', 'approved')
      .single();
    if (hospitalErr || !hospital) {
      return res.status(400).json({ error: 'Selected hospital not found or not approved' });
    }

    // Create auth user — role stays as default until hospital approves
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'patient' },
    });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user.id;

    // Create doctor record with pending status
    const { error: docError } = await supabaseAdmin
      .from('doctors')
      .insert({
        profile_id: userId,
        hospital_id,
        specialty,
        experience_years,
        license_number,
        bio: bio || '',
        status: 'pending',
        approved_by_hospital: false,
      });

    if (docError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: docError.message });
    }

    res.status(201).json({ message: 'Doctor registration submitted. Awaiting hospital approval.' });
  } catch (err) {
    console.error('Doctor signup error:', err);
    res.status(500).json({ error: 'Failed to register doctor' });
  }
});

export default router;
