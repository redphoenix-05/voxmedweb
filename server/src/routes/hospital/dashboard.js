import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('hospital_admin'), attachHospital);

// Hospital profit dashboard
router.get('/', async (req, res) => {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('amount, admin_profit, hospital_profit, test_id, created_at, status')
      .eq('hospital_id', req.hospitalId)
      .eq('status', 'paid');

    if (error) return res.status(400).json({ error: error.message });

    const totalEarnings = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalHospitalProfit = payments.reduce((sum, p) => sum + parseFloat(p.hospital_profit), 0);
    const totalAdminCut = payments.reduce((sum, p) => sum + parseFloat(p.admin_profit), 0);

    // Monthly
    const monthly = {};
    payments.forEach(p => {
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      if (!monthly[month]) monthly[month] = { revenue: 0, profit: 0 };
      monthly[month].revenue += parseFloat(p.amount);
      monthly[month].profit += parseFloat(p.hospital_profit);
    });

    // Per test
    const perTest = {};
    payments.forEach(p => {
      if (p.test_id) {
        if (!perTest[p.test_id]) perTest[p.test_id] = { count: 0, revenue: 0, profit: 0 };
        perTest[p.test_id].count++;
        perTest[p.test_id].revenue += parseFloat(p.amount);
        perTest[p.test_id].profit += parseFloat(p.hospital_profit);
      }
    });

    // Counts
    const { count: doctorCount } = await supabaseAdmin
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', req.hospitalId)
      .eq('status', 'approved');

    const { count: appointmentCount } = await supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', req.hospitalId);

    const { count: staffCount } = await supabaseAdmin
      .from('hospital_staff')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', req.hospitalId);

    res.json({
      summary: { totalEarnings, totalHospitalProfit, totalAdminCut, doctorCount, appointmentCount, staffCount },
      monthly: Object.entries(monthly).map(([month, data]) => ({ month, ...data })).sort((a, b) => b.month.localeCompare(a.month)),
      perTest,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
