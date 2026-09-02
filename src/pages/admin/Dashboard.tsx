import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  
  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem('ravengard_uid');
      if (!token) return;
      const res = await fetch('/api/admin/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    };
    fetchSessions();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-display text-white mb-1">Sessions Overview</h2>
          <p className="text-white/50 font-light">Monitor candidate progress, interview integrity, and final reports.</p>
        </div>
      </div>
      
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium text-white/50 uppercase tracking-wider">Session ID</th>
              <th className="p-4 font-medium text-white/50 uppercase tracking-wider">Stage</th>
              <th className="p-4 font-medium text-white/50 uppercase tracking-wider">Status</th>
              <th className="p-4 font-medium text-white/50 uppercase tracking-wider">Date</th>
              <th className="p-4 font-medium text-white/50 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sessions.map((s: any) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-white/80">{s.id.split('-')[0]}...</td>
                <td className="p-4 text-white/80 capitalize">{s.currentStage?.replace('_', ' ')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs border ${s.flagged ? 'bg-red-500/10 text-red-400 border-red-500/20' : s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/70 border-white/10'}`}>
                    {s.flagged ? 'Flagged' : s.status}
                  </span>
                </td>
                <td className="p-4 text-white/50">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link to={`/admin/session/${s.id}`} className="text-[var(--color-secondary)] hover:text-white transition-colors">View Details →</Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/50 italic">No sessions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
