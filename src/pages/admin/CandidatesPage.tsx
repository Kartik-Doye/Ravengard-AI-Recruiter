import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const CandidatesPage = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('ravengard_admin_token');
        const res = await fetch('/api/admin/candidates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCandidates(data.candidates);
        } else {
          setError('Failed to fetch candidates');
        }
      } catch (err) {
        setError('Network error while fetching candidates');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  if (loading) return <div className="p-8 text-[var(--color-text-secondary)]">Loading candidates...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-light text-[var(--color-text-primary)] mb-8">Candidates</h1>
      <div className="bg-[var(--color-bg-1)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Name</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Email</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">College</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Joined</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--color-text-secondary)]">No candidates found</td>
              </tr>
            ) : (
              candidates.map((candidate, idx) => (
                <motion.tr 
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-2)] transition-colors"
                >
                  <td className="p-4 text-[var(--color-text-primary)]">{candidate.name}</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">{candidate.email}</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">{candidate.college || '-'}</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <a href={`/admin/candidates/${candidate.id}`} className="text-blue-500 hover:underline">
                      View Profile
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
