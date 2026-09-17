import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const FlagQueue = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const token = localStorage.getItem('ravengard_admin_token');
        const res = await fetch('/api/admin/flags', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFlags(data.flags);
        } else {
          setError('Failed to fetch flag queue');
        }
      } catch (err) {
        setError('Network error while fetching flags');
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, []);

  if (loading) return <div className="p-8 text-[var(--color-text-secondary)]">Loading flag queue...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-light text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
        Review Queue
        {flags.length > 0 && (
          <span className="bg-red-500/20 text-red-500 text-sm font-medium px-3 py-1 rounded-full">
            {flags.length} Flags
          </span>
        )}
      </h1>
      <div className="bg-[var(--color-bg-1)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Candidate</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Signal Type</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Time Logged</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Session State</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--color-text-secondary)]">No flagged sessions to review.</td>
              </tr>
            ) : (
              flags.map((flag, idx) => (
                <motion.tr 
                  key={idx} // In a real app we'd use signal id, but the endpoint doesn't return it yet, so we use index
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-2)] transition-colors"
                >
                  <td className="p-4">
                    <div className="text-[var(--color-text-primary)]">{flag.candidateName || 'Unknown'}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{flag.candidateEmail || 'Unknown'}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-orange-500/10 text-orange-500 font-mono text-xs px-2 py-1 rounded">
                      {flag.signalType}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {new Date(flag.signalTimestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="text-xs">
                       <span className="mr-2 text-[var(--color-text-secondary)]">Status:</span>
                       <span className="text-[var(--color-text-primary)] capitalize">{flag.sessionStatus}</span>
                    </div>
                    {flag.sessionFlagged && (
                       <div className="text-xs text-red-500 mt-1">Officially Flagged</div>
                    )}
                  </td>
                  <td className="p-4">
                    <a href={`/admin/sessions/${flag.sessionId}`} className="text-blue-500 hover:underline text-sm">
                      Review Session
                    </a>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
