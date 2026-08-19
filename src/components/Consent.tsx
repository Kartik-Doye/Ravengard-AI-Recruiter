import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function Consent({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Use a hardcoded version as required by the spec
  const POLICY_VERSION = "v1.1-strict";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (inputText !== "I Agree") {
      setError("You must type exactly 'I Agree' to continue.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session.id}/policy-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText, policyVersion: POLICY_VERSION })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        onNext(data.session);
      } else {
        setError(data.error || "Failed to record consent. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-semibold text-slate-900">Policy & Consent</h1>
      </div>
      <p className="text-slate-500 mb-8">Please review and agree to our data usage and privacy policies before beginning your assessment.</p>
        
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-8 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Privacy & Data Retention Policy ({POLICY_VERSION})</h3>
        </div>
        <div className="p-6 text-sm text-slate-700 space-y-4">
          <p>
            <strong>What we collect:</strong> Ravengard AI Recruiter collects your registration details, resume (PDF/DOCX), and records your voice and video via your browser during the assessment.
          </p>
          <p>
            <strong>Why it is needed:</strong> Your data is used exclusively to conduct the mock AI interview, evaluate your responses, and generate your personalized evaluation report.
          </p>
          <p>
            <strong>Data Retention:</strong> 
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong>Raw Media:</strong> Audio and video recordings are <strong>deleted after 30 days</strong>.</li>
              <li><strong>Transcripts & Reports:</strong> Text transcripts, extracted resume data, and generated reports are retained for up to 1 year for auditing purposes.</li>
            </ul>
          </p>
          <p>
            <strong>Permissions:</strong> Camera and Microphone access are strictly required to proceed.
          </p>
          <p>
            <strong>Agreement:</strong> By continuing, you confirm that you agree to these stated rules.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-slate-900 mb-4">Explicit Agreement Required</h3>
        <p className="text-sm text-slate-600 mb-4">
          To verify your consent, please type exactly <strong>I Agree</strong> in the box below.
        </p>

        <form onSubmit={handleConfirm} className="flex flex-col space-y-4">
          <input 
            type="text" 
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
            placeholder="I Agree"
            className={`px-4 py-3 border rounded-md focus:outline-none focus:ring-2 text-sm ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500 disabled:bg-slate-100'}`}
          />
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-start"
          >
            {loading ? 'Recording Consent...' : 'CONFIRM CONSENT'}
          </button>
        </form>
      </div>
    </div>
  );
}
