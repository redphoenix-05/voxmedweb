import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('admin'));

// Revenue overview
router.get('/', async (req, res) => {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('amount, admin_profit, hospital_profit, hospital_id, created_at, status')
      .eq('status', 'paid');

    if (error) return res.status(400).json({ error: error.message });

    const totalEarnings = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalAdminProfit = payments.reduce((sum, p) => sum + parseFloat(p.admin_profit), 0);
    const totalHospitalProfit = payments.reduce((sum, p) => sum + parseFloat(p.hospital_profit), 0);

    // Monthly breakdown
    const monthly = {};
    payments.forEach(p => {
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      if (!monthly[month]) monthly[month] = { revenue: 0, admin_profit: 0, hospital_profit: 0 };
      monthly[month].revenue += parseFloat(p.amount);
      monthly[month].admin_profit += parseFloat(p.admin_profit);
      monthly[month].hospital_profit += parseFloat(p.hospital_profit);
    });

    // Per-hospital breakdown
    const hospitalRevenue = {};
    payments.forEach(p => {
      if (!hospitalRevenue[p.hospital_id]) hospitalRevenue[p.hospital_id] = { revenue: 0, admin_cut: 0 };
      hospitalRevenue[p.hospital_id].revenue += parseFloat(p.amount);
      hospitalRevenue[p.hospital_id].admin_cut += parseFloat(p.admin_profit);
    });

    res.json({
      summary: { totalEarnings, totalAdminProfit, totalHospitalProfit },
      monthly: Object.entries(monthly).map(([month, data]) => ({ month, ...data })).sort((a, b) => b.month.localeCompare(a.month)),
      byHospital: hospitalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

export default router;
