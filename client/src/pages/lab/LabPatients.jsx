import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageLoader } from '@/components/ui/spinner';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function LabPatients() {
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      const { data } = await api.get('/lab/patients');
      setPatients(data.patients || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadRecords = async (patientId) => {
    setSelectedPatient(patientId);
    try {
      const { data } = await api.get(`/lab/records?patient_id=${patientId}`);
      setRecords(data.records || []);
    } catch (err) { console.error(err); }
  };

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lab Patients</h1>
        <p className="text-muted-foreground mt-1">View patients and their records</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No patients</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className={selectedPatient === p.id ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-sm">{p.email}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={selectedPatient === p.id ? 'default' : 'outline'} onClick={() => loadRecords(p.id)}>
                        Records
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedPatient && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-lg">Medical Records</h3>
              {records.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No records found</p>
              ) : records.map(r => (
                <div key={r.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{r.test_type || 'General'}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.diagnosis && <p className="text-sm"><span className="font-medium">Diagnosis:</span> {r.diagnosis}</p>}
                  {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
                  {r.report_url && <a href={r.report_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">View Report</a>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
