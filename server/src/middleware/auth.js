import { supabaseAdmin } from '../lib/supabase.js';

// Verify JWT and attach user to request
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    req.user = { ...user, profile };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Role-based access control
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.profile?.role) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!allowedRoles.includes(req.user.profile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Get hospital_id for hospital staff
export async function attachHospital(req, res, next) {
  const { role } = req.user.profile;

  if (role === 'hospital_admin') {
    const { data } = await supabaseAdmin
      .from('hospital_staff')
      .select('hospital_id')
      .eq('profile_id', req.user.id)
      .eq('role', 'admin')
      .single();

    if (!data) {
      return res.status(403).json({ error: 'No hospital found for this admin' });
    }
    req.hospitalId = data.hospital_id;
  } else if (role === 'receptionist' || role === 'lab_staff') {
    const staffRole = role === 'lab_staff' ? 'lab' : 'receptionist';
    const { data } = await supabaseAdmin
      .from('hospital_staff')
      .select('hospital_id')
      .eq('profile_id', req.user.id)
      .eq('role', staffRole)
      .single();

    if (!data) {
      return res.status(403).json({ error: 'Staff not assigned to any hospital' });
    }
    req.hospitalId = data.hospital_id;
  }

  next();
}
