import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageLoader } from '@/components/ui/spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function HospitalTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // null | 'add' | test object for edit
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '', hospital_profit_percent: '90', admin_profit_percent: '10' });

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const { data } = await api.get('/hospital/tests');
      setTests(data.tests || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm({ name: '', description: '', category: '', price: '', hospital_profit_percent: '90', admin_profit_percent: '10' });
    setDialog('add');
  };

  const openEdit = (test) => {
    setForm({
      name: test.name, description: test.description || '', category: test.category || '',
      price: test.price.toString(), hospital_profit_percent: test.hospital_profit_percent.toString(),
      admin_profit_percent: test.admin_profit_percent.toString(),
    });
    setDialog(test);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), hospital_profit_percent: parseFloat(form.hospital_profit_percent), admin_profit_percent: parseFloat(form.admin_profit_percent) };
    try {
      if (dialog === 'add') {
        await api.post('/hospital/tests', payload);
      } else {
        await api.patch(`/hospital/tests/${dialog.id}`, payload);
      }
      setDialog(null);
      loadTests();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this test?')) return;
    try {
      await api.delete(`/hospital/tests/${id}`);
      loadTests();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Medical Tests</h1>
          <p className="text-muted-foreground mt-1">{tests.length} tests configured</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Test</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Hospital %</TableHead>
                <TableHead>Admin %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tests configured</TableCell></TableRow>
              ) : tests.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{t.category || '-'}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(t.price)}</TableCell>
                  <TableCell>{t.hospital_profit_percent}%</TableCell>
                  <TableCell>{t.admin_profit_percent}%</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${t.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)}>
        <DialogHeader><DialogTitle>{dialog === 'add' ? 'Add Test' : 'Edit Test'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Test Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Blood, Radiology" /></div>
          <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Hospital Profit %</Label><Input type="number" value={form.hospital_profit_percent} onChange={e => setForm(f => ({ ...f, hospital_profit_percent: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Admin Profit %</Label><Input type="number" value={form.admin_profit_percent} onChange={e => setForm(f => ({ ...f, admin_profit_percent: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit">{dialog === 'add' ? 'Add Test' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
