import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Building2, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    hospital_name: '',
    hospital_location: '',
    email: '',
    license_number: '',
    emergency_phone: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await signup({
        email: form.email,
        password: form.password,
        full_name: form.hospital_name,
        role: 'hospital_admin',
        hospital_name: form.hospital_name,
        hospital_location: form.hospital_location,
        license_number: form.license_number,
        emergency_phone: form.emergency_phone,
      });
      navigate('/login', { state: { message: 'Hospital registered! Please sign in.' } });
    } catch (err) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : raw?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Activity className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            VoxMed Connect
          </h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Register Hospital</CardTitle>
            <CardDescription>Create a hospital admin account on VoxMed Connect</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="hospital_name">Hospital Name</Label>
                <Input id="hospital_name" name="hospital_name" placeholder="City General Hospital" value={form.hospital_name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital_location">Hospital Location</Label>
                <Input id="hospital_location" name="hospital_location" placeholder="123 Main Street, Dhaka" value={form.hospital_location} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Hospital Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="info@hospital.com" value={form.email} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">Hospital License No.</Label>
                <Input id="license_number" name="license_number" placeholder="LIC-2024-XXXXX" value={form.license_number} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Emergency / Phone Number</Label>
                <Input id="emergency_phone" name="emergency_phone" type="tel" placeholder="+880 1234-567890" value={form.emergency_phone} onChange={handleChange} required />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input id="confirm_password" name="confirm_password" type="password" placeholder="Repeat your password" value={form.confirm_password} onChange={handleChange} required minLength={6} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register Hospital
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
