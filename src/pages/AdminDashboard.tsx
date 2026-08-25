import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';
import { CheckCircle2, AlertTriangle, Users, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stuckSessions, setStuckSessions] = useState<any[]>([]);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const uid = localStorage.getItem('ravengard_uid');
      if (!uid) {
        navigate('/interview', { replace: true });
        return;
      }

      try {
        const res = await fetch('/api/admin/stuck-sessions', {
          headers: {
            Authorization: `Bearer ${uid}`
          }
        });

        if (res.status === 403 || res.status === 401) {
          addToast('error', 'Unauthorized access.');
          navigate('/interview', { replace: true });
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setStuckSessions(data.sessions || []);
          setIsAdmin(true);
        }
      } catch (err) {
        addToast('error', 'Failed to verify admin status');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate, addToast]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton variant="text" width="30%" height={40} className="mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton variant="rectangular" height={160} />
          <Skeleton variant="rectangular" height={160} />
          <Skeleton variant="rectangular" height={160} />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif text-[var(--color-text)] mb-8 flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-[var(--color-accent)]" />
        Admin Control Center
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-xl border border-[var(--color-glass-highlight)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg text-[var(--color-text-muted)] mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Stuck Sessions
          </h3>
          <p className="text-4xl font-light text-[var(--color-text)]">{stuckSessions.length}</p>
        </div>
        
        <div className="glass-panel p-6 rounded-xl border border-[var(--color-glass-highlight)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg text-[var(--color-text-muted)] mb-2 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Candidates
          </h3>
          <p className="text-4xl font-light text-[var(--color-text)]">0</p>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-[var(--color-glass-highlight)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg text-[var(--color-text-muted)] mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Completed Interviews
          </h3>
          <p className="text-4xl font-light text-[var(--color-text)]">0</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-[var(--color-glass-highlight)] overflow-hidden">
        <div className="p-6 border-b border-[var(--color-glass-highlight)]">
          <h2 className="text-xl font-medium text-[var(--color-text)]">Stuck Sessions Queue</h2>
        </div>
        <div className="p-6">
          {stuckSessions.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)] flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50" />
              <p>No stuck sessions found. All candidates are progressing smoothly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stuckSessions.map((session) => (
                <div key={session.id} className="p-4 bg-[var(--color-bg-1)] rounded-lg border border-[var(--color-glass-highlight)] flex items-center justify-between">
                  <div>
                    <p className="text-[var(--color-text)] font-medium mb-1">Session ID: {session.id}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">User ID: {session.userId} • Phase: {session.currentPhase}</p>
                  </div>
                  <button className="px-4 py-2 bg-[var(--color-bg-2)] hover:bg-[var(--color-bg-3)] border border-[var(--color-glass-highlight)] rounded-lg text-sm transition-colors text-[var(--color-text)]">
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
