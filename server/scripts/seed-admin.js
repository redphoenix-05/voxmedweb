/**
 * One-time script to create the VoxMed Super Admin account.
 * Run from the server/ directory:
 *   node scripts/seed-admin.js
 *
 * Edit the credentials below before running.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── EDIT THESE ────────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@voxmed.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME     = 'VoxMed Admin';
// ─────────────────────────────────────────────────────────────

async function seedAdmin() {
  console.log(`Creating VoxMed admin: ${ADMIN_EMAIL} …`);

  // 1. Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (existing) {
    if (existing.role === 'admin') {
      console.log('Admin already exists, nothing to do.');
    } else {
      // User exists but wrong role — update it
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin', full_name: ADMIN_NAME })
        .eq('id', existing.id);
      console.log(`Updated existing user ${ADMIN_EMAIL} to role=admin.`);
    }
    return;
  }

  // 2. Create auth user — omit role in metadata so the trigger defaults to 'patient'
  //    We'll update the role to 'admin' manually right after.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (error) {
    console.error('Failed to create auth user:', error.message);
    console.error('');
    console.error('If this is a "Database error creating new user" — the cloud DB trigger');
    console.error('may be rejecting the insert. Run the following SQL in the Supabase');
    console.error('SQL Editor (https://supabase.com/dashboard) as a fallback:');
    console.error('');
    console.error("-- Add 'admin' to user_role enum if missing:");
    console.error("ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';");
    console.error('');
    process.exit(1);
  }

  const userId = data.user.id;
  console.log(`Auth user created: ${userId}`);

  // 3. Give the trigger a moment to create the profiles row
  await new Promise(r => setTimeout(r, 1500));

  // 4. Update profile role to 'admin'
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin', full_name: ADMIN_NAME })
    .eq('id', userId);

  if (profileError) {
    console.error('');
    console.error('Auth user was created but profile role update failed:', profileError.message);
    console.error("The cloud DB user_role enum probably does not include 'admin'.");
    console.error('Run this in the Supabase SQL Editor to fix it:');
    console.error('');
    console.error("ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';");
    console.error(`UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';`);
    process.exit(1);
  }

  console.log('');
  console.log('VoxMed Admin created successfully!');
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('  Change the password after first login.');
}

seedAdmin().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
