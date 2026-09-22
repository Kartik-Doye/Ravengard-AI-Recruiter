import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Eye,
  EyeOff,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Code,
  Shield,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
  X,
  Filter
} from 'lucide-react';

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  college: string | null;
  degree: string | null;
  gradYear: number | null;
  appliedRole: string;
  status: string;
  submissionDate: string;
  overallScore: number | null;
  recommendation: string | null;
  sessionId: string | null;
}

interface ExecutiveDigestData {
  candidate: CandidateRow;
  breakdown: {
    architecture: { score: number; bullet: string };
    codeExecution: { score: number; bullet: string };
    systemTradeOffs: { score: number; bullet: string };
  };
  verbatimWorkSample: string;
  atsPayload: {
    greenhouse: any;
    lever: any;
  };
}

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [blindMode, setBlindMode] = useState(false);

  // Executive Digest Modal
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestData, setDigestData] = useState<ExecutiveDigestData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // ATS Export Dropdown
  const [activeExportDropdown, setActiveExportDropdown] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ravengard_admin_token');
      const res = await fetch('/api/admin/candidates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load candidate roster');
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err: any) {
      setError(err.message || 'Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openExecutiveDigest = async (candidateId: string) => {
    try {
      setSelectedCandidateId(candidateId);
      setDigestLoading(true);
      const token = localStorage.getItem('ravengard_admin_token');
      const res = await fetch(`/api/admin/candidates/${candidateId}/executive-digest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch executive digest');
      const data = await res.json();
      setDigestData(data);
    } catch (err: any) {
      alert(err.message || 'Error loading executive digest');
    } finally {
      setDigestLoading(false);
    }
  };

  const handleExportATS = (candidate: CandidateRow, format: 'greenhouse' | 'lever' | 'pdf') => {
    const filename = `scorecard-${(blindMode ? `candidate-${candidate.id.slice(0, 6)}` : candidate.name.toLowerCase().replace(/\s+/g, '-'))}-${format}`;
    
    if (format === 'pdf') {
      window.print();
      return;
    }

    const payload = digestData?.atsPayload?.[format] || {
      ats: format,
      candidate: {
        id: candidate.id,
        name: blindMode ? `Candidate #${candidate.id.slice(0, 6).toUpperCase()}` : candidate.name,
        role: candidate.appliedRole,
        score: candidate.overallScore
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setExportFeedback(`Exported to ${format.toUpperCase()}`);
    setTimeout(() => setExportFeedback(null), 3000);
    setActiveExportDropdown(null);
  };

  const handleCopyWorkSample = () => {
    if (!digestData) return;
    navigator.clipboard.writeText(digestData.verbatimWorkSample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.appliedRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.college && c.college.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        c.status.toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const getMaskedName = (c: CandidateRow) => {
    if (!blindMode) return c.name;
    return `Candidate #${c.id.slice(0, 6).toUpperCase()}`;
  };

  const getMaskedEmail = (c: CandidateRow) => {
    if (!blindMode) return c.email;
    return `redacted-${c.id.slice(0, 4)}@audit.internal`;
  };

  const getMaskedCollege = (c: CandidateRow) => {
    if (!blindMode) return c.college || '—';
    return '[Institution Masked for Blind Scoring]';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-[11px] font-mono uppercase tracking-wider font-semibold border border-[var(--color-secondary)]/20">
              Candidate Submissions
            </span>
            <span className="text-xs text-white/40 font-mono">Phase 7 Recruiter Ledger</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-light text-white tracking-wide">
            Candidate Scorecards & Executive Digest
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl font-sans">
            Review verified engineering submissions, evaluate objective rubric criteria, and launch 1-minute executive digests with work-sample code verification.
          </p>
        </div>

        {/* Global Blind Evaluation Mode Toggle */}
        <div className="flex items-center gap-3 bg-white/[0.04] p-2 rounded-xl border border-white/10">
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              blindMode
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            {blindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-white/40" />}
            <span>Blind Evaluation Mode: {blindMode ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Blind Mode Notice Banner */}
      <AnimatePresence>
        {blindMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Blind Evaluation Active — Candidate names, universities, and demographic identifiers are cryptographically masked to eliminate bias.
              </span>
            </div>
            <button
              onClick={() => setBlindMode(false)}
              className="text-[11px] underline hover:text-white cursor-pointer ml-4"
            >
              Disable
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-3.5 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role, university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-mono text-white/40">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Recommended">Recommended</option>
            <option value="Under Review">Under Review</option>
            <option value="Assessment">In Assessment</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Toast Feedback */}
      {exportFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-lg font-mono text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Submissions Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono uppercase tracking-wider text-white/50">
                <th className="p-4 font-medium">Applicant Name</th>
                <th className="p-4 font-medium">Applied Job Role</th>
                <th className="p-4 font-medium">Scorecard</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Submission Date</th>
                <th className="p-4 font-medium text-right">Evaluation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-white/40 font-mono text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin"></div>
                      <span>Loading Candidate Ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-white/40 font-mono text-xs">
                    No matching candidates found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const isRecommended = cand.recommendation === 'Proceed' || cand.status === 'Recommended';
                  const isUnderReview = cand.recommendation === 'Review' || cand.status === 'Under Review';
                  const isDeclined = cand.recommendation === 'Reject' || cand.status === 'Declined';

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                    >
                      {/* Name & Academic Background */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-white/70">
                            {blindMode ? '#' : cand.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-medium text-white group-hover:text-[var(--color-secondary)] transition-colors">
                              {getMaskedName(cand)}
                            </div>
                            <div className="text-[11px] text-white/40 font-mono">
                              {getMaskedCollege(cand)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Applied Job Role */}
                      <td className="p-4">
                        <span className="text-xs text-white/80 font-medium">
                          {cand.appliedRole}
                        </span>
                      </td>

                      {/* Overall Score */}
                      <td className="p-4">
                        {cand.overallScore !== null ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs font-semibold">
                            <span
                              className={
                                cand.overallScore >= 80
                                  ? 'text-emerald-400'
                                  : cand.overallScore >= 60
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }
                            >
                              {cand.overallScore}
                            </span>
                            <span className="text-white/30 text-[10px]">/100</span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-white/30">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                            isRecommended
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isUnderReview
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : isDeclined
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-white/5 text-white/60 border-white/10'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRecommended
                                ? 'bg-emerald-400'
                                : isUnderReview
                                ? 'bg-amber-400'
                                : isDeclined
                                ? 'bg-red-400'
                                : 'bg-white/40'
                            }`}
                          ></span>
                          {cand.status}
                        </span>
                      </td>

                      {/* Submission Date */}
                      <td className="p-4 text-xs font-mono text-white/50">
                        {new Date(cand.submissionDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1-Minute Executive Digest Button */}
                          <button
                            onClick={() => openExecutiveDigest(cand.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-medium transition-colors shadow-sm cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>1-Min Digest</span>
                          </button>

                          {/* Export to ATS Dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveExportDropdown(activeExportDropdown === cand.id ? null : cand.id);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                              title="Export Scorecard"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {activeExportDropdown === cand.id && (
                              <div className="absolute right-0 mt-2 w-44 bg-[#16181f] border border-white/20 rounded-xl shadow-2xl py-1 z-30 font-mono text-xs">
                                <div className="px-3 py-1.5 text-[10px] text-white/40 uppercase tracking-wider border-b border-white/10">
                                  Export to ATS
                                </div>
                                <button
                                  onClick={() => handleExportATS(cand, 'greenhouse')}
                                  className="w-full px-3 py-2 text-left hover:bg-white/5 text-white/80 hover:text-white flex items-center justify-between"
                                >
                                  <span>Greenhouse (API)</span>
                                  <span className="text-[10px] text-emerald-400 font-mono">JSON</span>
                                </button>
                                <button
                                  onClick={() => handleExportATS(cand, 'lever')}
                                  className="w-full px-3 py-2 text-left hover:bg-white/5 text-white/80 hover:text-white flex items-center justify-between"
                                >
                                  <span>Lever (API)</span>
                                  <span className="text-[10px] text-blue-400 font-mono">JSON</span>
                                </button>
                                <button
                                  onClick={() => handleExportATS(cand, 'pdf')}
                                  className="w-full px-3 py-2 text-left hover:bg-white/5 text-white/80 hover:text-white flex items-center justify-between"
                                >
                                  <span>Print / PDF</span>
                                  <Printer className="w-3 h-3 text-white/40" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 1-MINUTE EXECUTIVE DIGEST MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {selectedCandidateId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141a] border border-white/20 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedCandidateId(null);
                  setDigestData(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {digestLoading || !digestData ? (
                <div className="py-24 text-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-3"></div>
                  <span className="text-xs font-mono text-white/50 tracking-wider uppercase">
                    Compiling 1-Minute Executive Digest...
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Header & Blind Mode Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-semibold border border-amber-400/20">
                          1-Minute Executive Digest
                        </span>
                        <span className="text-xs text-white/40 font-mono">Verified Rigor</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-display font-medium text-white">
                        {blindMode ? `Candidate #${digestData.candidate.id.slice(0, 6).toUpperCase()}` : digestData.candidate.name}
                      </h2>
                      <p className="text-xs text-white/60 font-mono mt-0.5">
                        {digestData.candidate.appliedRole} · {blindMode ? '[Institution Redacted]' : (digestData.candidate.college || 'Stanford Graduate')}
                      </p>
                    </div>

                    {/* Overall Score & Blind Switch */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-mono font-semibold text-emerald-400">
                          {digestData.candidate.overallScore}/100
                        </div>
                        <div className="text-[10px] font-mono text-white/40 uppercase">
                          {digestData.candidate.recommendation || 'Proceed'}
                        </div>
                      </div>

                      <button
                        onClick={() => setBlindMode(!blindMode)}
                        className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                          blindMode
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                        }`}
                        title={blindMode ? 'Disable Blind Mode' : 'Enable Blind Mode'}
                      >
                        {blindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Section 1: 3-Bullet Technical Competency Breakdown */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white/80 font-semibold">
                        Technical Competency Breakdown (Core Rubric)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Architecture */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            1. Architecture & System Decomposition
                          </span>
                          <span className="text-xs font-mono text-emerald-400 font-semibold">
                            {digestData.breakdown.architecture.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed font-sans pl-3 border-l border-emerald-400/30">
                          {digestData.breakdown.architecture.bullet}
                        </p>
                      </div>

                      {/* Code Execution */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            2. Code Execution & Deterministic Testing
                          </span>
                          <span className="text-xs font-mono text-blue-400 font-semibold">
                            {digestData.breakdown.codeExecution.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed font-sans pl-3 border-l border-blue-400/30">
                          {digestData.breakdown.codeExecution.bullet}
                        </p>
                      </div>

                      {/* System Trade-offs */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            3. System Trade-offs & Fault Tolerance
                          </span>
                          <span className="text-xs font-mono text-amber-400 font-semibold">
                            {digestData.breakdown.systemTradeOffs.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed font-sans pl-3 border-l border-amber-400/30">
                          {digestData.breakdown.systemTradeOffs.bullet}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Verbatim Work-Sample Snippet */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-[var(--color-secondary)]" />
                        <h3 className="text-xs font-mono uppercase tracking-wider text-white/80 font-semibold">
                          Verbatim Candidate Work-Sample Snippet
                        </h3>
                      </div>

                      <button
                        onClick={handleCopyWorkSample}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-white/70 transition-colors cursor-pointer border border-white/10"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Snippet'}</span>
                      </button>
                    </div>

                    <div className="rounded-xl bg-black/80 border border-white/10 p-4 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed text-emerald-300/90 shadow-inner">
                      <pre>
                        <code>{digestData.verbatimWorkSample}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Section 3: One-Click ATS Export Toolbar */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-white/50 font-mono">
                      Export structured candidate dossier directly into enterprise ATS:
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleExportATS(digestData.candidate, 'greenhouse')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-mono text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Greenhouse</span>
                      </button>

                      <button
                        onClick={() => handleExportATS(digestData.candidate, 'lever')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-mono text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Lever</span>
                      </button>

                      <button
                        onClick={() => handleExportATS(digestData.candidate, 'pdf')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors cursor-pointer border border-white/10"
                      >
                        <Printer className="w-3.5 h-3.5 text-white/50" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
