import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Award,
  Heart,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { getRbacFetchHeaders } from '../../utils/rbacClient';

interface GrowthScorecardProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onClose: () => void;
}

export function CandidateGrowthScorecardModal({
  applicationId,
  candidateName,
  jobTitle,
  onClose,
}: GrowthScorecardProps) {
  const [feedback, setFeedback] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/hr/applications/${applicationId}/feedback-scorecard`, {
      headers: getRbacFetchHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setFeedback(data.feedback);
      })
      .catch((e) => console.error(e));
  }, [applicationId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/portal?feedback=${applicationId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Heart className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide">
                Candidate Goodwill & Growth Scorecard
              </h2>
              <p className="text-xs text-white/50 font-mono">
                {candidateName} · {jobTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 leading-relaxed font-sans">
            Instead of a cold automated rejection, Ravengard provides high-value personalized technical growth feedback. This protects your enterprise brand on Glassdoor and turns rejected candidates into enthusiastic brand advocates.
          </div>

          {/* Constructive Summary */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 font-mono">
              Evaluation Synthesis
            </h3>
            <p className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-slate-200 leading-relaxed">
              {feedback?.constructiveSummary ||
                'Strong technical fundamentals demonstrated in query optimization and architectural decomposition. Excellent clarity under real-time problem probing.'}
            </p>
          </div>

          {/* 2 Strengths */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> 2 Key Engineering Strengths
            </h3>
            <div className="space-y-2">
              {(feedback?.strengths || [
                'Exemplary execution on SQL window partitioning and index scan trade-off explanation.',
                'Clear STAR framework communication when defending distributed systems boundary decisions.',
              ]).map((s: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-200 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2 Actionable Growth Areas */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> 2 Actionable Growth Areas
            </h3>
            <div className="space-y-2">
              {(feedback?.areasToImprove || [
                'Deepen practical experience with Raft log compaction and atomic snapshotting under network partitions.',
                'Practice lock-free queue concurrency patterns in high-throughput Node.js microservices.',
              ]).map((a: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200 flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Resources */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Recommended Engineering Study Resources
            </h3>
            <ul className="space-y-1.5 font-mono text-[11px] text-white/70">
              {(feedback?.learningResources || [
                'Designing Data-Intensive Applications (Martin Kleppmann) - Chapters 7 & 9',
                'The Raft Consensus Algorithm Interactive Visualizer (raft.github.io)',
                'PostgreSQL 16 Execution Plans & B-Tree Index Optimization Guides',
              ]).map((r: string, idx: number) => (
                <li key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center gap-2">
                  <span className="text-blue-400">→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between font-mono text-xs">
          <span className="text-white/40">Candidate-Facing Growth Feedback</span>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all cursor-pointer font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied!' : 'Copy Candidate Feedback Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
