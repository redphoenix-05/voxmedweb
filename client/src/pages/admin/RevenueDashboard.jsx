import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { DollarSign, TrendingUp, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function RevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue').then(res => {
      setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const { summary = {}, monthly = [] } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform earnings & analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalEarnings || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin Profit (10%)</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalAdminProfit || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hospital Share</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalHospitalProfit || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No revenue data yet</p>
          ) : (
            <div className="space-y-4">
              {monthly.map((m) => (
                <div key={m.month} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{m.month}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">{formatCurrency(m.revenue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Admin Cut</p>
                      <p className="font-semibold text-primary">{formatCurrency(m.admin_profit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Hospital</p>
                      <p className="font-semibold">{formatCurrency(m.hospital_profit)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
