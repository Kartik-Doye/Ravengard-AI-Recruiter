import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Settings, BarChart, Loader2 } from 'lucide-react';
import { getAccessToken, googleSignIn } from '../lib/firebase';

export default function ResumeUpload({ session, onNext }: { session: any, onNext: (session: any, text?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        alert("File must be less than 5MB");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('traineer_uid');
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
        onNext(data.session, data.resumeText);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to upload resume");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-semibold mb-2 text-slate-900">Processing your profile...</h1>
        <p className="text-slate-500 mb-8">Our AI engine is currently parsing your resume.</p>
        <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm max-w-[600px] mx-auto space-y-6">
          <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-4/6 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Upload your professional profile</h1>
      <p className="text-slate-500 mb-8">Our AI engine parses your resume to build a custom technical interview roadmap tailored to your specific stack and experience level.</p>
      
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm max-w-[600px] mx-auto">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-10 bg-slate-50 mb-6 transition-colors hover:border-blue-600 cursor-pointer group"
        >
          {file ? (
            <div className="flex flex-col items-center">
              <FileText className="w-10 h-10 text-blue-600 mb-4" />
              <p className="text-slate-900 font-medium">{file.name}</p>
              <p className="text-slate-500 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mx-auto mb-4" />
              <h3 className="text-slate-900 font-medium mb-2">Click to upload or drag and drop</h3>
              <p className="text-slate-500 text-sm">Supported formats: PDF, DOCX (Max 5MB)</p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Uploading & Processing...' : 'Analyze Resume'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10 max-w-[800px] mx-auto">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4 items-start shadow-sm">
          <div className="bg-slate-100 p-2.5 rounded-lg text-blue-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-1">Parsing Engine</h4>
            <p className="text-sm text-slate-500 m-0">Extracting skills, projects, and tech stack markers automatically.</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4 items-start shadow-sm">
          <div className="bg-slate-100 p-2.5 rounded-lg text-blue-600">
            <BarChart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-1">ATS Calibration</h4>
            <p className="text-sm text-slate-500 m-0">Benchmarking your profile against industry-standard requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
