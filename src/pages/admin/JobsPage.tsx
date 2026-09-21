import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';

interface JobRequisition {
  id: string;
  title: string;
  department: string;
  description: string;
  requirementsJson: string[];
  screeningThreshold: number;
  status: string;
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

export function JobsPage() {
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Job Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Infrastructure & Platform');
  const [newThreshold, setNewThreshold] = useState(70);
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('Distributed Consensus, High-Concurrency Execution, Fault-Tolerant Architecture');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Magic Link Modal state
  const [magicModalData, setMagicModalData] = useState<MagicLinkModalData | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingForJobId, setGeneratingForJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ravengard_admin_token');
      const res = await fetch('/api/admin/jobs', {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = localStorage.getItem('ravengard_admin_token');
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          department: newDepartment.trim(),
          screeningThreshold: newThreshold,
          description: newDescription.trim(),
          requirements: newRequirements.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      setJobs(prev => [data.job, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Error creating job');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateMagicLink = async (job: JobRequisition) => {
    try {
      setGeneratingForJobId(job.id);
      const token = localStorage.getItem('ravengard_admin_token');
      const res = await fetch(`/api/admin/jobs/${job.id}/magic-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
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
        expiresAt: data.expiresAt
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-[11px] font-mono uppercase tracking-wider font-semibold border border-[var(--color-secondary)]/20">
              Requisition Control
            </span>
            <span className="text-xs text-white/40 font-mono">Phase 7 HR Module</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-light text-white tracking-wide">
            Job Requisitions & Magic Links
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl font-sans">
            Configure open roles, define minimum rubric criteria, and generate single-use cryptographic invitation tokens for pre-screened engineering candidates.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Job Opening</span>
        </button>
      </div>

      {/* Main Jobs Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-secondary)] rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-white/40 tracking-wider uppercase">Loading Open Requisitions...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
          <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-base text-white/70 font-medium">No job openings created yet.</p>
          <p className="text-sm text-white/40 mt-1">Create your first role to start generating magic interview tokens.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors"
          >
            + Create First Role
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between hover:border-white/20 transition-all hover:shadow-xl hover:shadow-black/40 group"
            >
              <div>
                {/* Top Role Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono text-white/50 tracking-wider uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {job.department}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Job Title */}
                <h3 className="text-lg font-medium text-white group-hover:text-[var(--color-secondary)] transition-colors leading-snug">
                  {job.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-white/60 mt-2 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Requirements / Competency Tags */}
                {Array.isArray(job.requirementsJson) && job.requirementsJson.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {job.requirementsJson.slice(0, 3).map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                      >
                        {req}
                      </span>
                    ))}
                    {job.requirementsJson.length > 3 && (
                      <span className="text-[10px] font-mono text-white/40 px-1 py-0.5">
                        +{job.requirementsJson.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Metrics & Actions */}
              <div className="pt-5 mt-5 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-3.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-white/40" />
                    <span>{job.applicantCount} Submissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400/80" />
                    <span className="text-amber-400/90">Cutoff: {job.screeningThreshold}%</span>
                  </div>
                </div>

                {/* Generate Magic Link Button */}
                <button
                  onClick={() => handleGenerateMagicLink(job)}
                  disabled={generatingForJobId === job.id}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/15 text-white text-xs font-mono transition-all border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  {generatingForJobId === job.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Minting Token...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                      <span>Generate Magic Link</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── MODAL: Generate Magic Link Modal ─────────────────────────────── */}
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
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Unique Candidate Magic Link</h2>
                  <p className="text-xs text-white/50 font-mono">{magicModalData.jobTitle}</p>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed mb-4 font-sans">
                This single-use cryptographic URL bypasses generic queues and locks directly into the candidate assessment pipeline with pre-configured rubric criteria.
              </p>

              {/* URL Box */}
              <div className="p-3 bg-black/60 border border-white/10 rounded-xl mb-4 font-mono text-xs">
                <div className="flex items-center justify-between text-white/40 mb-1.5 text-[10px] uppercase tracking-wider">
                  <span>Candidate Access Endpoint</span>
                  <span className="text-emerald-400">Valid for 7 Days</span>
                </div>
                <div className="break-all select-all text-amber-200/90 font-mono text-[11px] bg-white/[0.03] p-2 rounded border border-white/5">
                  {magicModalData.magicLink}
                </div>
              </div>

              {/* Token Details */}
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 mb-6">
                <span>Token UUID:</span>
                <span className="text-white/80 select-all">{magicModalData.token}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-amber-400 hover:bg-amber-300 text-black'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Magic Link</span>
                    </>
                  )}
                </button>

                <a
                  href={magicModalData.candidatePath}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: Create New Job Opening ───────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141a] border border-white/20 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-secondary)]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Create New Job Opening</h2>
                  <p className="text-xs text-white/50 font-mono">Define technical profile and baseline cutoff</p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
                    Job Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Senior Distributed Systems Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
                      Department
                    </label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-sans"
                    >
                      <option value="Infrastructure & Platform">Infrastructure & Platform</option>
                      <option value="Core Services & Backend">Core Services & Backend</option>
                      <option value="Security & Compliance">Security & Compliance</option>
                      <option value="Full Stack & Product">Full Stack & Product</option>
                      <option value="Machine Learning / Systems">Machine Learning / Systems</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
                      Cutoff Threshold ({newThreshold}%)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
                    Required Competencies (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Distributed Consensus, High-Concurrency Execution, Memory Management"
                    value={newRequirements}
                    onChange={(e) => setNewRequirements(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
                    Job Description & Role Mission <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Summarize the core technical challenges, scale requirements, and mission for this role..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-sans leading-relaxed resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? 'Creating Requisition...' : 'Publish Opening'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
