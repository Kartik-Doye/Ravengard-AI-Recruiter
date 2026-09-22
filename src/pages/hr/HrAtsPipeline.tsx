import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Users,
  FileText,
  ShieldAlert,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react';

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  organization_id: string;
  status: string;
  session_id: string | null;
  magic_token_expires_at: string | null;
  magic_token_used_at: string | null;
  created_at: string;
  updated_at: string;
  candidate_name: string | null;
  candidate_email: string;
  college: string | null;
  degree: string | null;
  grad_year: number | null;
  job_title: string;
  job_dept: string | null;
  screening_threshold: number;
  match_score: number | null;
  strengths_summary: string[] | null;
  gaps_summary: string[] | null;
  full_rationale_json: any;
  overall_score: number | null;
  assessment_recommendation: string | null;
  breakdown: any;
  integrity_flags_count: number;
}

type TabKey = 'all' | 'pre_screened' | 'pending_rejection_review' | 'post_assessment';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All Applicants', icon: Users },
  { key: 'pre_screened', label: 'Pre-Screened by AI', icon: Sparkles },
  { key: 'pending_rejection_review', label: 'Pending Rejection Review', icon: AlertTriangle },
  { key: 'post_assessment', label: 'Post-Assessment', icon: FileText },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  applied: { label: 'Applied', color: 'text-white/60', bg: 'bg-white/8 border-white/10' },
  shortlisted: { label: 'Shortlisted', color: 'text-emerald-300', bg: 'bg-emerald-500/12 border-emerald-500/20' },
  rejected_at_screening: { label: 'Rejected', color: 'text-red-300', bg: 'bg-red-500/12 border-red-500/20' },
  pending_rejection_review: { label: 'Pending Review', color: 'text-amber-300', bg: 'bg-amber-500/12 border-amber-500/20' },
  assessment_pending: { label: 'Assessment Pending', color: 'text-blue-300', bg: 'bg-blue-500/12 border-blue-500/20' },
  assessment_in_progress: { label: 'In Progress', color: 'text-violet-300', bg: 'bg-violet-500/12 border-violet-500/20' },
  assessment_completed: { label: 'Completed', color: 'text-cyan-300', bg: 'bg-cyan-500/12 border-cyan-500/20' },
  recommended: { label: 'Recommended', color: 'text-emerald-300', bg: 'bg-emerald-500/12 border-emerald-500/20' },
  not_recommended: { label: 'Not Recommended', color: 'text-red-300', bg: 'bg-red-500/12 border-red-500/20' },
};

