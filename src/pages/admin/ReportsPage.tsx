import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const ReportsPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('ravengard_admin_token');
        const res = await fetch('/api/admin/reports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports);
        } else {
          setError('Failed to fetch reports');
        }
      } catch (err) {
        setError('Network error while fetching reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-8 text-[var(--color-text-secondary)]">Loading reports...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const getRecommendationColor = (rec: string) => {
    switch(rec) {
      case 'strong_hire': return 'bg-green-500/10 text-green-500';
      case 'hire': return 'bg-blue-500/10 text-blue-500';
      case 'weak_hire': return 'bg-yellow-500/10 text-yellow-500';
      case 'no_hire': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-light text-[var(--color-text-primary)] mb-8">Interview Reports</h1>
      <div className="bg-[var(--color-bg-1)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Candidate</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Session ID</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Score</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Recommendation</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Generated Date</th>
              <th className="p-4 text-sm font-medium text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--color-text-secondary)]">No reports generated yet</td>
              </tr>
            ) : (
              reports.map((report, idx) => (
                <motion.tr 
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-2)] transition-colors"
                >
                  <td className="p-4">
                    <div className="text-[var(--color-text-primary)]">{report.candidateName || 'Unknown'}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{report.candidateEmail || 'Unknown'}</div>
                  </td>
                  <td className="p-4 text-xs text-[var(--color-text-secondary)] font-mono">
                    {report.sessionId.slice(0, 8)}...
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-[var(--color-text-primary)]">{report.overallScore}</span> / 100
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRecommendationColor(report.recommendation)}`}>
                      {report.recommendation?.replace('_', ' ') || 'None'}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)]">
                    {new Date(report.generatedAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <a href={`/admin/sessions/${report.sessionId}`} className="text-blue-500 hover:underline">
                      View Full Report
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
