import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

export default function SessionDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const token = localStorage.getItem('ravengard_admin_token');
      if (!token) return;
      try {
        const res = await fetch(`/api/admin/sessions/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.success) {
          setData(d);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (loading) return <div className="p-8 text-white/50">Loading scorecard...</div>;
  if (!data || !data.session) return <div className="p-8 text-red-500">Session not found.</div>;

  const { session, report, signals, transcript } = data;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/admin" className="text-white/50 hover:text-white text-sm mb-4 inline-block">← Back to Dashboard</Link>
          <h2 className="text-3xl font-display text-white">Scorecard: {session.id.split('-')[0]}</h2>
          <p className="text-white/60 text-sm mt-1">Status: <span className="uppercase font-bold text-white">{session.status}</span> | Created: {new Date(session.createdAt).toLocaleString()}</p>
        </div>
        {report?.recommendation && (
          <div className={`px-6 py-3 border rounded text-lg uppercase font-bold tracking-wider ${
            report.recommendation === 'strong_hire' || report.recommendation === 'Proceed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            report.recommendation === 'Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            report.recommendation === 'no_hire' || report.recommendation === 'Reject' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-white/5 text-white/70 border-white/10'
          }`}>
            {report.recommendation.replace('_', ' ')}
          </div>
        )}
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-[var(--color-secondary)] uppercase tracking-wider text-sm font-bold mb-4">Overall Score</h3>
            <div className="text-5xl font-light text-white font-mono">{report.overallScore !== null ? `${report.overallScore}/100` : 'N/A'}</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-6 space-y-4">
            <div>
              <h3 className="text-[var(--color-secondary)] uppercase tracking-wider text-sm font-bold mb-2">Strengths</h3>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                {(report.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-[var(--color-secondary)] uppercase tracking-wider text-sm font-bold mb-2">Areas for Review</h3>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                {(report.weaknesses || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {report?.evidence && report.evidence.length > 0 && (
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-[var(--color-secondary)] uppercase tracking-wider text-sm font-bold mb-4">AI Scoring Rationale</h3>
          <div className="space-y-4">
            {report.evidence.map((ev: any, i: number) => (
              <div key={i} className="border-l-2 border-white/10 pl-4 py-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium">{ev.competency}</span>
                  <span className="text-[var(--color-secondary)] font-mono text-sm">{ev.score}/100</span>
                </div>
                <p className="text-white/60 text-sm">{ev.notes}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-[var(--color-secondary)] uppercase tracking-wider text-sm font-bold mb-4">Full Interview Transcript</h3>
        <div className="space-y-6">
          {transcript && transcript.length > 0 ? transcript.map((t: any, i: number) => (
            <div key={i} className="space-y-2">
              <div className="text-white/50 text-xs uppercase tracking-wider">Question {i + 1}</div>
              <p className="text-white font-medium">{t.question}</p>
              <div className="bg-black/30 p-4 rounded border border-white/5 text-white/80">
                {t.response || <span className="italic text-white/40">No response recorded</span>}
              </div>
            </div>
          )) : (
            <div className="text-white/40 italic">No transcript available.</div>
          )}
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-[var(--color-secondary)] uppercase tracking-wider text-sm font-bold mb-4">Bias Control & Audit Logs</h3>
        {signals && signals.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-3 text-white/50 uppercase tracking-wider">Timestamp</th>
                <th className="p-3 text-white/50 uppercase tracking-wider">Signal Type</th>
                <th className="p-3 text-white/50 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {signals.map((sig: any, i: number) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 text-white/50">{new Date(sig.createdAt).toLocaleTimeString()}</td>
                  <td className="p-3 text-[var(--color-secondary)] font-mono">{sig.signalType}</td>
                  <td className="p-3 text-white/80">{sig.details ? JSON.stringify(sig.details) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-white/40 italic">No integrity signals flagged during this session.</div>
        )}
      </Card>
    </div>
  );
}
