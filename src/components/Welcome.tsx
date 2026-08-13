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
        const token = localStorage.getItem('traineer_uid');
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
              message: "Welcome to Traineer! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
              checklist: ["Camera and Microphone required", "Find a quiet space"]
            });
          }
        }
      } catch (e) {
        if (isMounted) {
          setAiData({
            message: "Welcome to Traineer! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
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
      const token = localStorage.getItem('traineer_uid');
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
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Welcome to Traineer, {candidate.name.split(' ')[0]}</h1>
      <div className="flex items-center gap-2 text-slate-500 mb-8">
        <Clock className="w-4 h-4" />
        <span>Estimated time: 60-90 minutes</span>
      </div>
      
      {loadingMessage ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-8 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        </div>
      ) : aiData ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 shadow-sm mb-8">
          <p className="whitespace-pre-line text-slate-800 text-lg mb-6 leading-relaxed">
            {aiData.message}
          </p>
          {aiData.checklist && aiData.checklist.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Before we begin:</h3>
              <ul className="space-y-2">
                {aiData.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
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
        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingStart ? 'Starting...' : 'CONTINUE TO POLICY'}
      </button>
    </div>
  );
}
