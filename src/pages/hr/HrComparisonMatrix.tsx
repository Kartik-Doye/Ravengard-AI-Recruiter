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
} from 'lucide-react';

interface CandidateSlot {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
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

  useEffect(() => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token) return;

    fetch('/api/hr/applications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setAllApplications(data.applications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const filteredApplications = allApplications.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.candidate_name || '').toLowerCase().includes(q) ||
      a.candidate_email.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q)
    );
  });

  // Collect all breakdown keys from selected candidates
  const allBreakdownKeys = Array.from(
    new Set(
      selectedCandidates.flatMap((c) =>
        c.breakdown && typeof c.breakdown === 'object' ? Object.keys(c.breakdown) : []
      )
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-violet-400" />
            Candidate Comparison
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            Compare up to {MAX_SLOTS} candidates side-by-side across scoring dimensions
          </p>
        </div>
        {selectedCandidates.length < MAX_SLOTS && (
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Candidate
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {searchOpen && (
        <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-blue-500/15">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-white/25 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 font-mono"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredApplications
              .filter((a) => !selectedCandidates.find((sc) => sc.id === a.id))
              .slice(0, 20)
              .map((app) => (
                <button
                  key={app.id}
                  onClick={() => addCandidate(app)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <div>
                    <span className="text-xs text-white/70">{app.candidate_name || 'Unknown'}</span>
                    <span className="text-[10px] text-white/25 font-mono ml-2">{app.candidate_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/30">{app.job_title}</span>
                    {app.match_score !== null && (
                      <span className="text-[10px] font-mono text-blue-300">{app.match_score}%</span>
                    )}
                  </div>
                </button>
              ))}
            {filteredApplications.length === 0 && (
              <p className="text-xs text-white/25 font-mono text-center py-3">No matching candidates.</p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedCandidates.length === 0 && (
        <div className="text-center py-16">
          <GitCompare className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30 font-mono">
            Select candidates to begin comparison
          </p>
          <p className="text-xs text-white/20 font-mono mt-1">
            Click "Add Candidate" to start
          </p>
        </div>
      )}

      {/* Comparison Grid */}
      {selectedCandidates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr>
                <th className="text-left p-3 text-white/30 uppercase tracking-wider w-40 border-b border-white/6">
                  Dimension
                </th>
                {selectedCandidates.map((c) => (
                  <th
                    key={c.id}
                    className="text-left p-3 border-b border-white/6 min-w-[200px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-white font-semibold text-xs">
                            {c.candidate_name || 'Unknown'}
                          </div>
                          <div className="text-white/25 text-[9px]">{c.candidate_email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCandidate(c.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Job */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">Applied For</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 text-white/50 border-b border-white/4">
                    {c.job_title}
                  </td>
                ))}
              </tr>

              {/* Status */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">Status</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/50">
                      {c.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                ))}
              </tr>

              {/* AI Match Score */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" /> AI Match
                  </span>
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.match_score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/6 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full ${
                              c.match_score! >= 80
                                ? 'bg-emerald-400'
                                : c.match_score! >= 60
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${c.match_score}%` }}
                          />
                        </div>
                        <span className="text-white/60 font-bold">{c.match_score}%</span>
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Overall Score */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">
                  <span className="inline-flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" /> Interview Score
                  </span>
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.overall_score !== null ? (
                      <span className="text-white/70 font-bold">{c.overall_score}/100</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Recommendation */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">Recommendation</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.assessment_recommendation ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold border ${
                          c.assessment_recommendation === 'strong_hire' ||
                          c.assessment_recommendation === 'hire'
                            ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20'
                            : 'bg-red-500/12 text-red-300 border-red-500/20'
                        }`}
                      >
                        {c.assessment_recommendation === 'strong_hire' ||
                        c.assessment_recommendation === 'hire' ? (
                          <ThumbsUp className="w-3 h-3" />
                        ) : (
                          <ThumbsDown className="w-3 h-3" />
                        )}
                        {c.assessment_recommendation.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Integrity Flags */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">
                  <span className="inline-flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-400" /> Integrity Flags
                  </span>
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.integrity_flags_count > 0 ? (
                      <span className="text-red-300 font-bold">
                        {c.integrity_flags_count} signal{c.integrity_flags_count !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-emerald-300/50">Clean</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Breakdown dimensions */}
              {allBreakdownKeys.map((key) => (
                <tr key={key}>
                  <td className="p-3 text-white/30 border-b border-white/4 capitalize">
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
                            <span className="text-white/50">{Number(val) || 0}</span>
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Strengths */}
              <tr>
                <td className="p-3 text-white/30 border-b border-white/4">Key Strengths</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3 border-b border-white/4">
                    {c.strengths_summary && Array.isArray(c.strengths_summary) ? (
                      <div className="flex flex-wrap gap-1">
                        {(c.strengths_summary as string[]).slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/8 text-emerald-300/60 border border-emerald-500/10"
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

              {/* Gaps */}
              <tr>
                <td className="p-3 text-white/30">Skill Gaps</td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-3">
                    {c.gaps_summary && Array.isArray(c.gaps_summary) ? (
                      <div className="flex flex-wrap gap-1">
                        {(c.gaps_summary as string[]).slice(0, 4).map((g, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/8 text-red-300/60 border border-red-500/10"
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
