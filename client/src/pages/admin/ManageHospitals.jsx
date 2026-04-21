import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { Check, X, Trash2, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function ManageHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHospitals(); }, [filter]);

  const loadHospitals = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/hospitals${params}`);
      setHospitals(data.hospitals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'delete') {
        if (!confirm('Delete this hospital? This cannot be undone.')) return;
        await api.delete(`/admin/hospitals/${id}`);
      } else {
        await api.patch(`/admin/hospitals/${id}/${action}`);
      }
      loadHospitals();
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
          <h1 className="text-3xl font-bold">Manage Hospitals</h1>
          <p className="text-muted-foreground mt-1">{hospitals.length} hospitals total</p>
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
                <TableHead>Hospital</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>License</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hospitals found</TableCell>
                </TableRow>
              ) : (
                hospitals.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{h.profiles?.full_name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{h.license_number}</span>
                        {h.license_document_url && (
                          <a href={h.license_document_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-primary" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{h.city}, {h.state}</TableCell>
                    <TableCell>{statusBadge(h.status)}</TableCell>
                    <TableCell>{formatDate(h.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {h.status === 'pending' && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleAction(h.id, 'approve')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleAction(h.id, 'reject')}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleAction(h.id, 'delete')}>
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
