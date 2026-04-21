import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function HospitalProfit() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hospital/dashboard').then(res => setData(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profit Dashboard</h1>
        <p className="text-muted-foreground mt-1">Financial analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">{formatCurrency(s.totalEarnings || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hospital Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(s.totalHospitalProfit || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Activity className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Fee</p>
              <p className="text-2xl font-bold">{formatCurrency(s.totalAdminCut || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {data?.monthly?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Monthly Analytics</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthly.map(m => (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">{m.month}</span>
                  <div className="flex-1">
                    <div className="h-6 bg-muted rounded-full overflow-hidden flex">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min((m.profit / (m.revenue || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right text-sm min-w-[120px]">
                    <span className="text-muted-foreground">Rev: </span>
                    <span className="font-semibold">{formatCurrency(m.revenue)}</span>
                  </div>
                  <div className="text-right text-sm min-w-[120px]">
                    <span className="text-muted-foreground">Profit: </span>
                    <span className="font-semibold text-primary">{formatCurrency(m.profit)}</span>
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
