import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  Star,
  Target,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Link2,
} from 'lucide-react';

interface Dossier {
  application: any;
  signals: any[];
  transcript: any[];
}

export default function HrCandidateDossier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusOverrideOpen, setStatusOverrideOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [auditNote, setAuditNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [resetLinkLoading, setResetLinkLoading] = useState(false);
  const [clearTelemetryLoading, setClearTelemetryLoading] = useState(false);
  const [expandedTranscript, setExpandedTranscript] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDossier = async () => {
      const token = localStorage.getItem('ravengard_hr_token');
      if (!token || !id) return;

      try {
        const res = await fetch(`/api/hr/applications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load candidate dossier.');

        const data = await res.json();
        setDossier(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [id]);

  const handleStatusOverride = async () => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token || !id || !newStatus) return;

    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/hr/applications/${id}/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason: auditNote }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Status override failed.');
      }

      // Refresh dossier
      const refreshRes = await fetch(`/api/hr/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshRes.ok) {
        setDossier(await refreshRes.json());
      }
      setStatusOverrideOpen(false);
      setNewStatus('');
      setAuditNote('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleResetMagicLink = async () => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token || !id) return;

    setResetLinkLoading(true);
    try {
      const res = await fetch(`/api/hr/applications/${id}/reset-magic-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset magic link.');
      }

      // Refresh
      const refreshRes = await fetch(`/api/hr/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshRes.ok) {
        setDossier(await refreshRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResetLinkLoading(false);
    }
  };

  const handleClearTelemetry = async (signalId?: string) => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token || !id) return;

    setClearTelemetryLoading(true);
    try {
      const res = await fetch(`/api/hr/applications/${id}/telemetry/clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'HR-verified false positive',
          signalId: signalId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to clear telemetry.');
      }

      // Refresh
      const refreshRes = await fetch(`/api/hr/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshRes.ok) {
        setDossier(await refreshRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClearTelemetryLoading(false);
    }
  };

  const toggleTranscript = (qId: string) => {
    const next = new Set(expandedTranscript);
    if (next.has(qId)) {
      next.delete(qId);
    } else {
      next.add(qId);
    }
    setExpandedTranscript(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-xs font-mono text-white/40">Loading Candidate Dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-300 font-mono">{error || 'Dossier not found.'}</p>
        <button
          onClick={() => navigate('/hr')}
          className="mt-4 px-4 py-2 text-xs font-mono bg-white/5 text-white/60 rounded-lg border border-white/10 hover:text-white cursor-pointer"
        >
          ← Back to Pipeline
        </button>
      </div>
    );
  }

  const app = dossier.application;
  const signals = dossier.signals || [];
  const transcript = dossier.transcript || [];

  const matchScore = app.match_score;
  const overallScore = app.overall_score;
  const strengths: string[] = app.strengths_summary || [];
  const gaps: string[] = app.gaps_summary || [];
  const interviewStrengths: string[] = app.interview_strengths || [];
  const interviewWeaknesses: string[] = app.interview_weaknesses || [];
  const recommendation = app.interview_recommendation;
  const breakdown = app.breakdown || {};

  const statusOptions = [
    'applied', 'shortlisted', 'rejected_at_screening', 'pending_rejection_review',
    'assessment_pending', 'assessment_in_progress', 'assessment_completed',
    'recommended', 'not_recommended',
  ];

  return (
    <div>
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/hr')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white/70 transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to ATS Pipeline
      </button>

      {/* Header Card */}
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/8 mb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold text-white">
                  {app.candidate_name || 'Unknown Candidate'}
                </h1>
                <div className="flex items-center gap-3 text-xs text-white/40 font-mono mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {app.candidate_email}
                  </span>
                  {app.mobile && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {app.mobile}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-mono text-white/30">
              {app.college && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded border border-white/8">
                  <GraduationCap className="w-3 h-3" /> {app.college}
                </span>
              )}
              {app.degree && (
                <span className="px-2 py-0.5 bg-white/5 rounded border border-white/8">
                  {app.degree}
                </span>
              )}
              {app.grad_year && (
                <span className="px-2 py-0.5 bg-white/5 rounded border border-white/8">
                  Class of {app.grad_year}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusOverrideOpen(!statusOverrideOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-white/60 border border-white/10 hover:border-blue-500/20 hover:text-white transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Override Status
            </button>
            <button
              onClick={handleResetMagicLink}
              disabled={resetLinkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-white/60 border border-white/10 hover:border-amber-500/20 hover:text-amber-300 transition-all cursor-pointer disabled:opacity-40"
            >
              {resetLinkLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              Reset Magic Link
            </button>
          </div>
        </div>

        {/* Job Info */}
        <div className="mt-4 pt-4 border-t border-white/6 flex items-center gap-4 text-xs font-mono text-white/40">
          <span className="inline-flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> {app.job_title}
          </span>
          {app.job_dept && <span>· {app.job_dept}</span>}
          <span>· Applied {new Date(app.created_at).toLocaleDateString()}</span>
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              app.status === 'recommended'
                ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20'
                : app.status === 'not_recommended' || app.status === 'rejected_at_screening'
                ? 'bg-red-500/12 text-red-300 border-red-500/20'
                : 'bg-blue-500/12 text-blue-300 border-blue-500/20'
            }`}
          >
            {app.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Status Override Modal */}
      {statusOverrideOpen && (
        <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-blue-500/15">
          <h3 className="text-sm font-semibold text-white mb-3">Manual Status Override</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500/40"
              >
                <option value="">Select status...</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">
                Audit Note (Required)
              </label>
              <input
                type="text"
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="Reason for status change..."
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/25 font-mono focus:outline-none focus:border-blue-500/40"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setStatusOverrideOpen(false)}
              className="px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white/70 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusOverride}
              disabled={statusUpdating || !newStatus || !auditNote.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20 hover:bg-blue-500/25 transition-all cursor-pointer disabled:opacity-40"
            >
              {statusUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Apply Override
            </button>
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* AI Explanation Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            AI Pre-Screening Explanation
          </h2>

          {matchScore !== null ? (
            <>
              {/* Match Score Gauge */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={matchScore >= 80 ? '#34d399' : matchScore >= 60 ? '#fbbf24' : '#f87171'}
                      strokeWidth="3"
                      strokeDasharray={`${matchScore}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold font-mono text-white">{matchScore}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
                    JD Match Score
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">
                    Threshold: {app.screening_threshold || 70}%
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {strengths.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
                    Strengths
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {strengths.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/15 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {gaps.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
                    Skill Gaps
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {gaps.map((g, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/15 font-mono"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Rationale */}
              {app.full_rationale_json && (
                <div className="mt-3 pt-3 border-t border-white/6">
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
                    AI Rationale
                  </h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {typeof app.full_rationale_json === 'string'
                      ? app.full_rationale_json
                      : app.full_rationale_json.fitRationale ||
                        app.full_rationale_json.rationale ||
                        JSON.stringify(app.full_rationale_json, null, 2)}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-white/30 font-mono py-4">
              No AI pre-screening results available for this application.
            </p>
          )}
        </div>

        {/* Interview Assessment Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Interview Assessment
          </h2>

          {overallScore !== null ? (
            <>
              {/* Overall Score */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold font-mono text-white">
                  {overallScore}
                  <span className="text-sm text-white/30">/100</span>
                </div>
                {recommendation && (
                  <span
                    className={`text-xs px-3 py-1 rounded-lg font-mono font-bold border ${
                      recommendation === 'strong_hire' || recommendation === 'hire'
                        ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20'
                        : recommendation === 'weak_hire'
                        ? 'bg-amber-500/12 text-amber-300 border-amber-500/20'
                        : 'bg-red-500/12 text-red-300 border-red-500/20'
                    }`}
                  >
                    {recommendation === 'strong_hire' && '⬆ Strong Hire'}
                    {recommendation === 'hire' && '✓ Hire'}
                    {recommendation === 'weak_hire' && '~ Weak Hire'}
                    {recommendation === 'no_hire' && '✗ No Hire'}
                  </span>
                )}
              </div>

              {/* Breakdown */}
              {breakdown && typeof breakdown === 'object' && Object.keys(breakdown).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">
                    Score Breakdown
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(breakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40 font-mono w-24 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${Math.min(Number(value) || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/50 font-mono w-8 text-right">
                          {Number(value) || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Strengths / Weaknesses */}
              <div className="grid gap-3 sm:grid-cols-2 mt-3 pt-3 border-t border-white/6">
                {interviewStrengths.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">
                      Interview Strengths
                    </h4>
                    {interviewStrengths.map((s, i) => (
                      <div key={i} className="text-xs text-emerald-300/60 flex items-start gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" /> {s}
                      </div>
                    ))}
                  </div>
                )}
                {interviewWeaknesses.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">
                      Areas for Growth
                    </h4>
                    {interviewWeaknesses.map((w, i) => (
                      <div key={i} className="text-xs text-red-300/60 flex items-start gap-1 mt-1">
                        <XCircle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-white/30 font-mono py-4">
              Assessment not yet completed for this candidate.
            </p>
          )}
        </div>
      </div>

      {/* Anti-Cheat Integrity Signals */}
      <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Integrity & Anti-Cheat Signals
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 font-mono">
              {signals.length}
            </span>
          </h2>
          {signals.length > 0 && (
            <button
              onClick={() => handleClearTelemetry()}
              disabled={clearTelemetryLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono bg-red-500/10 text-red-300 border border-red-500/15 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              {clearTelemetryLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Clear All (False Positive)
            </button>
          )}
        </div>

        {signals.length > 0 ? (
          <div className="space-y-1">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sig.signal_type === 'tab_blur'
                        ? 'bg-amber-400'
                        : sig.signal_type === 'window_switch'
                        ? 'bg-red-400'
                        : sig.signal_type === 'copy_paste'
                        ? 'bg-purple-400'
                        : 'bg-white/30'
                    }`}
                  />
                  <span className="font-mono text-white/60">
                    {sig.signal_type?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-white/25 font-mono">
                    {sig.timestamp ? new Date(sig.timestamp).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <button
                  onClick={() => handleClearTelemetry(sig.id)}
                  className="text-[9px] font-mono text-white/25 hover:text-red-300 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400/40 mx-auto mb-1" />
            <p className="text-xs text-white/30 font-mono">No integrity signals flagged.</p>
          </div>
        )}
      </div>

      {/* Interview Transcript */}
      <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/8">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          Interview Transcript
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 font-mono">
            {transcript.length} Q&A
          </span>
        </h2>

        {transcript.length > 0 ? (
          <div className="space-y-2">
            {transcript.map((qa, idx) => {
              const isExpanded = expandedTranscript.has(qa.question_id);
              return (
                <div
                  key={qa.question_id}
                  id={`qa-${qa.question_id}`}
                  className="rounded-lg bg-white/[0.02] border border-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => toggleTranscript(qa.question_id)}
                    className="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/25 w-6">
                        Q{(qa.question_index ?? idx) + 1}
                      </span>
                      <span className="text-xs text-white/60 line-clamp-1">
                        {qa.question_text || 'Question unavailable'}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/25 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/25 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-white/5">
                      {/* Question */}
                      <div className="mt-2 p-2 rounded-md bg-blue-500/5 border border-blue-500/10">
                        <div className="text-[9px] font-mono text-blue-300/50 uppercase mb-1">Question</div>
                        <p className="text-xs text-white/60 leading-relaxed">{qa.question_text}</p>
                        {qa.generated_at && (
                          <div className="text-[9px] text-white/20 font-mono mt-1">
                            {new Date(qa.generated_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Response */}
                      <div className="mt-2 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-[9px] font-mono text-emerald-300/50 uppercase mb-1">
                          Candidate Response
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {qa.response_text || <span className="italic text-white/25">No response recorded</span>}
                        </p>
                        {qa.submitted_at && (
                          <div className="text-[9px] text-white/20 font-mono mt-1">
                            {new Date(qa.submitted_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-white/30 font-mono py-4 text-center">
            No interview transcript available.
          </p>
        )}
      </div>

      {/* Resume Text (collapsed) */}
      {app.raw_resume_text && (
        <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/40" />
            Raw Resume Text
          </h2>
          <pre className="text-[10px] text-white/30 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {app.raw_resume_text}
          </pre>
        </div>
      )}
    </div>
  );
}
