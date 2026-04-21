import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageLoader } from '@/components/ui/spinner';
import { Check, X, Settings, Clock } from 'lucide-react';
import api from '@/lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HospitalDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignDialog, setAssignDialog] = useState(null);
  const [scheduleDialog, setScheduleDialog] = useState(null);
  const [assignForm, setAssignForm] = useState({ room_number: '', department_id: '', consultation_fee: '' });
  const [scheduleForm, setScheduleForm] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00', max_patients: 20 });

  useEffect(() => { loadDoctors(); }, [filter]);

  const loadDoctors = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/hospital/doctors${params}`);
      setDoctors(data.doctors || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApproval = async (id, action) => {
    try {
      await api.patch(`/hospital/doctors/${id}/${action}`);
      loadDoctors();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleAssign = async () => {
    try {
      const updates = {};
      if (assignForm.room_number) updates.room_number = assignForm.room_number;
      if (assignForm.consultation_fee) updates.consultation_fee = parseFloat(assignForm.consultation_fee);
      await api.patch(`/hospital/doctors/${assignDialog}/assign`, updates);
      setAssignDialog(null);
      loadDoctors();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleSchedule = async () => {
    try {
      await api.post(`/hospital/doctors/${scheduleDialog}/schedule`, {
        ...scheduleForm,
        day_of_week: parseInt(scheduleForm.day_of_week),
        max_patients: parseInt(scheduleForm.max_patients),
      });
      setScheduleDialog(null);
      loadDoctors();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Doctor Management</h1>
          <p className="text-muted-foreground mt-1">{doctors.length} doctors</p>
        </div>
        <Select className="w-40" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{d.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{d.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{d.specialty}</TableCell>
                  <TableCell>{d.room_number || '-'}</TableCell>
                  <TableCell>${d.consultation_fee || 0}</TableCell>
                  <TableCell><Badge variant={d.status === 'approved' ? 'success' : d.status === 'pending' ? 'warning' : 'destructive'}>{d.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {d.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleApproval(d.id, 'approve')}><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleApproval(d.id, 'reject')}><X className="h-4 w-4" /></Button>
                        </>
                      )}
                      {d.status === 'approved' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setAssignDialog(d.id); setAssignForm({ room_number: d.room_number || '', consultation_fee: d.consultation_fee || '' }); }}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScheduleDialog(d.id)}>
                            <Clock className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onClose={() => setAssignDialog(null)}>
        <DialogHeader><DialogTitle>Assign Doctor</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input value={assignForm.room_number} onChange={e => setAssignForm(f => ({ ...f, room_number: e.target.value }))} placeholder="e.g. 301A" />
          </div>
          <div className="space-y-2">
            <Label>Consultation Fee ($)</Label>
            <Input type="number" value={assignForm.consultation_fee} onChange={e => setAssignForm(f => ({ ...f, consultation_fee: e.target.value }))} placeholder="0.00" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
          <Button onClick={handleAssign}>Save</Button>
        </DialogFooter>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleDialog} onClose={() => setScheduleDialog(null)}>
        <DialogHeader><DialogTitle>Set Schedule</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={scheduleForm.day_of_week} onChange={e => setScheduleForm(f => ({ ...f, day_of_week: e.target.value }))}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Max Patients</Label>
            <Input type="number" value={scheduleForm.max_patients} onChange={e => setScheduleForm(f => ({ ...f, max_patients: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setScheduleDialog(null)}>Cancel</Button>
          <Button onClick={handleSchedule}>Save Schedule</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