export default function HrAtsPipeline() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'all'
  );
  const [blindMode, setBlindMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token) return;

    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('tab', activeTab);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/hr/applications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load applications');

      const data = await res.json();
      setApplications(data.applications || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleBatchApproveRejections = async () => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token) return;

    setBatchLoading(true);
    try {
      const res = await fetch('/api/hr/applications/batch-approve-rejections', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationIds: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Batch approval failed.');

      setSelectedIds(new Set());
      fetchApplications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingReviewApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReviewApps.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const pendingReviewApps = useMemo(
    () => applications.filter((a) => a.status === 'pending_rejection_review'),
    [applications]
  );

  // Stats
  const stats = useMemo(() => {
    const all = applications.length;
    const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
    const pending = applications.filter((a) => a.status === 'pending_rejection_review').length;
    const completed = applications.filter((a) =>
      ['assessment_completed', 'recommended', 'not_recommended'].includes(a.status)
    ).length;
    return { all, shortlisted, pending, completed };
  }, [applications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-xs font-mono text-white/40">Loading ATS Pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            ATS Pipeline
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            AI-powered applicant tracking and pre-screening funnel
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Blind Mode Toggle */}
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              blindMode
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/20'
                : 'bg-white/5 text-white/40 border-white/8 hover:text-white/70'
            }`}
            title="Blind screening: hide candidate names, emails, and colleges for bias-free review"
          >
            {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{blindMode ? 'Blind Mode On' : 'Blind Mode'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchApplications}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-white/40 hover:text-white/70 border border-white/8 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Applicants', value: stats.all, color: 'text-white' },
          { label: 'AI Shortlisted', value: stats.shortlisted, color: 'text-emerald-400' },
          { label: 'Pending Review', value: stats.pending, color: 'text-amber-400' },
          { label: 'Assessments Done', value: stats.completed, color: 'text-cyan-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/8"
          >
            <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-white/35 font-mono uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-white/25 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by candidate name, email, or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 transition-colors font-sans"
        />
      </div>

      {/* Batch Rejection Approval (only on pending_rejection_review tab) */}
      {activeTab === 'pending_rejection_review' && pendingReviewApps.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingReviewApps.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded accent-amber-500"
                />
                <span className="text-xs font-mono text-amber-300">
                  {selectedIds.size === 0
                    ? `Select All (${pendingReviewApps.length})`
                    : `${selectedIds.size} of ${pendingReviewApps.length} selected`}
                </span>
              </label>
            </div>
            <button
              onClick={handleBatchApproveRejections}
              disabled={batchLoading || selectedIds.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/25 transition-all cursor-pointer disabled:opacity-40"
            >
              {batchLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>
                Approve & Dispatch Rejections ({selectedIds.size || pendingReviewApps.length})
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-2">
        {applications.map((app) => {
          const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
          const isPending = app.status === 'pending_rejection_review';

          return (
            <div
              key={app.id}
              className="group p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-blue-500/15 hover:bg-white/[0.04] transition-all cursor-pointer"
              onClick={() => navigate(`/hr/candidates/${app.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox for batch mode */}
                {isPending && activeTab === 'pending_rejection_review' && (
                  <div
                    className="mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(app.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app.id)}
                      readOnly
                      className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {blindMode
                          ? `Candidate #${app.id.slice(-6).toUpperCase()}`
                          : app.candidate_name || 'Unknown Candidate'}
                      </h3>
                      <p className="text-xs text-white/35 font-mono mt-0.5">
                        {blindMode ? '●●●@●●●.com' : app.candidate_email}
                        {!blindMode && app.college && ` · ${app.college}`}
                        {app.degree && ` · ${app.degree}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Match Score Badge */}
                      {app.match_score !== null && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                            app.match_score >= 80
                              ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20'
                              : app.match_score >= 60
                              ? 'bg-amber-500/12 text-amber-300 border-amber-500/20'
                              : 'bg-red-500/12 text-red-300 border-red-500/20'
                          }`}
                        >
                          AI: {app.match_score}%
                        </span>
                      )}

                      {/* Assessment Score */}
                      {app.overall_score !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/12 text-cyan-300 border border-cyan-500/20">
                          Score: {app.overall_score}
                        </span>
                      )}

                      {/* Integrity flags */}
                      {app.integrity_flags_count > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-red-500/12 text-red-300 border border-red-500/20 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {app.integrity_flags_count}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Job & Meta */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/30">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {app.job_title}
                    </span>
                    {app.job_dept && <span>· {app.job_dept}</span>}
                    <span>
                      · Applied {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    {app.assessment_recommendation && (
                      <span className="inline-flex items-center gap-0.5">
                        ·{' '}
                        {app.assessment_recommendation === 'strong_hire' ||
                        app.assessment_recommendation === 'hire' ? (
                          <ThumbsUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ThumbsDown className="w-3 h-3 text-red-400" />
                        )}
                        {app.assessment_recommendation.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Strengths Preview */}
                  {app.strengths_summary && Array.isArray(app.strengths_summary) && app.strengths_summary.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(app.strengths_summary as string[]).slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/8 text-emerald-300/70 border border-emerald-500/15 font-mono"
                        >
                          {s}
                        </span>
                      ))}
                      {app.gaps_summary && Array.isArray(app.gaps_summary) && (app.gaps_summary as string[]).slice(0, 2).map((g, i) => (
                        <span
                          key={`gap-${i}`}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/8 text-red-300/70 border border-red-500/15 font-mono"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-blue-400/50 transition-colors shrink-0 mt-0.5" />
              </div>
            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30 font-mono">
              No applications found for this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Briefcase icon for the application list
function Briefcase({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
