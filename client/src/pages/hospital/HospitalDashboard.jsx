import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { Stethoscope, Users, CalendarDays, DollarSign, TrendingUp, FlaskConical } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function HospitalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hospital/dashboard').then(res => setData(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const s = data?.summary || {};
  const cards = [
    { title: 'Approved Doctors', value: s.doctorCount || 0, icon: Stethoscope, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Total Staff', value: s.staffCount || 0, icon: Users, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Appointments', value: s.appointmentCount || 0, icon: CalendarDays, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { title: 'Total Revenue', value: formatCurrency(s.totalEarnings || 0), icon: DollarSign, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
    { title: 'Hospital Profit', value: formatCurrency(s.totalHospitalProfit || 0), icon: TrendingUp, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
    { title: 'Platform Fee', value: formatCurrency(s.totalAdminCut || 0), icon: FlaskConical, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  const hospitalStatus = data?.hospital?.status;

  return (
    <div className="space-y-6">
      {hospitalStatus === 'pending' && (
        <div className="rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">Awaiting Admin Approval</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
              Your hospital registration is under review. You will gain full access once a VoxMed admin approves your hospital.
            </p>
          </div>
        </div>
      )}
      {hospitalStatus === 'rejected' && (
        <div className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Registration Rejected</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              Your hospital registration was rejected. Please contact VoxMed support for more information.
            </p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Hospital Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your hospital overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.monthly?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.monthly.slice(0, 6).map(m => (
                <div key={m.month} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b last:border-0">
                  <span className="font-medium">{m.month}</span>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>Revenue: <strong>{formatCurrency(m.revenue)}</strong></span>
                    <span className="text-primary">Profit: <strong>{formatCurrency(m.profit)}</strong></span>
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
