import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CheckCircle, Search } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import api from '@/lib/api';

export default function ReceptionistBook() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/receptionist/schedules')
      .then(({ data }) => setDoctors(data.doctors || []))
      .catch(() => {});
  }, []);

  const searchPatients = async () => {
    if (!search.trim()) return;
    try {
      const { data } = await api.get(`/receptionist/patients?q=${encodeURIComponent(search)}`);
      setPatients(data.patients || []);
    } catch (err) { console.error(err); }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return alert('Select a patient first');
    if (!form.appointment_date || !form.appointment_time) return alert('Select date and time');
    const start = new Date(`${form.appointment_date}T${form.appointment_time}`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    try {
      await api.post('/receptionist/book', {
        patient_id: selectedPatient.id,
        doctor_id: form.doctor_id,
        scheduled_start_at: start.toISOString(),
        scheduled_end_at: end.toISOString(),
        reason: form.reason,
      });
      setSuccess(true);
      setForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
      setSelectedPatient(null);
    } catch (err) { alert(err.response?.data?.error || 'Booking failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Book Appointment</h1>
        <p className="text-muted-foreground mt-1">Search patient and book appointment</p>
      </div>

      {success && (
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold">Appointment booked successfully!</p>
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setSuccess(false)}>Book another</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Find Patient</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPatients()} />
            <Button onClick={searchPatients}><Search className="h-4 w-4" /></Button>
          </div>

          {patients.length > 0 && (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map(p => (
                  <TableRow key={p.id} className={selectedPatient?.id === p.id ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.phone || '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={selectedPatient?.id === p.id ? 'default' : 'outline'} onClick={() => setSelectedPatient(p)}>
                        {selectedPatient?.id === p.id ? 'Selected' : 'Select'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <Card>
          <CardHeader><CardTitle>Appointment Details for {selectedPatient.full_name}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} required>
                  <option value="">Select a doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.profiles?.full_name} — {d.specialty}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.appointment_date} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for visit" />
              </div>
              <Button type="submit" className="w-full">Book Appointment</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
