import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Users,
  Clock,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileCheck,
  RotateCcw,
  Send,
  Building,
  Coins,
  ArrowRight,
  Filter
} from 'lucide-react';
import { getRbacFetchHeaders, getActiveRoleProfile } from '../../utils/rbacClient';

interface JobRequisition {
  id: string;
  title: string;
  department: string;
  description: string;
  requirementsJson: string[];
  screeningThreshold: number;
  status: string; // 'draft' | 'pending_finance' | 'pending_tech_lead' | 'active' | 'published'
  tokenBudget?: number;
  approvalFeedback?: string;
  financeApprovedBy?: string;
  techApprovedBy?: string;
  createdAt: string;
  applicantCount: number;
  activeCount: number;
}

interface MagicLinkModalData {
  jobTitle: string;
  department: string;
  token: string;
  magicLink: string;
  candidatePath: string;
  expiresAt: string;
}

export function HrJobsPage() {
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'pending' | 'draft'>('all');

  // Active RBAC role
  const [activeRole, setActiveRole] = useState(getActiveRoleProfile());

  useEffect(() => {
    const handleRoleChanged = (e: any) => {
      setActiveRole(e.detail || getActiveRoleProfile());
      fetchJobs();
    };
    window.addEventListener('ravengard_role_changed', handleRoleChanged);
    return () => window.removeEventListener('ravengard_role_changed', handleRoleChanged);
  }, []);

  // New Job Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newThreshold, setNewThreshold] = useState(70);
  const [newTokenBudget, setNewTokenBudget] = useState(250000);
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState<string[]>([
    'Distributed Consensus',
    'High-Concurrency Execution',
    'Fault-Tolerant Architecture'
  ]);
  const [currentReqInput, setCurrentReqInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Rejection Notes Modal State
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Magic Link Modal state
  const [magicModalData, setMagicModalData] = useState<MagicLinkModalData | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingForJobId, setGeneratingForJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/jobs', {
        headers: getRbacFetchHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch job requisitions');
      }
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message || 'Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setFormError('Please provide both a job title and description.');
      return;
    }

    try {
      setCreating(true);
      setFormError(null);
      const res = await fetch('/api/hr/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getRbacFetchHeaders(),
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          department: newDepartment.trim(),
          screeningThreshold: newThreshold,
          tokenBudget: Number(newTokenBudget) || 250000,
          description: newDescription.trim(),
          requirements: newRequirements,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      setJobs((prev) => [data.job, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Error creating job');
    } finally {
      setCreating(false);
    }
  };

  // State Machine Action Handlers
  const handleSubmitForApproval = async (jobId: string) => {
    try {
      setActionLoadingId(jobId);
      const res = await fetch(`/api/hr/jobs/${jobId}/submit-approval`, {
        method: 'POST',
        headers: getRbacFetchHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit requisition for finance review.');
      }
      const data = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: data.job.status } : j)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveFinance = async (jobId: string) => {
    try {
      setActionLoadingId(jobId);
      const res = await fetch(`/api/hr/jobs/${jobId}/approve-finance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getRbacFetchHeaders(),
        },
        body: JSON.stringify({ approvedBudget: 250000 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to approve token budget.');
      }
      const data = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: data.job.status, financeApprovedBy: data.job.finance_approved_by } : j)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveTechLead = async (jobId: string) => {
    try {
      setActionLoadingId(jobId);
      const res = await fetch(`/api/hr/jobs/${jobId}/approve-tech-lead`, {
        method: 'POST',
        headers: getRbacFetchHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to approve AI rubric criteria.');
      }
      const data = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: data.job.status, techApprovedBy: data.job.tech_approved_by } : j)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectToDraft = async () => {
    if (!rejectingJobId) return;
    if (!rejectionNotes.trim()) {
      alert('Reviewer feedback notes are required to revert requisition to draft.');
      return;
    }

    try {
      setActionLoadingId(rejectingJobId);
      const res = await fetch(`/api/hr/jobs/${rejectingJobId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getRbacFetchHeaders(),
        },
        body: JSON.stringify({ feedback: rejectionNotes.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reject requisition.');
      }
      const data = await res.json();
      setJobs((prev) =>
        prev.map((j) => (j.id === rejectingJobId ? { ...j, status: 'draft', approvalFeedback: rejectionNotes.trim() } : j))
      );
      setRejectingJobId(null);
      setRejectionNotes('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateMagicLink = async (job: JobRequisition) => {
    try {
      setGeneratingForJobId(job.id);
      const res = await fetch(`/api/hr/jobs/${job.id}/magic-link`, {
        method: 'POST',
        headers: getRbacFetchHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to generate magic link');
      }

      const data = await res.json();
      setMagicModalData({
        jobTitle: job.title,
        department: job.department,
        token: data.token,
        magicLink: data.magicLink,
        candidatePath: data.candidatePath,
        expiresAt: data.expiresAt,
      });
      setCopied(false);
    } catch (err: any) {
      alert(err.message || 'Error generating link');
    } finally {
      setGeneratingForJobId(null);
    }
  };

  const handleCopyLink = () => {
    if (!magicModalData) return;
    navigator.clipboard.writeText(magicModalData.magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredJobs = jobs.filter((j) => {
    if (filterTab === 'published') return j.status === 'active' || j.status === 'published';
    if (filterTab === 'pending') return j.status === 'pending_finance' || j.status === 'pending_tech_lead';
    if (filterTab === 'draft') return j.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[11px] font-mono uppercase tracking-wider font-semibold border border-blue-500/20">
              Workday-Grade Approval Chain
            </span>
            <span className="text-xs text-white/40 font-mono">
              Active Context: {activeRole.name} ({activeRole.department})
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-light text-white tracking-wide">
            Requisition Approvals & Publishing
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl font-sans">
            Multi-stage stakeholder approval state machine: Draft $\rightarrow$ Finance Budget Check $\rightarrow$ Tech Lead Rubric Review $\rightarrow$ Published.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs font-mono transition-all shadow-lg shadow-amber-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Requisition</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-white text-slate-950 font-bold shadow-sm'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          All Requisitions ({jobs.length})
        </button>
        <button
          onClick={() => setFilterTab('published')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            filterTab === 'published'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          Published ({jobs.filter((j) => j.status === 'active' || j.status === 'published').length})
        </button>
        <button
          onClick={() => setFilterTab('pending')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            filterTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          Pending Approvals ({jobs.filter((j) => j.status === 'pending_finance' || j.status === 'pending_tech_lead').length})
        </button>
        <button
          onClick={() => setFilterTab('draft')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            filterTab === 'draft'
              ? 'bg-slate-300 text-slate-950 font-bold shadow-sm'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          Drafts ({jobs.filter((j) => j.status === 'draft').length})
        </button>
      </div>

      {/* Jobs Listing Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-white/40 tracking-wider uppercase">Loading Open Requisitions...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
          <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-base text-white/70 font-medium">No requisitions found in this filter.</p>
          <p className="text-sm text-white/40 mt-1">Create a new requisition or switch role in the toolbar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const isDraft = job.status === 'draft';
            const isPendingFinance = job.status === 'pending_finance';
            const isPendingTech = job.status === 'pending_tech_lead';
            const isPublished = job.status === 'active' || job.status === 'published';

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between hover:border-white/20 transition-all hover:shadow-xl hover:shadow-black/40 group relative overflow-hidden"
              >
                <div>
                  {/* Top Meta & Department */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-white/70 tracking-wider uppercase bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                        {job.department}
                      </span>
                      {job.tokenBudget && (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {job.tokenBudget.toLocaleString()} tokens
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
                        isPublished
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : isPendingFinance
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : isPendingTech
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : 'bg-white/10 text-white/60 border-white/10'
                      }`}
                    >
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-white leading-snug group-hover:text-blue-300 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs text-white/60 mt-2 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Multi-Stage Approval State Machine Visualizer */}
                  <div className="mt-5 p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-2">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
                      <span>Approval Pipeline</span>
                      <span>Stage Progression</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono pt-1">
                      {/* Step 1: Draft */}
                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isDraft
                            ? 'bg-white/10 text-white border-white/20 font-bold'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        <div className="text-[9px] opacity-60">Stage 1</div>
                        <div>Draft</div>
                      </div>

                      {/* Step 2: Finance */}
                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isPendingFinance
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold animate-pulse'
                            : isPendingTech || isPublished
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-white/5 text-white/30 border-white/5'
                        }`}
                      >
                        <div className="text-[9px] opacity-60">Stage 2</div>
                        <div>Finance</div>
                      </div>

                      {/* Step 3: Tech Lead */}
                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isPendingTech
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold animate-pulse'
                            : isPublished
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-white/5 text-white/30 border-white/5'
                        }`}
                      >
                        <div className="text-[9px] opacity-60">Stage 3</div>
                        <div>Tech Lead</div>
                      </div>

                      {/* Step 4: Published */}
                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isPublished
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                            : 'bg-white/5 text-white/30 border-white/5'
                        }`}
                      >
                        <div className="text-[9px] opacity-60">Stage 4</div>
                        <div>Live</div>
                      </div>
                    </div>

                    {/* Rejection / Feedback Note if Reverted */}
                    {job.approvalFeedback && isDraft && (
                      <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-sans flex items-start gap-2">
                        <RotateCcw className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold font-mono">Reviewer Rejection Note: </span>
                          <span>"{job.approvalFeedback}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Section */}
                <div className="pt-5 mt-5 border-t border-white/10 space-y-3">
                  {/* Contextual Approval Controls */}
                  {isDraft && (
                    <button
                      onClick={() => handleSubmitForApproval(job.id)}
                      disabled={actionLoadingId === job.id}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-blue-950/20 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Finance Token Approval</span>
                    </button>
                  )}

                  {isPendingFinance && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveFinance(job.id)}
                        disabled={actionLoadingId === job.id}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                        title="Authorize LLM Token allocation"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Approve Budget</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingJobId(job.id);
                          setRejectionNotes('');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-white/70 font-mono text-xs transition-all border border-white/10 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reject to Draft</span>
                      </button>
                    </div>
                  )}

                  {isPendingTech && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveTechLead(job.id)}
                        disabled={actionLoadingId === job.id}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                        title="Authorize AI Rubric Criteria and Publish Requisition"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Approve & Publish</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingJobId(job.id);
                          setRejectionNotes('');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-white/70 font-mono text-xs transition-all border border-white/10 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reject to Draft</span>
                      </button>
                    </div>
                  )}

                  {isPublished && (
                    <button
                      onClick={() => handleGenerateMagicLink(job)}
                      disabled={generatingForJobId === job.id}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-all border border-white/10 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {generatingForJobId === job.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Minting Invitation Token...</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span>Generate Magic Invitation Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: Rejection Feedback Note Modal ────────────────────── */}
      <AnimatePresence>
        {rejectingJobId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141a] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setRejectingJobId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Revert Requisition to Draft</h3>
                  <p className="text-xs text-white/50 font-mono">Workday compliance requires actionable feedback.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Feedback & Revision Instructions *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="e.g., Token budget exceeds Q3 engineering allocation. Reduce candidate pipeline cutoff or revise prompt weights."
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-rose-500/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setRejectingJobId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectToDraft}
                    disabled={!rejectionNotes.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-950/20"
                  >
                    Confirm Reversion to Draft
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: Create New Job Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141a] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Create Job Requisition</h3>
                  <p className="text-xs text-white/50 font-mono">Starts in Stage 1 (Draft) pending approval chain.</p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Staff Distributed Systems Architect"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">Department</label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500/40"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">Token Budget</label>
                    <input
                      type="number"
                      value={newTokenBudget}
                      onChange={(e) => setNewTokenBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">Job Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe role responsibilities and distributed systems focus..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-950/20"
                  >
                    {creating ? 'Saving Requisition...' : 'Create Draft'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: Magic Link Generation Modal ──────────────────────── */}
      <AnimatePresence>
        {magicModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141a] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setMagicModalData(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Cryptographic Magic Link</h3>
                  <p className="text-xs text-white/50 font-mono">{magicModalData.jobTitle}</p>
                </div>
              </div>

              <div className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs break-all text-white/80 select-all mb-4">
                {magicModalData.magicLink}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-white/40 mb-5">
                <span>Single-Use Token</span>
                <span>Expires in 7 days</span>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950/20"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Magic Invitation Link'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
