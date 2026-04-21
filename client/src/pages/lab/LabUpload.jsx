import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function LabUpload() {
  const [form, setForm] = useState({ patient_id: '', test_type: '', diagnosis: '', notes: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // Create record first
      const { data: record } = await api.post('/lab/records', {
        patient_id: form.patient_id,
        test_type: form.test_type || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
      });

      // Upload file if present
      if (file && record.record?.id) {
        const formData = new FormData();
        formData.append('report', file);
        formData.append('patient_id', form.patient_id);
        formData.append('record_id', record.record.id);
        await api.post('/reports/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess(true);
      setForm({ patient_id: '', test_type: '', diagnosis: '', notes: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upload Lab Report</h1>
        </div>
        <Card>
          <CardContent className="p-8 flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold">Record Created Successfully</h3>
            <p className="text-muted-foreground mt-2">The lab record has been saved.</p>
            <Button className="mt-6" onClick={() => setSuccess(false)}>Create Another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Lab Report</h1>
        <p className="text-muted-foreground mt-1">Create medical records and upload reports</p>
      </div>

      <Card>
        <CardHeader><CardTitle>New Lab Record</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient ID</Label>
              <Input value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} placeholder="Patient UUID" required />
            </div>
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Input value={form.test_type} onChange={e => setForm(f => ({ ...f, test_type: e.target.value }))} placeholder="e.g. Blood Test, X-Ray" />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Diagnosis notes" />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes" />
            </div>
            <div className="space-y-2">
              <Label>Report File (optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload report file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? 'Saving...' : 'Create Record'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
