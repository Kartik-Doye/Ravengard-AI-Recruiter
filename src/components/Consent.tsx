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
      const res = await fetch(`/api/session/confirm-consent`, {
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
        <ShieldCheck className="w-8 h-8 text-[var(--color-secondary)]" />
        <h1 className="text-3xl font-semibold text-white">Policy & Consent</h1>
      </div>
      <p className="text-white/60 mb-8">Please review and agree to our data usage and privacy policies before beginning your assessment.</p>
        
      <div className="bg-[var(--color-bg-1)] border border-white/10 rounded-2xl shadow-xl mb-8 overflow-hidden">
        <div className="p-6 bg-white/[0.03] border-b border-white/10">
          <h3 className="font-semibold text-white text-base">Privacy & Data Retention Policy ({POLICY_VERSION})</h3>
        </div>
        <div className="p-6 text-sm text-white/80 space-y-4 leading-relaxed">
          <p>
            <strong className="text-white">What we collect:</strong> Ravengard AI Recruiter collects your registration details, resume (PDF/DOCX), and records your voice and video via your browser during the assessment.
          </p>
          <p>
            <strong className="text-white">Why it is needed:</strong> Your data is used exclusively to conduct the mock AI interview, evaluate your responses, and generate your personalized evaluation report.
          </p>
          <div>
            <strong className="text-white">Data Retention:</strong> 
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2 text-white/70">
              <li><strong className="text-white">Raw Media:</strong> Audio and video recordings are <strong className="text-white">deleted after 30 days</strong>.</li>
              <li><strong className="text-white">Transcripts & Reports:</strong> Text transcripts, extracted resume data, and generated reports are retained for up to 1 year for auditing purposes.</li>
            </ul>
          </div>
          <p>
            <strong className="text-white">Permissions:</strong> Camera and Microphone access are strictly required to proceed.
          </p>
          <p>
            <strong className="text-white">Agreement:</strong> By continuing, you confirm that you agree to these stated rules.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-bg-1)] border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
        <h3 className="font-semibold text-white mb-2">Explicit Agreement Required</h3>
        <p className="text-sm text-white/60 mb-4">
          To verify your consent, please type exactly <strong className="text-white font-semibold">I Agree</strong> in the box below.
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
            className={`px-4 py-3 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 text-base text-white placeholder-white/40 transition-colors ${
              error 
                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' 
                : 'border-white/20 focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)] disabled:opacity-50'
            }`}
          />
          
          {error && (
            <div className="flex items-center gap-2 text-[var(--color-error)] text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-8 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-start cursor-pointer shadow-md"
          >
            {loading ? 'Recording Consent...' : 'CONFIRM CONSENT'}
          </button>
        </form>
      </div>
    </div>
  );
}
