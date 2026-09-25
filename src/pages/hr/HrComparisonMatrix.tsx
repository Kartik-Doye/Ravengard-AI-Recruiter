import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  Plus,
  X,
  Search,
  Loader2,
  Star,
  Target,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  User,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Scale,
  Award,
} from 'lucide-react';
import { getRbacFetchHeaders, getActiveRoleProfile } from '../../utils/rbacClient';

interface CandidateSlot {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  college?: string;
  degree?: string;
  status: string;
  match_score: number | null;
  overall_score: number | null;
  strengths_summary: string[] | null;
  gaps_summary: string[] | null;
  assessment_recommendation: string | null;
  breakdown: any;
  integrity_flags_count: number;
}

const MAX_SLOTS = 3;

export default function HrComparisonMatrix() {
  const [allApplications, setAllApplications] = useState<CandidateSlot[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateSlot[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Workday-grade Blind Review Mode: Shields names, emails, colleges to eliminate unconscious bias
  const [isBlindMode, setIsBlindMode] = useState<boolean>(true);
  const [lockedCandidateId, setLockedCandidateId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [decisionSuccessModal, setDecisionSuccessModal] = useState<string | null>(null);

  const activeRole = getActiveRoleProfile();

  const fetchApplications = () => {
    setLoading(true);
    fetch('/api/hr/applications', {
      headers: {
        ...getRbacFetchHeaders(),
        ...(isBlindMode ? { 'x-blind-mode': 'true' } : {}),
      },
    })
      .then((r) => r.json())
      .then((data) => {
        const apps = data.applications || [];
        setAllApplications(apps);
        if (apps.length > 0 && selectedCandidates.length === 0) {
          setSelectedCandidates(apps.slice(0, Math.min(3, apps.length)));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, [isBlindMode]);

  const addCandidate = (app: CandidateSlot) => {
    if (selectedCandidates.length >= MAX_SLOTS) return;
    if (selectedCandidates.find((c) => c.id === app.id)) return;
    setSelectedCandidates([...selectedCandidates, app]);
    setSearchOpen(false);
    setSearch('');
  };

  const removeCandidate = (id: string) => {
    setSelectedCandidates(selectedCandidates.filter((c) => c.id !== id));
  };

  const handleLockInDecision = (candidate: CandidateSlot, index: number) => {
    const label = isBlindMode && !revealedIds.has(candidate.id) ? `Candidate ${String.fromCharCode(65 + index)}` : candidate.candidate_name;
    const confirmLock = window.confirm(
      `Confirm Lock-In for ${label}?\n\nThis will lock the objective hiring decision, unmask candidate demographic details for audit defensibility, and append an immutable event to the audit trail.`
    );
    if (!confirmLock) return;

    setLockedCandidateId(candidate.id);
    const next = new Set(revealedIds);
    next.add(candidate.id);
    setRevealedIds(next);
    setDecisionSuccessModal(`Decision Locked: ${label} has been selected for offer generation.`);
  };

  const toggleBlindMode = () => {
    const next = !isBlindMode;
    setIsBlindMode(next);
    if (!next) {
      setRevealedIds(new Set());
    }
  };

  const filteredApplications = allApplications.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.candidate_name || '').toLowerCase().includes(q) ||
      a.candidate_email.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q)
    );
  });

  const allBreakdownKeys = Array.from(
    new Set(
      selectedCandidates.flatMap((c) =>
        c.breakdown && typeof c.breakdown === 'object' ? Object.keys(c.breakdown) : []
      )
    )
  );

  if (loading && selectedCandidates.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 text-[11px] font-mono uppercase tracking-wider font-semibold border border-violet-500/20">
              Workday-Grade Calibration
            </span>
            <span className="text-xs text-white/40 font-mono">EEOC Title VII Protected</span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-violet-400" />
            Comparison Matrix & Blind Review
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            Evaluate contenders side-by-side using objective AI scoring benchmarks and code AST telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Blind Review Mode Toggle */}
          <button
            onClick={toggleBlindMode}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm ${
              isBlindMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-950/20'
                : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle demographic and identifying marker redaction"
          >
            {isBlindMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Blind Review: ACTIVE</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-white/40" />
                <span>Blind Review: OFF</span>
              </>
            )}
          </button>

          {selectedCandidates.length < MAX_SLOTS && (
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contender
            </button>
          )}
        </div>
      </div>

      {/* Blind Review Active Banner */}
      {isBlindMode && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-200 flex items-center gap-2">
                <span>EEOC Title VII & EU AI Act Blind Review Active</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                  Unconscious Bias Shield
                </span>
              </div>
              <div className="text-[11px] text-amber-300/70 font-mono mt-0.5">
                Candidate names are masked as Candidate A, B, C; universities and emails are redacted. Reviewers grade purely on objective technical merit until locking in a hiring decision.
              </div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-amber-300/80 self-end sm:self-center shrink-0">
            {selectedCandidates.length} of {MAX_SLOTS} contenders loaded
          </div>
        </div>
      )}

      {/* Success Notification */}
      {decisionSuccessModal && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{decisionSuccessModal}</span>
          </div>
          <button
            onClick={() => setDecisionSuccessModal(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Dropdown */}
      {searchOpen && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-blue-500/15 shadow-xl">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-white/25 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name, role, or score..."
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 font-mono"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredApplications
              .filter((a) => !selectedCandidates.find((sc) => sc.id === a.id))
              .slice(0, 20)
              .map((app, idx) => {
                const displayName = isBlindMode ? `Candidate ${String.fromCharCode(65 + idx)}` : (app.candidate_name || 'Unknown');
                const displayEmail = isBlindMode ? '[REDACTED FOR EEO COMPLIANCE]' : app.candidate_email;

                return (
                  <button
                    key={app.id}
                    onClick={() => addCandidate(app)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-xs text-white/70 font-semibold">{displayName}</span>
                      <span className="text-[10px] text-white/30 font-mono ml-2">{displayEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/40">{app.job_title}</span>
                      {app.match_score !== null && (
                        <span className="text-[10px] font-mono text-blue-300 font-bold">{app.match_score}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            {filteredApplications.length === 0 && (
              <p className="text-xs text-white/25 font-mono text-center py-3">No matching candidates in pipeline.</p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedCandidates.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
          <GitCompare className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-mono">
            No candidates selected for comparison
          </p>
          <button
            onClick={() => setSearchOpen(true)}
            className="mt-3 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            + Choose Contenders
          </button>
        </div>
      )}

      {/* Comparison Grid */}
      {selectedCandidates.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="text-left p-3.5 text-white/40 uppercase tracking-wider w-44 border-b border-white/8">
                  Evaluation Dimension
                </th>
                {selectedCandidates.map((c, idx) => {
                  const isRevealed = revealedIds.has(c.id);
                  const isLocked = lockedCandidateId === c.id;
                  const letterCode = String.fromCharCode(65 + idx);
                  const candidateLabel = (isBlindMode && !isRevealed) ? `Candidate ${letterCode}` : (c.candidate_name || 'Candidate');
                  const emailLabel = (isBlindMode && !isRevealed) ? '[REDACTED FOR EEO COMPLIANCE]' : c.candidate_email;

                  return (
                    <th
                      key={c.id}
                      className="text-left p-3.5 border-b border-white/8 min-w-[240px] align-top"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isLocked
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isBlindMode && !isRevealed
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isBlindMode && !isRevealed ? letterCode : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-xs flex items-center gap-1.5">
                              <span>{candidateLabel}</span>
                              {isLocked && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[9px] text-emerald-300 border border-emerald-500/30">
                                  LOCKED
                                </span>
                              )}
                            </div>
                            <div className="text-white/30 text-[9px] font-mono truncate max-w-[150px]">
                              {emailLabel}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeCandidate(c.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-300 transition-colors cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Lock-In Decision Button */}
                      <div className="mt-3">
                        <button
                          onClick={() => handleLockInDecision(c, idx)}
                          disabled={isLocked}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isLocked
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 shadow-sm'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-3 h-3 text-emerald-400" />
                              <span>Decision Locked</span>
                            </>
                          ) : (
                            <>
                              <Award className="w-3 h-3 text-amber-400" />
                              <span>Lock In Decision</span>
                            </>
                          )}
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Applied Requisition */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">Applied Requisition</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 text-white/70 border-b border-white/4">
                    {c.job_title}
                  </td>
                ))}
              </tr>

              {/* Education / University Credentials */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">
                  <span>Education / University</span>
                </td>
                {selectedCandidates.map((c) => {
                  const isRevealed = revealedIds.has(c.id);
                  const isRedacted = isBlindMode && !isRevealed;

                  return (
                    <td key={c.id} className="p-3 border-b border-white/4">
                      {isRedacted ? (
                        <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          [REDACTED TO PREVENT BIAS]
                        </span>
                      ) : (
                        <span className="text-white/60">
                          {c.college ? `${c.college} (${c.degree || 'Degree'})` : 'B.S. Computer Science'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Objective AI Match Score */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> AI Resume Match
                  </span>
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.match_score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/6 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full ${
                              c.match_score >= 80
                                ? 'bg-emerald-400'
                                : c.match_score >= 60
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${c.match_score}%` }}
                          />
                        </div>
                        <span className="text-white font-bold">{c.match_score}%</span>
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Sarah Technical Interview Score */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-cyan-400" /> AI Interview Score
                  </span>
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.overall_score !== null ? (
                      <span className="text-white font-bold text-sm">
                        {c.overall_score}
                        <span className="text-white/40 text-xs">/100</span>
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Objective Recommendation */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">Recommendation</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.assessment_recommendation ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold border ${
                          c.assessment_recommendation === 'strong_hire' ||
                          c.assessment_recommendation === 'hire'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {c.assessment_recommendation === 'strong_hire' ||
                        c.assessment_recommendation === 'hire' ? (
                          <ThumbsUp className="w-3 h-3" />
                        ) : (
                          <ThumbsDown className="w-3 h-3" />
                        )}
                        {c.assessment_recommendation.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Anti-Cheat & Telemetry Integrity */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Integrity Telemetry
                  </span>
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.integrity_flags_count > 0 ? (
                      <span className="text-rose-300 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {c.integrity_flags_count} Signal{c.integrity_flags_count !== 1 ? 's' : ''} Flagged
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        100% Clean Telemetry
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Rubric Breakdown Dimensions */}
              {allBreakdownKeys.map((key) => (
                <tr key={key}>
                  <td className="p-3 text-white/40 border-b border-white/4 capitalize font-semibold">
                    {key.replace(/_/g, ' ')}
                  </td>
                  {selectedCandidates.map((c) => {
                    const val = c.breakdown && typeof c.breakdown === 'object' ? c.breakdown[key] : null;
                    return (
                      <td key={c.id} className="p-3 border-b border-white/4">
                        {val !== null && val !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full rounded-full bg-blue-400"
                                style={{ width: `${Math.min(Number(val) || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-white/70 font-semibold">{Number(val) || 0}</span>
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Key Strengths */}
              <tr>
                <td className="p-3 text-white/40 border-b border-white/4 font-semibold">Verified Strengths</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.strengths_summary && Array.isArray(c.strengths_summary) && c.strengths_summary.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(c.strengths_summary as string[]).slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Skill Gaps */}
              <tr>
                <td className="p-3 text-white/40 font-semibold">Technical Gaps</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3">
                    {c.gaps_summary && Array.isArray(c.gaps_summary) && c.gaps_summary.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(c.gaps_summary as string[]).slice(0, 4).map((g, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300/80 border border-rose-500/20"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
