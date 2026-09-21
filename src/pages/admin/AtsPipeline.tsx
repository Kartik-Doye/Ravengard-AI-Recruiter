import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Send,
  Eye,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Clock,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string | null;
  description: string;
  screeningThreshold: number;
  requireHumanRejectionApproval: boolean;
  status: string;
  createdAt: string;
  metrics?: {
    total: number;
    shortlisted: number;
    pending_review: number;
    completed: number;
    recommended: number;
  };
}

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  session_id: string | null;
  magic_token_expires_at: string | null;
  magic_token_used_at: string | null;
  created_at: string;
  candidate_name: string;
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
  full_rationale_json: any | null;
  overall_score: number | null;
  assessment_recommendation: string | null;
  integrity_flags_count: number;
}

export function AtsPipeline() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending_rejection_review' | 'pre_screened' | 'post_assessment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // New Job Form State
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Engineering');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobThreshold, setNewJobThreshold] = useState(70);
  const [newJobRequireHuman, setNewJobRequireHuman] = useState(true);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  const token = localStorage.getItem('ravengard_admin_token') || '';

  const fetchData = async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      // 1. Fetch Jobs
      const jobsRes = await fetch('/api/hr/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }

      // 2. Fetch Applications
      let appsUrl = `/api/hr/applications?tab=${activeTab}`;
      if (selectedJobId) appsUrl += `&jobId=${selectedJobId}`;
      if (searchQuery) appsUrl += `&search=${encodeURIComponent(searchQuery)}`;

      const appsRes = await fetch(appsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
      }
    } catch (err: any) {
      console.error('Failed to load ATS data:', err);
      setActionErrorMsg('Failed to sync ATS data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedJobId]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim() || !newJobDesc.trim()) return;

    setIsSubmittingJob(true);
    setActionErrorMsg(null);
    try {
      const res = await fetch('/api/hr/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newJobTitle,
          department: newJobDept,
          description: newJobDesc,
          screeningThreshold: Number(newJobThreshold),
          requireHumanRejectionApproval: newJobRequireHuman,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create job posting.');
      }

      setShowCreateJob(false);
      setNewJobTitle('');
      setNewJobDesc('');
      setActionSuccessMsg('Job posting created successfully.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleBatchApproveRejections = async () => {
    const pendingApps = applications.filter((a) => a.status === 'pending_rejection_review');
    if (pendingApps.length === 0) return;

    const confirmed = window.confirm(
      `Human-in-the-Loop Safeguard:\n\nAre you sure you want to approve rejection and send non-selection emails to ${pendingApps.length} candidate(s)?`
    );
    if (!confirmed) return;

    setIsBatchApproving(true);
    setActionErrorMsg(null);
    try {
      const res = await fetch('/api/hr/applications/batch-approve-rejections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationIds: pendingApps.map((a) => a.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch approval failed.');

      setActionSuccessMsg(data.message);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message);
    } finally {
      setIsBatchApproving(false);
    }
  };

  const handleResetMagicLink = async (appId: string) => {
    try {
      const res = await fetch(`/api/hr/applications/${appId}/reset-magic-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset magic link');

      setActionSuccessMsg('Fresh 48h magic assessment link generated and queued for email delivery.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const handleStatusOverride = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hr/applications/${appId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: 'Authorized HR Pipeline Action',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Status update failed');
      }

      setActionSuccessMsg(`Candidate status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchData();
      if (selectedApp) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const pendingReviewCount = applications.filter((a) => a.status === 'pending_rejection_review').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Alerts */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Header with Title and Create Job CTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-[var(--color-secondary)]" />
            HR Funnel & ATS Pipeline
          </h1>
          <p className="text-xs text-white/50 font-mono mt-1">
            Tenant-isolated candidate ingestion, AI pre-screening, Human-in-the-Loop review, and assessment verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowCreateJob(true)}
            className="px-3.5 py-2 rounded-lg bg-[var(--color-secondary)] text-black font-semibold text-xs font-mono flex items-center gap-2 hover:bg-[var(--color-secondary)]/90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Active Roles</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white font-mono">{jobs.length}</span>
            <span className="text-xs text-emerald-400 font-mono">live</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Total Ingested</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white font-mono">{applications.length}</span>
            <span className="text-xs text-white/40 font-mono">candidates</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Shortlisted (Email #1)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {applications.filter((a) => a.status === 'shortlisted').length}
            </span>
            <span className="text-xs text-emerald-400/60 font-mono">invited</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-300 uppercase tracking-wider">Human-in-the-Loop Queue</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{pendingReviewCount}</span>
            <span className="text-xs text-amber-300/70 font-mono">pending review</span>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Batch Action Card (Mandatory Safeguard) */}
      {pendingReviewCount > 0 && (
        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-300">
                EU AI Act & NYC LL144 Human-in-the-Loop Safeguard
              </h3>
            </div>
            <p className="text-xs text-amber-200/80 max-w-2xl leading-relaxed">
              {pendingReviewCount} candidate(s) scored below the AI screening threshold. Per adverse decision compliance, automated rejection is halted until authorized by HR. You can review dossiers individually or trigger single-click batch dispatch of polite rejection feedback.
            </p>
          </div>

          <button
            onClick={handleBatchApproveRejections}
            disabled={isBatchApproving}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono flex items-center gap-2 transition-all shadow-md flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isBatchApproving ? 'Approving...' : `Batch Approve ${pendingReviewCount} Rejections`}</span>
          </button>
        </div>
      )}

      {/* Filter and Tab Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Stage Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-[var(--color-secondary)] text-black font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All Candidates ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('pending_rejection_review')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending_rejection_review'
                ? 'bg-amber-500 text-black font-semibold'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <span>Review Queue</span>
            {pendingReviewCount > 0 && (
              <span className="px-1.5 py-0.2 bg-black/40 text-amber-300 rounded text-[10px] font-bold">
                {pendingReviewCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pre_screened')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'pre_screened'
                ? 'bg-[var(--color-secondary)] text-black font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Pre-Screened
          </button>

          <button
            onClick={() => setActiveTab('post_assessment')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'post_assessment'
                ? 'bg-[var(--color-secondary)] text-black font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Post-Assessment
          </button>
        </div>

        {/* Job Selector & Search */}
        <div className="flex items-center gap-3">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-[var(--color-secondary)] focus:outline-none"
          >
            <option value="">All Job Postings</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department || 'General'})
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-white/40 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">AI Match Score</th>
                <th className="py-3 px-4">Funnel Status</th>
                <th className="py-3 px-4">Assessment / Flags</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 font-mono">
                    {loading ? 'Ingesting ATS pipeline...' : 'No applications found matching filter.'}
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">{app.candidate_name}</div>
                      <div className="text-white/40 text-[11px]">{app.candidate_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{app.job_title}</div>
                      <div className="text-white/40 text-[11px]">{app.job_dept || 'Engineering'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {app.match_score !== null ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              app.match_score >= app.screening_threshold
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {app.match_score}%
                          </span>
                          <span className="text-white/30 text-[10px]">
                            req {app.screening_threshold}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/40 italic text-[11px]">Processing...</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          app.status === 'shortlisted'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : app.status === 'pending_rejection_review'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : app.status === 'rejected_at_screening'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : app.status === 'assessment_completed'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            : app.status === 'recommended'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-white/10 text-white/70 border border-white/15'
                        }`}
                      >
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {app.overall_score !== null ? (
                          <span className="text-white font-mono font-semibold">
                            Score: {app.overall_score}/100
                          </span>
                        ) : (
                          <span className="text-white/30 text-[11px]">Not assessed</span>
                        )}

                        {app.integrity_flags_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                            {app.integrity_flags_count} flags
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono border border-white/10 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Detailed Dossier Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[var(--color-bg-0)] border-l border-white/10 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedApp.candidate_name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      selectedApp.status === 'shortlisted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedApp.status === 'pending_rejection_review'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {selectedApp.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-white/50 font-mono mt-1">
                  Applied for {selectedApp.job_title} • {selectedApp.candidate_email}
                </p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* AI Screening Rationale Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Pre-Screening Evaluation
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  Match Score: {selectedApp.match_score ?? 'Pending'}%
                </span>
              </div>

              {selectedApp.full_rationale_json?.overallFitRationale && (
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {selectedApp.full_rationale_json.overallFitRationale}
                </p>
              )}

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold block mb-1">
                    Key Strengths
                  </span>
                  <ul className="text-xs text-white/70 space-y-1">
                    {(selectedApp.strengths_summary || ['Relevant engineering foundation']).map(
                      (s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          <span>{s}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <span className="text-[11px] font-mono text-amber-400 font-semibold block mb-1">
                    Identified Gaps
                  </span>
                  <ul className="text-xs text-white/70 space-y-1">
                    {(selectedApp.gaps_summary || ['No critical gaps identified']).map((g, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Assessment Session & Integrity Flags */}
            {selectedApp.session_id && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-white/50 block">
                  Assessment Interview Integrity
                </span>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/70">Session Reference:</span>
                  <span className="text-white font-semibold">{selectedApp.session_id}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/70">Integrity Anomaly Flags:</span>
                  <span
                    className={`font-semibold ${
                      selectedApp.integrity_flags_count > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedApp.integrity_flags_count} logged
                  </span>
                </div>
              </div>
            )}

            {/* Actions & Overrides */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50 block">
                Administrative Controls & Magic Links
              </span>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleResetMagicLink(selectedApp.id)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Re-issue 48h Magic Link</span>
                </button>

                <button
                  onClick={() => handleStatusOverride(selectedApp.id, 'shortlisted')}
                  className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs border border-emerald-500/30 transition-colors"
                >
                  Override to Shortlisted
                </button>

                <button
                  onClick={() => handleStatusOverride(selectedApp.id, 'rejected_at_screening')}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs border border-red-500/30 transition-colors"
                >
                  Reject Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Posting Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[var(--color-bg-0)] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--color-secondary)]" />
                Create New Job Opening
              </h2>
              <button
                onClick={() => setShowCreateJob(false)}
                className="text-white/50 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-white/70 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full p-2.5 bg-black/50 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Platform Infrastructure"
                  value={newJobDept}
                  onChange={(e) => setNewJobDept(e.target.value)}
                  className="w-full p-2.5 bg-black/50 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1">Job Description & Competencies *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste role specifications, technical requirements, and responsibilities..."
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  className="w-full p-2.5 bg-black/50 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 mb-1">AI Screening Threshold (%)</label>
                  <input
                    type="number"
                    min={40}
                    max={95}
                    value={newJobThreshold}
                    onChange={(e) => setNewJobThreshold(Number(e.target.value))}
                    className="w-full p-2.5 bg-black/50 border border-white/15 rounded-lg text-white focus:border-[var(--color-secondary)] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={newJobRequireHuman}
                      onChange={(e) => setNewJobRequireHuman(e.target.checked)}
                      className="rounded border-white/20 text-[var(--color-secondary)] focus:ring-0"
                    />
                    <span className="text-white/80 text-[11px]">
                      Require Human Rejection Approval
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateJob(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="px-4 py-2 rounded-lg bg-[var(--color-secondary)] text-black font-semibold hover:bg-[var(--color-secondary)]/90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingJob ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
