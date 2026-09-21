import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Camera,
  Mic,
  Monitor,
  Printer,
  ExternalLink,
} from 'lucide-react';

interface CandidateProfile {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  job_dept: string | null;
  status: string;
  session_id: string | null;
  magic_token_expires_at: string | null;
  session_stage: string | null;
  overall_score: number | null;
}

interface Receipt {
  receiptId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: string;
  completionTimestamp: string;
  cryptographicProof: string;
  issuer: string;
}

export default function CandidatePortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const tokenParam = searchParams.get('token');

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setError(null);

      // Case 1: Magic Token in URL query (?token=...)
      if (tokenParam) {
        try {
          const res = await fetch(`/api/candidate/verify?token=${encodeURIComponent(tokenParam)}`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Magic link is invalid or has already been redeemed.');
          }

          localStorage.setItem('ravengard_candidate_token', data.token);
          // Clean token from URL
          window.history.replaceState({}, document.title, '/portal');
          await loadProfile(data.token);
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        }
        return;
      }

      // Case 2: Existing JWT in localStorage
      const existingToken = localStorage.getItem('ravengard_candidate_token');
      if (existingToken) {
        await loadProfile(existingToken);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [tokenParam]);

  const loadProfile = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/candidate/me', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('ravengard_candidate_token');
        }
        throw new Error('Session expired. Please use your magic link invitation from email.');
      }

      const data = await res.json();
      setProfile(data.application);

      // If assessment completed, fetch cryptographic receipt
      if (data.application.status === 'assessment_completed') {
        const rcptRes = await fetch('/api/candidate/assessment/receipt', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (rcptRes.ok) {
          const rcptData = await rcptRes.json();
          setReceipt(rcptData.receipt);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 48h Countdown Timer
  useEffect(() => {
    if (!profile?.magic_token_expires_at) return;

    const interval = setInterval(() => {
      const diff = new Date(profile.magic_token_expires_at!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile?.magic_token_expires_at]);

  const handleStartAssessment = () => {
    navigate('/interview');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-0)] text-white pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--color-secondary)] rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
              Verifying Candidate Access Token...
            </span>
          </div>
        )}

        {/* Error / Expired Link State */}
        {!loading && error && (
          <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-4 max-w-xl mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Access Verification Notice</h2>
            <p className="text-xs text-red-300 leading-relaxed font-sans">{error}</p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/careers"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors"
              >
                Browse Careers
              </Link>
              <Link
                to="/gateway"
                className="px-4 py-2 rounded-xl bg-[var(--color-secondary)] text-black font-semibold text-xs font-mono transition-colors"
              >
                Candidate Gateway
              </Link>
            </div>
          </div>
        )}

        {/* No Profile & No Error (Prompt to check email) */}
        {!loading && !error && !profile && (
          <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-[var(--color-secondary)] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white font-display">Candidate Assessment Portal</h2>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              To enter the secure interview room, click the single-use magic assessment link dispatched to your email address upon shortlisting.
            </p>
            <div className="pt-2">
              <Link
                to="/careers"
                className="px-5 py-2.5 rounded-xl bg-[var(--color-secondary)] text-black font-semibold text-xs font-mono inline-flex items-center gap-2 hover:bg-[var(--color-secondary)]/90 transition-all shadow-md"
              >
                <span>View Open Job Positions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated Candidate State */}
        {!loading && profile && (
          <div className="space-y-8">
            {/* Header Identity Card */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 text-[10px] font-mono text-[var(--color-secondary)] uppercase font-semibold">
                    Shortlisted Candidate
                  </span>
                  <span className="text-xs font-mono text-white/40">
                    Application #{profile.id.slice(0, 8)}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white font-display">
                  Welcome, {profile.candidate_name}
                </h1>
                <p className="text-xs text-white/60 font-mono">
                  Role: <span className="text-white font-medium">{profile.job_title}</span> • {profile.candidate_email}
                </p>
              </div>

              {/* Countdown or Completed Badge */}
              {profile.status === 'assessment_completed' ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 block uppercase">
                      Assessment Completed
                    </span>
                    <span className="text-[11px] font-mono text-white/50">
                      Receipt generated & stored
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-400" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                      Single-Use 48h Link Validity
                    </span>
                    <span className="text-lg font-bold font-mono text-white">
                      {timeLeft || 'Calculating...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Completed View: Cryptographic Proof Receipt */}
            {profile.status === 'assessment_completed' && receipt ? (
              <div className="space-y-6">
                <div className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h2 className="text-lg font-bold text-white">Assessment Proof Receipt</h2>
                        <p className="text-xs text-white/40 font-mono">
                          Cryptographic verification record for your technical assessment.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handlePrintReceipt}
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / PDF</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                      <span className="text-white/40 uppercase text-[10px]">Receipt ID</span>
                      <div className="text-white font-bold">{receipt.receiptId}</div>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                      <span className="text-white/40 uppercase text-[10px]">Candidate</span>
                      <div className="text-white font-medium">{receipt.candidateName}</div>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                      <span className="text-white/40 uppercase text-[10px]">Role Assessed</span>
                      <div className="text-white font-medium">{receipt.jobTitle}</div>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                      <span className="text-white/40 uppercase text-[10px]">Timestamp</span>
                      <div className="text-white font-mono">
                        {new Date(receipt.completionTimestamp).toUTCString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/50 rounded-xl border border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-secondary)]">
                      SHA-256 Authenticity Signature
                    </span>
                    <p className="text-[11px] font-mono text-white/70 break-all bg-black/80 p-2.5 rounded border border-white/5">
                      {receipt.cryptographicProof}
                    </p>
                    <span className="text-[10px] text-white/40 font-mono block">
                      Issued by {receipt.issuer}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Pre-Assessment Readiness & Launch Card */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rules & Checkpoints */}
                <div className="md:col-span-2 p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[var(--color-secondary)]" />
                    Autonomous Assessment Instructions
                  </h2>

                  <div className="space-y-4 text-xs leading-relaxed text-white/70 font-sans">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-secondary)] flex-shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block font-mono text-xs">
                          1. Hardware Device Verification
                        </strong>
                        Your camera, microphone, and speakers will undergo a live latency and permission check before the interview stages begin.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-secondary)] flex-shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block font-mono text-xs">
                          2. Single-Session Focus & Integrity
                        </strong>
                        The interview engine runs with verified session locking. Window switches, tab blurs, or device disruptions are recorded to ensure an uninterrupted evaluation.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-secondary)] flex-shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block font-mono text-xs">
                          3. Real-Time Streaming & Scored Transcripts
                        </strong>
                        You will answer technical and system design questions. Your answers stream back in real-time and will be calibrated against the role rubric.
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-white/40">
                      Estimated Duration: ~25-35 minutes
                    </span>

                    <button
                      onClick={handleStartAssessment}
                      className="px-6 py-3 rounded-xl bg-[var(--color-secondary)] text-black font-semibold text-xs font-mono flex items-center gap-2 hover:bg-[var(--color-secondary)]/90 transition-all shadow-xl cursor-pointer"
                    >
                      <span>Begin Assessment Engine</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Side Checklist */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-white/50 block">
                      Quick Readiness Check
                    </span>
                    <ul className="text-xs font-mono space-y-2 text-white/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Quiet, well-lit room</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Chrome / Safari / Edge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Headphones recommended</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Stable internet connection</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-white/50 leading-normal">
                    Need to reschedule? Your link remains valid for 48 hours. Contact your hiring team if your window expires.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
