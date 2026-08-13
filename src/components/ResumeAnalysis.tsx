import { useState, useEffect } from 'react';
import { FileCheck, ShieldAlert, Zap, BookOpen, Loader2 } from 'lucide-react';

export default function ResumeAnalysis({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const token = localStorage.getItem('traineer_uid');
        const res = await fetch(`/api/session/${session.id}/resume-analysis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [session.id]);

  const handleNext = async () => {
    setTransitioning(true);
    try {
      const token = localStorage.getItem('traineer_uid');
      const res = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: 'instructions', version: session.version })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        onNext(updatedSession);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto text-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Loading your profile analysis...</h2>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-[800px] mx-auto text-center py-20">
        <p className="text-red-500">Failed to load analysis.</p>
        <button onClick={handleNext} className="mt-4 text-blue-600 underline">Continue anyway</button>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">AI Resume Intelligence</h1>
      <p className="text-slate-500 mb-8">We've parsed your profile. Your interview will be adapted based on this data.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center mb-3 border-blue-500 text-blue-600 font-bold text-xl">
            {analysis.atsScore}
          </div>
          <h3 className="font-semibold text-slate-900">ATS Score</h3>
          <p className="text-xs text-slate-500 mt-1">Industry Benchmark</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Identified Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths?.slice(0, 3).map((s: string, i: number) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Areas for Discussion
          </h3>
          <ul className="space-y-2">
            {analysis.weaknesses?.slice(0, 3).map((w: string, i: number) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Missing Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords?.map((k: string, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={transitioning}
          className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
        >
          {transitioning ? 'Preparing Interview...' : 'Continue to Instructions'}
        </button>
      </div>
    </div>
  );
}
