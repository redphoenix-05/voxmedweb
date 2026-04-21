import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // In serverless environments calling process.exit() crashes the function and
  // causes Vercel to return an opaque error. Log the warning instead and let
  // individual DB calls fail with a clear message.
  console.error('Missing Supabase environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Public client (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseAdmin;
