import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Mail,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  department: string | null;
  description: string;
  requirementsJson: any;
  createdAt: string;
}

export default function Careers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Application Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateMobile, setCandidateMobile] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('B.S. Computer Science');
  const [gradYear, setGradYear] = useState('2025');
  const [resumeText, setResumeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName,
          email: candidateEmail,
          mobile: candidateMobile,
          college,
          degree,
          gradYear: Number(gradYear),
          resumeText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSubmittedAppId(data.applicationId);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.department && j.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-0)] text-white pt-20 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-secondary)]" /> Talent & Engineering Openings
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white font-display leading-[1.1]">
            Autonomous Assessment & Engineering Careers
          </h1>
          <p className="text-base md:text-lg text-white/70 leading-relaxed font-sans max-w-2xl mx-auto">
            Explore active openings, submit your technical credentials, and undergo our asynchronous pre-screening assessment powered by strict competency benchmarks.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 glass-panel p-3 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search engineering positions, departments, or technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-sans"
            />
          </div>
          <span className="text-xs text-white/40 px-3 font-sans">
            {filteredJobs.length} position{filteredJobs.length === 1 ? '' : 's'} available
          </span>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="py-20 text-center text-white/40 text-sm animate-pulse">
              Loading open positions...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-20 text-center text-white/40 text-sm border border-slate-800/80 rounded-2xl glass-panel">
              No open positions found matching your search.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-6 md:p-8 rounded-2xl glass-panel hover:border-slate-700 transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-[var(--color-secondary)]">
                      {job.department || 'Engineering'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Full-Time</span>
                    <span aria-hidden="true">·</span>
                    <span>Remote / Hybrid</span>
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-white group-hover:text-[var(--color-secondary)] transition-colors">
                    {job.title}
                  </h2>
                  <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedJob(job);
                    setSubmittedAppId(null);
                    setSubmitError(null);
                  }}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[var(--color-bg-0)] border border-white/15 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-[var(--color-secondary)] uppercase tracking-wider">
                  Applying for
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedJob.title}</h2>
                <p className="text-xs text-white/50 font-mono">
                  {selectedJob.department || 'Engineering'} • Autonomous AI Pre-Screening Funnel
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {submittedAppId ? (
              /* Success Confirmation */
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Application Received!</h3>
                <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed font-sans">
                  Your resume has been ingested and queued for AI pre-screening against the job competencies. If your profile matches the role threshold, you will receive an invitation email with a single-use 48-hour assessment link.
                </p>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl max-w-xs mx-auto text-xs font-mono text-white/60">
                  Application ID: <span className="text-white font-bold">{submittedAppId}</span>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors"
                  >
                    Done
                  </button>
                  <Link
                    to="/portal"
                    className="px-5 py-2 rounded-xl bg-[var(--color-secondary)] text-black font-semibold text-xs font-mono hover:bg-[var(--color-secondary)]/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Visit Candidate Portal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Application Form */
              <form onSubmit={handleApply} className="space-y-4 text-xs font-mono">
                {submitError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@example.com"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1">Mobile / Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={candidateMobile}
                      onChange={(e) => setCandidateMobile(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">University / College</label>
                    <input
                      type="text"
                      placeholder="Stanford University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Graduation Year</label>
                    <input
                      type="number"
                      placeholder="2025"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/15 rounded-lg text-white focus:border-[var(--color-secondary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">
                    Resume / Curriculum Vitae Text *
                  </label>
                  <p className="text-[10px] text-white/40 mb-1.5 font-sans">
                    Paste your plain text resume or LinkedIn summary here. Our asynchronous matching engine will benchmark your skills against the role requirements.
                  </p>
                  <textarea
                    rows={6}
                    required
                    placeholder="Paste education, work history, projects, and core technical proficiencies (e.g. Node.js, TypeScript, PostgreSQL, Distributed Systems)..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full p-3 bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--color-secondary)] focus:outline-none font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-secondary)] text-black font-semibold hover:bg-[var(--color-secondary)]/90 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
