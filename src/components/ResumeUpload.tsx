import React, { useState } from 'react';
import { Settings, BarChart } from 'lucide-react';
import { Upload } from './ui/Upload';
import { Button } from './ui/Button';
import { Card, CardBody } from './ui/Card';

export default function ResumeUpload({ session, onNext }: { session: any, onNext: (session: any, text?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
      setError("Invalid file type. Only .pdf and .docx are supported.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }
    setFile(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const formData = new FormData();
      formData.append('resume', file);
      
      const res = await fetch(`/api/session/${session.id}/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        
        const stageRes = await fetch(`/api/session/${session.id}/stage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ stage: 'pre_flight', version: data.session.version })
        });
        
        if (stageRes.ok) {
          const updatedSession = await stageRes.json();
          onNext(updatedSession);
        } else {
          setError("Failed to advance to the next phase.");
        }
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to upload resume");
      }
    } catch (error) {
      console.error(error);
      setError("A network error occurred while uploading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-white">Professional Profile</h1>
      <p className="text-white/50 mb-10">Upload your resume to calibrate the analysis engine.</p>
      
      <Card variant="glass" padding="lg" className="mb-8">
        <CardBody className="flex flex-col">
          <Upload
            file={file}
            onFileSelect={handleFileSelect}
            onClear={handleClear}
            loading={loading}
            error={error}
            accept=".pdf,.docx"
            label="Resume Document"
            helpText="Click to upload or drag and drop"
            className="mb-8"
          />
          
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              isLoading={loading}
            >
              Upload & Continue
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel border border-white/5 p-5 rounded-xl flex gap-4 items-start">
          <div className="bg-[var(--color-primary)]/10 p-2.5 rounded-lg text-[var(--color-primary)] shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-white mb-1">Parsing Engine</h4>
            <p className="text-xs text-white/50 leading-relaxed">Extracting skills, projects, and tech stack markers automatically.</p>
          </div>
        </div>
        <div className="glass-panel border border-white/5 p-5 rounded-xl flex gap-4 items-start">
          <div className="bg-[var(--color-primary)]/10 p-2.5 rounded-lg text-[var(--color-primary)] shrink-0">
            <BarChart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-white mb-1">ATS Calibration</h4>
            <p className="text-xs text-white/50 leading-relaxed">Benchmarking your profile against industry-standard requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
