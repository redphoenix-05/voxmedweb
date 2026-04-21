import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function HospitalReports() {
  const [patientId, setPatientId] = useState('');
  const [recordId, setRecordId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientId) return;

    const formData = new FormData();
    formData.append('report', file);
    formData.append('patient_id', patientId);
    if (recordId) formData.append('record_id', recordId);

    setUploading(true);
    try {
      const { data } = await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Upload Reports</h1>
        <p className="text-muted-foreground mt-1">Upload patient medical reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Upload Report</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Patient UUID" required />
              </div>
              <div className="space-y-2">
                <Label>Record ID (optional)</Label>
                <Input value={recordId} onChange={e => setRecordId(e.target.value)} placeholder="Link to existing record" />
              </div>
              <div className="space-y-2">
                <Label>Report File</Label>
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
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={uploading || !file}>
                {uploading ? 'Uploading...' : 'Upload Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">Upload Successful</h3>
              <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm mt-2 hover:underline">
                View Report
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
