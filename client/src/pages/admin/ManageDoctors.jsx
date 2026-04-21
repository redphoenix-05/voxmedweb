import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { Check, X, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDoctors(); }, [filter]);

  const loadDoctors = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/doctors${params}`);
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'delete') {
        if (!confirm('Delete this doctor?')) return;
        await api.delete(`/admin/doctors/${id}`);
      } else {
        await api.patch(`/admin/doctors/${id}/${action}`);
      }
      loadDoctors();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const statusBadge = (status) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'destructive' };
    return <Badge variant={map[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Doctors</h1>
          <p className="text-muted-foreground mt-1">{doctors.length} doctors total</p>
        </div>
        <Select className="w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No doctors found</TableCell>
                </TableRow>
              ) : (
                doctors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.profiles?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{d.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{d.specialty}</TableCell>
                    <TableCell>{d.hospitals?.name || 'Unassigned'}</TableCell>
                    <TableCell>{d.license_number}</TableCell>
                    <TableCell>{d.experience_years} yrs</TableCell>
                    <TableCell>{statusBadge(d.status)}</TableCell>
                    <TableCell>{formatDate(d.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {d.status === 'pending' && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleAction(d.id, 'approve')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleAction(d.id, 'reject')}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleAction(d.id, 'delete')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
