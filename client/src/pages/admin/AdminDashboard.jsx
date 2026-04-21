import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { Building2, Stethoscope, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [hospitalsRes, doctorsRes, usersRes, revenueRes] = await Promise.all([
        api.get('/admin/hospitals'),
        api.get('/admin/doctors'),
        api.get('/admin/users?limit=1'),
        api.get('/admin/revenue'),
      ]);
      setStats({
        hospitals: hospitalsRes.data.hospitals?.length || 0,
        pendingHospitals: hospitalsRes.data.hospitals?.filter(h => h.status === 'pending').length || 0,
        doctors: doctorsRes.data.doctors?.length || 0,
        pendingDoctors: doctorsRes.data.doctors?.filter(d => d.status === 'pending').length || 0,
        users: usersRes.data.total || 0,
        revenue: revenueRes.data.summary || {},
        monthly: revenueRes.data.monthly || [],
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  const cards = [
    { title: 'Total Hospitals', value: stats?.hospitals || 0, subtitle: `${stats?.pendingHospitals || 0} pending`, icon: Building2, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Total Doctors', value: stats?.doctors || 0, subtitle: `${stats?.pendingDoctors || 0} pending`, icon: Stethoscope, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { title: 'Total Users', value: stats?.users || 0, subtitle: 'All registered', icon: Users, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Total Revenue', value: formatCurrency(stats?.revenue?.totalEarnings || 0), subtitle: 'All time', icon: DollarSign, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
    { title: 'Admin Profit (10%)', value: formatCurrency(stats?.revenue?.totalAdminProfit || 0), subtitle: 'Platform cut', icon: TrendingUp, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
    { title: 'Hospital Revenue', value: formatCurrency(stats?.revenue?.totalHospitalProfit || 0), subtitle: 'Hospital share', icon: Activity, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of VoxMed Connect platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly revenue */}
      {stats?.monthly?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthly.slice(0, 6).map((m) => (
                <div key={m.month} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{m.month}</span>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>Revenue: <strong>{formatCurrency(m.revenue)}</strong></span>
                    <span className="text-primary">Admin: <strong>{formatCurrency(m.admin_profit)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
