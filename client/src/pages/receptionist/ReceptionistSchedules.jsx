import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageLoader } from '@/components/ui/spinner';
import { Calendar, Clock, Users } from 'lucide-react';
import api from '@/lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ReceptionistSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState('');

  useEffect(() => { loadSchedules(); }, [dayFilter]);

  const loadSchedules = async () => {
    try {
      const params = dayFilter ? `?day=${dayFilter}` : '';
      const { data } = await api.get(`/receptionist/schedules${params}`);
      setSchedules(data.schedules || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Doctor Schedules</h1>
          <p className="text-muted-foreground mt-1">View available doctors and their schedules</p>
        </div>
        <Select className="w-40" value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
          <option value="">All Days</option>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
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
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Max Patients</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No schedules found</TableCell></TableRow>
              ) : schedules.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.doctors?.profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell>{s.doctors?.specialization || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1 inline" />
                      {DAYS[s.day_of_week]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" /> {s.start_time} - {s.end_time}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3" /> {s.max_patients}
                    </span>
                  </TableCell>
                  <TableCell>{s.doctors?.room_number || '-'}</TableCell>
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
