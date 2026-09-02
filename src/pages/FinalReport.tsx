import { SmoothLoader } from '../components/layout/SmoothLoader';
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';

export default function FinalReport({ session }: { session: any }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem('ravengard_uid');
      try {
        let res = await fetch(`/api/interview/${session.id}/report`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 404) {
          // Generate it if it doesn't exist
          res = await fetch(`/api/interview/${session.id}/generate-report`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }

        const data = await res.json();
        if (data.success) {
          setReport(data.report);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [session.id]);

  
  if (loading || !report) {
    return <SmoothLoader isLoading={true} messages={["Fetching interview transcript...", "Evaluating competencies against rubric...", "Computing score breakdowns...", "Finalizing report..."]} />;
  }


  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-10 text-center">
        <div className="text-xs font-mono text-[var(--color-secondary)] mb-2 tracking-widest uppercase">
          Phase 6
        </div>
        <h2 className="text-4xl font-display text-white mb-2">Interview Complete</h2>
        <p className="text-white/60 font-light">Your session has concluded. Thank you for your time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-8 bg-white/5 border-white/10 md:col-span-1 text-center flex flex-col justify-center">
          <div className="text-sm text-white/50 mb-2 uppercase tracking-wider">Overall Score</div>
          <div className="text-6xl font-display text-[var(--color-secondary)]">{report.overallScore}</div>
        </Card>
        <Card className="p-8 bg-white/5 border-white/10 md:col-span-2">
           <h3 className="text-lg text-white mb-4 border-b border-white/10 pb-2">Competency Breakdown</h3>
           <div className="space-y-4">
             {Object.entries(report.breakdown || {}).map(([key, value]: any) => (
               <div key={key}>
                 <div className="flex justify-between text-sm mb-1 text-white/80">
                   <span className="capitalize">{key.replace('_', ' ')}</span>
                   <span>{value}%</span>
                 </div>
                 <div className="w-full bg-white/10 rounded-full h-1.5">
                   <div className="bg-[var(--color-secondary)] h-1.5 rounded-full" style={{ width: `${value}%` }}></div>
                 </div>
               </div>
             ))}
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-8 bg-white/5 border-white/10">
          <h3 className="text-lg text-white mb-4 border-b border-white/10 pb-2 text-green-400">Strengths</h3>
          <ul className="space-y-3">
            {report.strengths?.map((str: string, i: number) => (
              <li key={i} className="text-white/80 font-light flex items-start">
                <span className="text-green-500 mr-3 mt-1">✦</span>
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-8 bg-white/5 border-white/10">
          <h3 className="text-lg text-white mb-4 border-b border-white/10 pb-2 text-amber-400">Areas for Improvement</h3>
          <ul className="space-y-3">
            {report.weaknesses?.map((wk: string, i: number) => (
              <li key={i} className="text-white/80 font-light flex items-start">
                <span className="text-amber-500 mr-3 mt-1">✦</span>
                <span className="leading-relaxed">{wk}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-8 bg-white/5 border-[var(--color-secondary)]/30 border md:col-span-1 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm text-white/50 mb-4 uppercase tracking-wider">Decision</h3>
          {report.recommendation === 'strong_hire' && (
            <div className="bg-green-500/20 text-green-400 px-6 py-3 rounded-full font-display text-xl border border-green-500/30">Strong Hire</div>
          )}
          {report.recommendation === 'hire' && (
            <div className="bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-full font-display text-xl border border-emerald-500/30">Hire</div>
          )}
          {report.recommendation === 'weak_hire' && (
            <div className="bg-amber-500/20 text-amber-400 px-6 py-3 rounded-full font-display text-xl border border-amber-500/30">Weak Hire</div>
          )}
          {report.recommendation === 'no_hire' && (
            <div className="bg-red-500/20 text-red-400 px-6 py-3 rounded-full font-display text-xl border border-red-500/30">No Hire</div>
          )}
          {!['strong_hire', 'hire', 'weak_hire', 'no_hire'].includes(report.recommendation) && (
            <div className="bg-white/10 text-white/80 px-6 py-3 rounded-full font-display text-xl border border-white/20 capitalize">{report.recommendation?.replace('_', ' ')}</div>
          )}
        </Card>

        <Card className="p-8 bg-white/5 border-white/10 md:col-span-2">
          <h3 className="text-lg text-white mb-4 border-b border-white/10 pb-2">Scoring Evidence</h3>
          {(!report.evidence || report.evidence.length === 0) ? (
            <p className="text-white/50 font-light text-sm italic">Detailed evidence is unavailable for this session.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {report.evidence.map((ev: any, i: number) => (
                <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-[var(--color-secondary)] uppercase tracking-wider">{ev.competency}</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/70">Score: {ev.score}/100</span>
                  </div>
                  <p className="text-sm text-white/80 font-light leading-relaxed">{ev.notes}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
