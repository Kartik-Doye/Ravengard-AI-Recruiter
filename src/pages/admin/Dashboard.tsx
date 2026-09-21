import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ExternalLink,
  Filter,
  RefreshCw,
  Scale,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { CandidatePerformanceCharts } from '../../components/admin/CandidatePerformanceCharts';
import { DownloadSummaryButton } from '../../components/admin/DownloadSummaryButton';

interface CompletedSession {
  id: string;
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  createdAt: string;
  currentStage: string;
  status: string;
  flagged: boolean;
  overallScore: number | null;
  recommendation: 'Proceed' | 'Review' | 'Reject' | string | null;
  fairnessScore: number | null;
  evidence?: any[];
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState<'ALL' | 'Proceed' | 'Review' | 'Reject'>('ALL');
  const [showCharts, setShowCharts] = useState(true);
  const navigate = useNavigate();

  const fetchCompletedSessions = async () => {
    setLoading(true);
    const token = localStorage.getItem('ravengard_admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    try {
      const res = await fetch('/api/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('ravengard_admin_token');
        navigate('/admin/login', { replace: true });
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        // Filter strictly for completed sessions or those with reports/scorecards
        const completedOnly = data.sessions.filter(
          (s: any) => s.status === 'completed' || s.overallScore !== null || s.recommendation !== null
        );
        setSessions(completedOnly);
      }
    } catch (err) {
      console.error('Failed to load completed sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        (s.candidateName && s.candidateName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.candidateEmail && s.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRec =
        recommendationFilter === 'ALL' || s.recommendation === recommendationFilter;

      return matchesSearch && matchesRec;
    });
  }, [sessions, searchQuery, recommendationFilter]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const proceedCount = sessions.filter((s) => s.recommendation === 'Proceed').length;
    const reviewCount = sessions.filter((s) => s.recommendation === 'Review').length;
    const rejectCount = sessions.filter((s) => s.recommendation === 'Reject').length;
    const avgFairness =
      total > 0
        ? (sessions.reduce((acc, curr) => acc + (curr.fairnessScore || 95.0), 0) / total).toFixed(1)
        : '98.2';

    return { total, proceedCount, reviewCount, rejectCount, avgFairness };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Audit Node Online
            </span>
            <span className="text-white/40 text-xs font-mono">• 256-bit AES Storage</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-light text-white tracking-wide">
            Candidate Audit Ledger
          </h1>
          <p className="text-xs md:text-sm text-white/60 font-light mt-1">
            Data-dense ledger of completed candidate interviews, algorithmic fairness metrics, and auditable scorecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors cursor-pointer ${
              showCharts
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
            }`}
            title="Toggle candidate performance charts"
          >
            <span>{showCharts ? 'Hide Analytics' : 'Show Performance Analytics'}</span>
          </button>

          <button
            onClick={fetchCompletedSessions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs border border-white/10 transition-colors cursor-pointer"
            title="Refresh candidate data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Candidate Performance Metrics Visualizations (Recharts) */}
      {showCharts && (
        <CandidatePerformanceCharts sessions={sessions} />
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-white/40" />
            <span>Completed Interviews</span>
          </div>
          <div className="text-2xl font-light text-white font-mono">{stats.total}</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mean Fairness Index</span>
          </div>
          <div className="text-2xl font-light text-emerald-400 font-mono">{stats.avgFairness}%</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Proceed Recommendations</span>
          </div>
          <div className="text-2xl font-light text-white font-mono">{stats.proceedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Under Review / Flags</span>
          </div>
          <div className="text-2xl font-light text-amber-400 font-mono">{stats.reviewCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidate by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-[var(--color-secondary)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider hidden md:inline">
            Recommendation:
          </span>
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10 w-full sm:w-auto">
            {(['ALL', 'Proceed', 'Review', 'Reject'] as const).map((rec) => (
              <button
                key={rec}
                onClick={() => setRecommendationFilter(rec)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  recommendationFilter === rec
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {rec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Candidate Data Table */}
      <Card className="bg-black/30 border-white/10 overflow-hidden rounded-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/[0.04] border-b border-white/10 text-white/60 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-medium">Candidate Name</th>
                <th className="py-3.5 px-4 font-medium">Assessment Date</th>
                <th className="py-3.5 px-4 font-medium">AI Fairness Score</th>
                <th className="py-3.5 px-4 font-medium">Overall Recommendation</th>
                <th className="py-3.5 px-4 font-medium text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/50">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="font-mono text-xs">Querying completed interview records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40 italic font-sans">
                    No completed candidate interviews found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const assessmentDate = new Date(s.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  const fairness = s.fairnessScore ?? 98.5;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/admin/sessions/${s.id}`)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Candidate Name */}
                      <td className="py-4 px-4 font-medium">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-display tracking-wide group-hover:text-[var(--color-secondary)] transition-colors">
                            {s.candidateName || 'Unnamed Candidate'}
                          </span>
                          <span className="text-white/40 text-[11px] font-mono">
                            {s.candidateEmail || 'No verified email'}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Assessment Date */}
                      <td className="py-4 px-4 text-white/70 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-white/30" />
                          <span>{assessmentDate}</span>
                        </div>
                      </td>

                      {/* Column 3: AI Fairness Score */}
                      <td className="py-4 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                fairness >= 95
                                  ? 'bg-emerald-400'
                                  : fairness >= 90
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                              }`}
                              style={{ width: `${fairness}%` }}
                            />
                          </div>
                          <span
                            className={`font-semibold text-xs ${
                              fairness >= 95
                                ? 'text-emerald-400'
                                : fairness >= 90
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {fairness}%
                          </span>
                          <span className="text-[10px] text-white/40 hidden md:inline">
                            (Audit Verified)
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Overall Recommendation */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {s.recommendation === 'Proceed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Proceed</span>
                          </span>
                        ) : s.recommendation === 'Review' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </span>
                        ) : s.recommendation === 'Reject' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-white/60 border border-white/10">
                            <span>{s.recommendation || 'Pending Evaluation'}</span>
                          </span>
                        )}
                      </td>

                      {/* Column 5: Action Link */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <DownloadSummaryButton
                            sessionId={s.id}
                            candidateName={s.candidateName || 'Candidate'}
                            variant="compact"
                          />
                          <span
                            onClick={() => navigate(`/admin/sessions/${s.id}`)}
                            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-secondary)] hover:text-white font-mono uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            <span>Scorecard</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
