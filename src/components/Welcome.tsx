import { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function Welcome({ onNext, candidate }: { onNext: (session: any) => void, candidate: any }) {
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(true);
  const [aiData, setAiData] = useState<{ message: string, checklist?: string[] } | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const fetchAiMessage = async () => {
      try {
        const token = localStorage.getItem('ravengard_uid');
        const res = await fetch('/api/welcome-message', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAiData(data);
          }
        } else {
          if (isMounted) {
            setAiData({
              message: "Welcome to Ravengard AI Recruiter! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
              checklist: ["Camera and Microphone required", "Find a quiet space"]
            });
          }
        }
      } catch (e) {
        if (isMounted) {
          setAiData({
            message: "Welcome to Ravengard AI Recruiter! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
            checklist: ["Camera and Microphone required", "Find a quiet space"]
          });
        }
      } finally {
        if (isMounted) {
          setLoadingMessage(false);
        }
      }
    };
    fetchAiMessage();
    return () => { isMounted = false; };
  }, []);

  const handleStart = async () => {
    setLoadingStart(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ candidateId: candidate.id })
      });
      if (res.ok) {
        const session = await res.json();
        onNext(session);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStart(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-white">Welcome to Ravengard Intelligence Node, {candidate.name.split(' ')[0]}</h1>
      <div className="flex items-center gap-2 text-white/50 mb-8 font-mono text-xs tracking-wider">
        <Clock className="w-4 h-4 text-[var(--color-secondary)]" />
        <span>ESTIMATED TIME: 60-90 MINUTES</span>
      </div>
      
      {loadingMessage ? (
        <div className="glass-panel border border-white/5 rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-8 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
        </div>
      ) : aiData ? (
        <div className="glass-panel border border-[var(--color-primary)]/30 rounded-xl p-8 shadow-[0_0_30px_rgba(139,92,246,0.1)] mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50"></div>
          <p className="whitespace-pre-line text-white/90 text-lg mb-6 leading-relaxed">
            {aiData.message}
          </p>
          {aiData.checklist && aiData.checklist.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-[var(--color-secondary)] tracking-wider text-sm uppercase mb-4">Preparation Checklist</h3>
              <ul className="space-y-3">
                {aiData.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-white/80 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={handleStart}
        disabled={loadingMessage || loadingStart}
        className="bg-[var(--color-primary)] text-white font-semibold py-3 px-8 rounded-md hover:bg-violet-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)] tracking-wider"
      >
        {loadingStart ? 'INITIALIZING...' : 'CONTINUE TO POLICY'}
      </button>
    </div>
  );
}
