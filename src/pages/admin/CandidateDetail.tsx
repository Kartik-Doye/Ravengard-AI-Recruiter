import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DownloadSummaryButton } from '../../components/admin/DownloadSummaryButton';

export const CandidateDetail = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Basic routing hack since we aren't using React Router params here cleanly if we just rely on window.location
  const candidateId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const token = localStorage.getItem('ravengard_admin_token');
        const res = await fetch(`/api/admin/candidates/${candidateId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          setError('Failed to fetch candidate details');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    if (candidateId) fetchCandidate();
  }, [candidateId]);

  if (loading) return <div className="p-8 text-[var(--color-text-secondary)]">Loading candidate...</div>;
  if (error || !data) return <div className="p-8 text-red-500">{error || 'Candidate not found'}</div>;

  const { candidate, sessions } = data;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <a href="/admin/candidates" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Candidates</a>
      
      <div className="bg-[var(--color-bg-1)] border border-[var(--color-border)] rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-light text-[var(--color-text-primary)] mb-2">{candidate.name}</h1>
        <div className="text-[var(--color-text-secondary)] mb-6">{candidate.email}</div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Mobile</div>
            <div className="text-[var(--color-text-primary)]">{candidate.mobile || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">College</div>
            <div className="text-[var(--color-text-primary)]">{candidate.college || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Degree</div>
            <div className="text-[var(--color-text-primary)]">{candidate.degree || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Grad Year</div>
            <div className="text-[var(--color-text-primary)]">{candidate.gradYear || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Preferred Language</div>
            <div className="text-[var(--color-text-primary)]">{candidate.preferredLanguage || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Registered</div>
            <div className="text-[var(--color-text-primary)]">{new Date(candidate.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Sessions ({sessions.length})</h2>
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-[var(--color-text-secondary)]">No sessions found for this candidate.</div>
        ) : (
          sessions.map((session: any, idx: number) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[var(--color-bg-1)] border border-[var(--color-border)] rounded-xl p-6 flex justify-between items-center"
            >
              <div>
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">Session ID: {session.id}</div>
                <div className="text-[var(--color-text-primary)] font-medium capitalize mb-2">Stage: {session.currentStage.replace('_', ' ')}</div>
                <div className="flex gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${session.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                    {session.status}
                  </span>
                  {session.locked && (
                    <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-500">
                      Locked
                    </span>
                  )}
                  {session.recommendation && (
                    <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 capitalize">
                      {session.recommendation.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DownloadSummaryButton
                  sessionId={session.id}
                  candidateName={data?.candidate?.name}
                  variant="secondary"
                />
                <a href={`/admin/sessions/${session.id}`} className="px-4 py-2 bg-[var(--color-bg-2)] hover:bg-[var(--color-bg-3)] rounded-lg text-sm text-[var(--color-text-primary)] transition-colors border border-[var(--color-border)]">
                  View Session
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
