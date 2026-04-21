import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function HospitalAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', status: '' });

  useEffect(() => { loadAppointments(); }, [filters]);

  const loadAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.status) params.set('status', filters.status);
      const { data } = await api.get(`/hospital/appointments?${params}`);
      setAppointments(data.appointments || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/hospital/appointments/${id}`, { status });
      loadAppointments();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const statusBadge = (status) => {
    const map = { scheduled: 'secondary', completed: 'success', cancelled: 'destructive', no_show: 'warning' };
    return <Badge variant={map[status] || 'secondary'}>{status?.replace('_', ' ')}</Badge>;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Appointments</h1>
        <p className="text-muted-foreground mt-1">{appointments.length} appointments</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Input type="date" className="w-44" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
        <Select className="w-40" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No appointments found</TableCell></TableRow>
              ) : appointments.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{a.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.profiles?.phone || a.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{a.doctors?.profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell>{formatDate(a.scheduled_start_at)}</TableCell>
                  <TableCell>{new Date(a.scheduled_start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell className="max-w-37.5 truncate">{a.reason || '-'}</TableCell>
                  <TableCell className="text-right">
                    {a.status === 'scheduled' && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'completed')}>Complete</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
