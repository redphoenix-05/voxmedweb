import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { Trash2, UserX, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, [filter, page]);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (filter) params.set('role', filter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const roleBadge = (role) => {
    const colors = {
      admin: 'default', hospital_admin: 'secondary', doctor: 'success',
      receptionist: 'outline', lab_staff: 'outline', patient: 'secondary',
    };
    return <Badge variant={colors[role] || 'secondary'}>{role?.replace('_', ' ')}</Badge>;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground mt-1">{total} users total</p>
        </div>
        <Select className="w-44" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hospital_admin">Hospital Admin</option>
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="lab_staff">Lab Staff</option>
          <option value="patient">Patient</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || '-'}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_active !== false ? 'success' : 'destructive'}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(u.id)} title={u.is_active !== false ? 'Deactivate' : 'Activate'}>
                          {u.is_active !== false ? <UserX className="h-4 w-4 text-yellow-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {total > 50 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={users.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
