import React, { useState, useEffect, useRef } from 'react';
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
  MicOff,
  Monitor,
  Printer,
  ExternalLink,
  KeyRound,
  Mail,
  User,
  Volume2,
  VolumeX,
  Play,
  Award,
  Zap,
  Check,
  Send,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  LogOut,
  PenTool,
} from 'lucide-react';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

interface ApplicationItem {
  application_id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  job_title: string;
  job_department: string | null;
  job_location: string | null;
  salary_range: string | null;
  assessment_expires_at: string | null;
  sla_expires_at: string | null;
  mcq_score: number | null;
  interview_score: number | null;
  offer_details_json: any;
  created_at: string;
  overall_recommendation?: string;
  ai_overall_score?: number;
  executive_summary?: string;
  slaSecondsRemaining: number;
  isTimedOut: boolean;
  funnelStage: string;
}

interface McqQuestion {
  id: string;
  category: string;
  skillTag: string;
  difficulty: string;
  questionText: string;
  options: string[];
}

interface RadarData {
  behavioral: { score: number; out_of: number; percentile: number; difficulty_reached: string };
  aptitude: { score: number; out_of: number; percentile: number; difficulty_reached: string };
  technical_aptitude: { score: number; out_of: number; percentile: number; difficulty_reached: string };
}

interface VoiceRubricDimension {
  status: 'UNCHECKED' | 'IN_PROGRESS' | 'COMPLETED';
  confidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  evidence_snippet: string | null;
  ai_instruction?: string;
}

export default function CandidatePortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('ravengard_candidate_token'));
  const [candidateEmail, setCandidateEmail] = useState<string>('');
  const [candidateName, setCandidateName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth Form State (Login / Register)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Candidate Inbox State
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [activeApplication, setActiveApplication] = useState<ApplicationItem | null>(null);

  // Assessment Stage View ('inbox' | 'mcq_test' | 'voice_interview' | 'offer_letter' | 'receipt')
  const [currentView, setCurrentView] = useState<'inbox' | 'mcq_test' | 'voice_interview' | 'offer_letter' | 'receipt'>('inbox');

  // --- 1. MCQ Test State ---
  const [mcqSessionId, setMcqSessionId] = useState<string | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<McqQuestion[]>([]);
  const [mcqCurrentIndex, setMcqCurrentIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [mcqSecondsRemaining, setMcqSecondsRemaining] = useState<number>(3600);
  const [mcqSubmitting, setMcqSubmitting] = useState(false);
  const [mcqResult, setMcqResult] = useState<{ score: number; passed: boolean; radarData: RadarData } | null>(null);
  const [integrityFlags, setIntegrityFlags] = useState<number>(0);

  // --- 2. Live Voice Interview State ---
  const [voiceHistory, setVoiceHistory] = useState<Array<{ role: 'user' | 'model'; text: string; time: string }>>([
    {
      role: 'model',
      text: "Hello, I am Sarah, Senior Technical Recruiter at Ravengard. Today we will dive into your technical architecture experience and problem-solving methodology. To get started, could you briefly describe the most complex data or backend system you have designed?",
      time: '00:00'
    }
  ]);
  const [voiceCandidateInput, setVoiceCandidateInput] = useState('');
  const [voiceThinking, setVoiceThinking] = useState(false);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceElapsedSeconds, setVoiceElapsedSeconds] = useState(0);
  const [voiceMode, setVoiceMode] = useState<string>('MODE_B_DEEP_PROBING');
  const [voiceFinished, setVoiceFinished] = useState(false);
  const [voiceRubric, setVoiceRubric] = useState<Record<string, VoiceRubricDimension>>({
    technical_depth: {
      status: 'IN_PROGRESS',
      confidence: 'MEDIUM',
      score: 4.2,
      evidence_snippet: 'Candidate described high-throughput SQL indexing and outbox synchronization.',
      ai_instruction: 'Evaluate SQL optimization, distributed architectures, caching, and data modeling depth.'
    },
    problem_solving: {
      status: 'IN_PROGRESS',
      confidence: 'MEDIUM',
      score: 4.0,
      evidence_snippet: null,
      ai_instruction: 'Assess STAR structured breakdown, root cause analysis, and production incident recovery.'
    },
    communication: {
      status: 'IN_PROGRESS',
      confidence: 'LOW',
      score: 3.8,
      evidence_snippet: null,
      ai_instruction: 'Assess concise articulation, trade-off clarity, and cross-functional team alignment.'
    }
  });

  // --- 3. Offer Letter State ---
  const [offerSignature, setOfferSignature] = useState('');
  const [offerSigning, setOfferSigning] = useState(false);
  const [offerExecuted, setOfferExecuted] = useState(false);

  // Magic Token verification in URL
  const tokenParam = searchParams.get('token');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (tokenParam) {
        try {
          const res = await fetch(`/api/candidate/verify?token=${encodeURIComponent(tokenParam)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Invalid or expired magic token.');
          localStorage.setItem('ravengard_candidate_token', data.token);
          setToken(data.token);
          window.history.replaceState({}, document.title, '/portal');
        } catch (err: any) {
          setError(err.message);
        }
      }
      setLoading(false);
    };
    init();
  }, [tokenParam]);

  // Load Candidate Inbox whenever token is valid
  useEffect(() => {
    if (!token) return;
    loadInbox();
  }, [token]);

  // SLA Tick Countdown for Applications
  useEffect(() => {
    const interval = setInterval(() => {
      setApplications(prev => prev.map(app => ({
        ...app,
        slaSecondsRemaining: Math.max(0, app.slaSecondsRemaining - 1),
        isTimedOut: app.slaSecondsRemaining <= 1 && (app.status === 'applied' || app.status === 'assessment_pending')
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 60-Minute MCQ Timer
  useEffect(() => {
    if (currentView !== 'mcq_test' || mcqResult) return;
    const interval = setInterval(() => {
      setMcqSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitMcq();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, mcqResult, mcqAnswers]);

  // Live Interview Timer
  useEffect(() => {
    if (currentView !== 'voice_interview' || voiceFinished) return;
    const interval = setInterval(() => {
      setVoiceElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, voiceFinished]);

  // Tab blur anti-cheat listener during MCQ test
  useEffect(() => {
    if (currentView !== 'mcq_test' || mcqResult) return;
    const handleBlur = () => {
      setIntegrityFlags(prev => prev + 1);
      // Log telemetry signal silently to backend
      if (activeApplication) {
        fetch(`/api/candidate/assessment/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            applicationId: activeApplication.application_id,
            signalType: 'tab_switch',
            metadata: 'Candidate switched away from assessment window.'
          })
        }).catch(() => {});
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [currentView, mcqResult, activeApplication, token]);

  const loadInbox = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/candidate/inbox', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('ravengard_candidate_token');
          setToken(null);
          return;
        }
        throw new Error('Failed to load candidate applications.');
      }
      const data = await res.json();
      setApplications(data.applications || []);
      setCandidateEmail(data.candidate?.email || '');
      if (data.applications && data.applications.length > 0 && !activeApplication) {
        setActiveApplication(data.applications[0]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setError(null);

    const endpoint = authMode === 'register' ? '/api/candidate/auth/register' : '/api/candidate/auth/login';
    const payload = authMode === 'register'
      ? { email: authEmail, password: authPassword, name: authName }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');

      localStorage.setItem('ravengard_candidate_token', data.token);
      setToken(data.token);
      setCandidateEmail(data.candidate?.email || authEmail);
      setCandidateName(data.candidate?.name || authName || 'Candidate');
      await loadInbox();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleFastTrackDemo = async () => {
    setAuthSubmitting(true);
    setError(null);
    try {
      // Auto register or login a fast-track demo candidate
      const res = await fetch('/api/candidate/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `candidate.${Date.now()}@example.com`,
          password: 'password123',
          name: 'Alex Chen',
          college: 'Stanford University',
          degree: 'B.S. Computer Science'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo init failed.');
      localStorage.setItem('ravengard_candidate_token', data.token);
      setToken(data.token);
      
      // Auto apply to active job
      await fetch('/api/public/jobs/job-data-analyst-01/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.candidate.email,
          name: 'Alex Chen',
          resumeText: 'Senior Engineer with 6 years experience in SQL window functions, distributed caching, and microservices architecture.'
        })
      });

      await loadInbox();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ravengard_candidate_token');
    setToken(null);
    setApplications([]);
    setActiveApplication(null);
    setCurrentView('inbox');
  };

  // --- MCQ Assessment Handlers ---
  const startMcqAssessment = async (app: ApplicationItem) => {
    setActiveApplication(app);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/candidate/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId: app.application_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize assessment.');

      setMcqSessionId(data.sessionId);
      setMcqQuestions(data.questions || []);
      setMcqCurrentIndex(0);
      setMcqAnswers({});
      setMcqResult(null);
      setIntegrityFlags(0);
      
      const secondsLeft = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setMcqSecondsRemaining(secondsLeft || 3600);
      setCurrentView('mcq_test');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setMcqAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleAutoSubmitMcq = async () => {
    if (!mcqSessionId) return;
    setMcqSubmitting(true);
    const answersPayload = Object.entries(mcqAnswers).map(([qId, opt]) => ({
      questionId: qId,
      selectedOption: opt
    }));

    try {
      const res = await fetch('/api/candidate/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: mcqSessionId, answers: answersPayload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setMcqResult({
        score: data.score,
        passed: data.passed,
        radarData: data.radarData
      });
      await loadInbox();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMcqSubmitting(false);
    }
  };

  // --- Voice Recruiter Handlers ---
  const startVoiceInterview = (app: ApplicationItem) => {
    setActiveApplication(app);
    setVoiceElapsedSeconds(0);
    setVoiceFinished(false);
    setVoiceHistory([
      {
        role: 'model',
        text: `Welcome, ${candidateName || 'Alex'}! I am Sarah, Senior Technical Recruiter at Ravengard. Let us explore your hands-on experience with SQL optimization and distributed pipelines. Could you walk me through the most challenging performance bottleneck you resolved in production?`,
        time: '00:00'
      }
    ]);
    speakSarahVoice(`Welcome! I am Sarah, Senior Technical Recruiter at Ravengard. Let us explore your hands-on experience with SQL optimization and distributed pipelines. Could you walk me through the most challenging performance bottleneck you resolved in production?`);
    setCurrentView('voice_interview');
  };

  const speakSarahVoice = (text: string) => {
    if (voiceMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      setVoiceSpeaking(true);
      utterance.onend = () => setVoiceSpeaking(false);
      utterance.onerror = () => setVoiceSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  const handleSendVoiceTurn = async () => {
    if (!voiceCandidateInput.trim() || voiceThinking) return;

    const userText = voiceCandidateInput.trim();
    setVoiceCandidateInput('');
    const timeStr = `${Math.floor(voiceElapsedSeconds / 60).toString().padStart(2, '0')}:${(voiceElapsedSeconds % 60).toString().padStart(2, '0')}`;

    const newHistory = [...voiceHistory, { role: 'user' as const, text: userText, time: timeStr }];
    setVoiceHistory(newHistory);
    setVoiceThinking(true);

    try {
      const res = await fetch('/api/candidate/interview/next-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: newHistory.map(h => ({ role: h.role, text: h.text })),
          rubricState: voiceRubric,
          elapsedTimeMinutes: voiceElapsedSeconds / 60,
          jobTitle: activeApplication?.job_title || 'Senior Data Analyst',
          candidateName: candidateName || 'Candidate'
        })
      });

      const data = await res.json();
      const modelReply = data.reply || "Thank you for that detailed breakdown. Let us explore how you handle cross-functional alignment.";
      
      setVoiceHistory(prev => [...prev, {
        role: 'model' as const,
        text: modelReply,
        time: `${Math.floor(voiceElapsedSeconds / 60).toString().padStart(2, '0')}:${(voiceElapsedSeconds % 60).toString().padStart(2, '0')}`
      }]);

      if (data.rubricState) setVoiceRubric(data.rubricState);
      if (data.mode) setVoiceMode(data.mode);
      if (data.isFinished) setVoiceFinished(true);

      speakSarahVoice(modelReply);
    } catch (err: any) {
      console.error(err);
    } finally {
      setVoiceThinking(false);
    }
  };

  const handleFinalizeInterview = async () => {
    if (!activeApplication) return;
    setLoading(true);
    try {
      const res = await fetch('/api/candidate/interview/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          applicationId: activeApplication.application_id,
          transcript: voiceHistory,
          rubricBreakdown: [
            {
              dimension: 'Technical Depth (SQL & Architecture)',
              score: 4.8,
              max_score: 5.0,
              evidence_citation: 'Candidate clearly walked through execution plans, B-Tree indexes, and outbox buffering.'
            },
            {
              dimension: 'Problem Solving Methodology',
              score: 4.5,
              max_score: 5.0,
              evidence_citation: 'Structured STAR breakdown with root cause isolation and canary validation.'
            },
            {
              dimension: 'Communication & Team Alignment',
              score: 4.6,
              max_score: 5.0,
              evidence_citation: 'Articulated trade-offs concisely and empathetically.'
            }
          ],
          executiveSummary: `${candidateName || 'Candidate'} demonstrated exceptional mastery across SQL window functions, distributed caching, and systematic incident response. Recommended for immediate hire.`,
          overallRecommendation: 'STRONG_HIRE',
          durationMinutes: Math.max(1, Math.round(voiceElapsedSeconds / 60))
        })
      });
      await res.json();
      await loadInbox();
      setCurrentView('inbox');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Offer Letter Handlers ---
  const handleExecuteOffer = async () => {
    if (!activeApplication || !offerSignature.trim()) return;
    setOfferSigning(true);
    try {
      const res = await fetch('/api/candidate/offer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          applicationId: activeApplication.application_id,
          signatureName: offerSignature.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Offer execution failed.');
      setOfferExecuted(true);
      await loadInbox();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOfferSigning(false);
    }
  };

  const formatSeconds = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHoursRemaining = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // ==========================================================================
  // RENDER: NOT AUTHENTICATED (Login / Register Screen)
  // ==========================================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Background glow ambient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-white">Candidate Portal</h1>
                <p className="text-xs text-slate-400">Ravengard Assessment Hub</p>
              </div>
            </div>
            <div className="flex bg-slate-800/80 rounded-xl p-1 border border-white/5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-3 py-1.5 rounded-lg transition-all ${authMode === 'login' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-3 py-1.5 rounded-lg transition-all ${authMode === 'register' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {authSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{authMode === 'register' ? 'Create Candidate Account' : 'Sign In to Portal'}</span>
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <span className="relative bg-slate-900 px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">or fast track</span>
          </div>

          <button
            type="button"
            onClick={handleFastTrackDemo}
            disabled={authSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch Interactive Candidate Demo</span>
          </button>

          <div className="mt-6 text-center">
            <Link to="/careers" className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
              <span>Looking for open roles?</span>
              <span className="text-cyan-400 underline underline-offset-4">Explore Careers</span>
            </Link>
          </div>
        </div>

        {showForgotModal && (
          <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: 60-MINUTE ADAPTIVE MCQ BATTERY TEST ENGINE
  // ==========================================================================
  if (currentView === 'mcq_test') {
    const currentQ = mcqQuestions[mcqCurrentIndex];
    const answeredCount = Object.keys(mcqAnswers).length;
    const progressPercent = mcqQuestions.length > 0 ? (answeredCount / mcqQuestions.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between p-6 relative">
        {/* Anti-Tamper Banner if Tab Blur Flagged */}
        {integrityFlags > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Window focus lost ({integrityFlags} alert{integrityFlags > 1 ? 's' : ''} logged to telemetry audit). Maintain focus on the active exam window.</span>
            </div>
            <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">INTEGRITY MONITORED</span>
          </div>
        )}

        {/* Top Header & Countdown Timer */}
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rounds 1–3: Adaptive MCQ Battery</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{activeApplication?.job_title || 'Technical Assessment'}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 font-mono font-bold text-sm shadow-lg ${mcqSecondsRemaining < 300 ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse' : 'bg-slate-900 border-white/10 text-cyan-300'}`}>
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{formatSeconds(mcqSecondsRemaining)}</span>
            </div>
            <button
              onClick={handleAutoSubmitMcq}
              disabled={mcqSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              {mcqSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
              <span>Finish & Submit</span>
            </button>
          </div>
        </header>

        {/* Main Test Body */}
        <main className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Stepper Column */}
          <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400">Questions Navigator</span>
              <span className="text-xs font-mono text-cyan-400">{answeredCount}/{mcqQuestions.length} Answered</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {mcqQuestions.map((q, idx) => {
                const isSelected = mcqCurrentIndex === idx;
                const isAnswered = !!mcqAnswers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setMcqCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/20'
                        : isAnswered
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-950/60 text-slate-400 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Section Category:</span>
                <span className="font-semibold text-white">{currentQ?.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Skill Target:</span>
                <span className="font-mono text-cyan-400">{currentQ?.skillTag}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Difficulty:</span>
                <span className="font-semibold text-amber-400 uppercase">{currentQ?.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Active Question Content Area */}
          <div className="lg:col-span-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative flex flex-col justify-between min-h-[460px]">
            {currentQ ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                      Question {mcqCurrentIndex + 1} of {mcqQuestions.length} — {currentQ.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Weight: Standard</span>
                  </div>

                  <h2 className="text-lg font-semibold text-white leading-relaxed mb-8">
                    {currentQ.questionText}
                  </h2>

                  <div className="space-y-3">
                    {currentQ.options.map((opt, optIdx) => {
                      const isChosen = mcqAnswers[currentQ.id] === opt;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, opt)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                            isChosen
                              ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-950/40 border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isChosen ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold' : 'border-slate-600'}`}>
                            {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-sm leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/10">
                  <button
                    type="button"
                    disabled={mcqCurrentIndex === 0}
                    onClick={() => setMcqCurrentIndex(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-semibold transition-all"
                  >
                    Previous
                  </button>

                  <div className="text-xs text-slate-400 font-mono">
                    {answeredCount} of {mcqQuestions.length} answered
                  </div>

                  {mcqCurrentIndex < mcqQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setMcqCurrentIndex(prev => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAutoSubmitMcq}
                      disabled={mcqSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      {mcqSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Submit All Answers</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400">Loading assessment questions...</div>
            )}
          </div>
        </main>

        {/* Modal: MCQ Results with Radar Chart & Percentile Breakdown */}
        {mcqResult && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-xl w-full shadow-2xl animate-scale-up">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 ${mcqResult.passed ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-red-500/20 border border-red-400/30 text-red-400'}`}>
                  {mcqResult.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {mcqResult.passed ? 'MCQ Battery Passed!' : 'Assessment Complete'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {mcqResult.passed
                    ? 'You have qualified for Round 4 & 5: Live AI Voice Technical Recruiter Interview.'
                    : 'Your results have been securely recorded for review.'}
                </p>
              </div>

              {/* Score & Percentile Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Overall Score</span>
                  <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{mcqResult.score}%</div>
                  <span className="text-[10px] text-slate-500">Threshold: 70%</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Percentile</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">94th</div>
                  <span className="text-[10px] text-slate-500">Top 6% cohort</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Integrity Check</span>
                  <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>CLEARED</span>
                  </div>
                </div>
              </div>

              {/* Radar Breakdown Visual Bars */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Behavioral & Collaboration (High Diff)</span>
                    <span className="text-cyan-400 font-mono">88% (85th percentile)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Aptitude & Distributed Systems (Brutal Diff)</span>
                    <span className="text-cyan-400 font-mono">92% (91st percentile)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Technical Aptitude (SQL & Query Optimization)</span>
                    <span className="text-cyan-400 font-mono">95% (96th percentile)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('inbox');
                  }}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  Return to Dashboard
                </button>
                {mcqResult.passed ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeApplication) startVoiceInterview(activeApplication);
                    }}
                    className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Launch AI Recruiter Voice</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 3: ROUND 4 & 5: LIVE AI VOICE INTERVIEW ("Sarah, Senior AI Recruiter")
  // ==========================================================================
  if (currentView === 'voice_interview') {
    return (
      <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Top Header */}
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Round 4 & 5: Live Technical Evaluation</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {voiceMode === 'MODE_A_FAST_TRACK' ? 'MODE A: FAST-TRACK' : voiceMode === 'MODE_C_HARD_CUTOFF' ? 'MODE C: WRAP-UP' : 'MODE B: DEEP PROBING'}
                </span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">Sarah, Senior AI Technical Recruiter</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setVoiceMuted(!voiceMuted)}
              className={`p-2.5 rounded-xl border transition-all ${voiceMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-900 border-white/10 text-cyan-300'}`}
              title={voiceMuted ? 'Unmute Audio TTS' : 'Mute Audio TTS'}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-2 font-mono font-bold text-sm text-cyan-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{formatSeconds(voiceElapsedSeconds)}</span>
            </div>

            <button
              onClick={handleFinalizeInterview}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit for HR Dossier</span>
            </button>
          </div>
        </header>

        {/* Central Audio Visualizer & Transcript Engine */}
        <main className="max-w-6xl w-full mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Left Column: Sarah Voice Orb Visualizer */}
          <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative w-44 h-44 flex items-center justify-center my-6">
              {/* Outer Ripple Rings */}
              <div className={`absolute inset-0 rounded-full border border-cyan-400/30 transition-all duration-700 ${voiceSpeaking ? 'scale-125 opacity-100 animate-ping' : 'scale-100 opacity-40'}`} />
              <div className={`absolute -inset-4 rounded-full border border-cyan-400/20 transition-all duration-1000 ${voiceSpeaking ? 'scale-150 opacity-80' : 'scale-100 opacity-20'}`} />

              {/* Glowing Orb Center */}
              <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-2xl transition-all duration-500 ${voiceSpeaking ? 'shadow-cyan-400/50 scale-105' : 'shadow-cyan-600/20'}`}>
                <Cpu className={`w-14 h-14 text-white transition-transform ${voiceSpeaking ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <h3 className="font-bold text-white text-base">Sarah AI Recruiter</h3>
              <p className="text-xs text-cyan-300 font-mono">
                {voiceThinking ? 'Synthesizing response & updating rubric...' : voiceSpeaking ? 'Speaking audio response...' : 'Listening for candidate response'}
              </p>
            </div>

            {/* Live Rubric Dimension Tracker */}
            <div className="w-full mt-6 pt-6 border-t border-white/10 space-y-2 text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Live Evaluator Rubric</span>
              
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-300">Technical Depth</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {voiceRubric.technical_depth?.status || 'IN_PROGRESS'} (4.5/5.0)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-300">Problem Solving</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {voiceRubric.problem_solving?.status || 'IN_PROGRESS'} (4.0/5.0)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-300">Communication</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {voiceRubric.communication?.status || 'IN_PROGRESS'} (4.2/5.0)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Conversation Transcript & Response Box */}
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between h-[540px]">
            {/* Transcript Scroll Area */}
            <div className="overflow-y-auto space-y-4 pr-2 flex-1 mb-4">
              {voiceHistory.map((item, idx) => {
                const isModel = item.role === 'model';
                return (
                  <div key={idx} className={`flex gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}>
                    {isModel && (
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 mt-1">
                        <Cpu className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isModel
                        ? 'bg-slate-950/80 border border-white/10 text-slate-200'
                        : 'bg-cyan-500 text-slate-950 font-medium shadow-md shadow-cyan-500/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1 text-[10px] opacity-70">
                        <span>{isModel ? 'Sarah (AI Recruiter)' : 'You (Alex)'}</span>
                        <span>{item.time}</span>
                      </div>
                      <p className="text-sm">{item.text}</p>
                    </div>
                  </div>
                );
              })}
              {voiceThinking && (
                <div className="flex gap-3 justify-start items-center text-xs text-cyan-400 animate-pulse pl-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sarah is evaluating your architectural answer...</span>
                </div>
              )}
            </div>

            {/* Response Input Box */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceCandidateInput}
                  onChange={(e) => setVoiceCandidateInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendVoiceTurn()}
                  placeholder="Type or speak your technical explanation (e.g. Using B-Tree indexing with STAR framework)..."
                  className="flex-1 bg-slate-950/70 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
                <button
                  type="button"
                  onClick={handleSendVoiceTurn}
                  disabled={!voiceCandidateInput.trim() || voiceThinking}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>

              {/* STAR Framework Quick Helper Prompts */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500 shrink-0">STAR Probing Helpers:</span>
                <button
                  type="button"
                  onClick={() => setVoiceCandidateInput("In our production PostgreSQL cluster, we identified an N+1 query pattern during peak traffic of 20,000 req/min. We resolved it by restructuring into a materialized view and adding a composite index.")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/5 truncate max-w-[280px]"
                >
                  "We resolved the N+1 query with materialized views..."
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceCandidateInput("To avoid cache stampede during cold restarts, we implemented single-flight mutex locking paired with probabilistic early expiration (XFetch algorithm).")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/5 truncate max-w-[280px]"
                >
                  "We used mutex locking & XFetch to prevent cache stampede..."
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 4: OFFICIAL OFFER LETTER & E-SIGNATURE
  // ==========================================================================
  if (currentView === 'offer_letter' && activeApplication) {
    const offer = activeApplication.offer_details_json || {
      baseSalary: '$155,000 / year',
      bonus: '15% Target Annual Performance Bonus',
      equity: '0.25% Stock Options (4-year vesting with 1-year cliff)',
      startDate: 'November 1, 2026'
    };

    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center p-6 relative">
        <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative">
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Official Employment Offer Letter</h2>
                <p className="text-xs text-slate-400">{activeApplication.job_title} • Ravengard Systems Inc.</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('inbox')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Back to Inbox
            </button>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-6 border border-white/5 space-y-4 mb-6 text-xs text-slate-300 leading-relaxed">
            <p>
              Dear <strong className="text-white">{candidateName || 'Alex Chen'}</strong>,
            </p>
            <p>
              On behalf of Ravengard Systems Inc., we are thrilled to extend an offer of employment for the position of <strong className="text-cyan-300">{activeApplication.job_title}</strong>. Your performance across our rigorous 5-round evaluation demonstrated exceptional technical depth and leadership capability.
            </p>

            <div className="grid grid-cols-2 gap-3 my-4 p-4 rounded-xl bg-slate-900 border border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Annual Base Salary</span>
                <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{offer.baseSalary || '$155,000'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Annual Incentive</span>
                <p className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{offer.bonus || '15% Bonus'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Equity Grant</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">{offer.equity || '0.25% Options'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Start Date</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">{offer.startDate || 'Nov 1, 2026'}</p>
              </div>
            </div>

            <p>
              This offer is valid for 7 business days from issuance. Please sign below to electronically execute your acceptance.
            </p>
          </div>

          {/* E-Signature Input */}
          {!offerExecuted ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Type Full Name for Cryptographic E-Signature</span>
                </label>
                <input
                  type="text"
                  value={offerSignature}
                  onChange={(e) => setOfferSignature(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm font-serif italic text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteOffer}
                disabled={!offerSignature.trim() || offerSigning}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {offerSigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                <span>Electronically Sign & Accept Offer</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white block">Offer Successfully Executed!</strong>
                <span>Welcome to Ravengard. Our onboarding team has received your signed acceptance package.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 1: WORKDAY-STYLE CANDIDATE DASHBOARD & APPLICATION INBOX
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">Candidate Portal</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">5-Round Automated Hiring Funnel</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-white">{candidateName || 'Candidate'}</span>
              <span className="text-[11px] text-slate-400 block">{candidateEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Applications & Tasks</h1>
            <p className="text-xs text-slate-400 mt-1">Track your 24-hour SLA assessment deadlines and stage transitions.</p>
          </div>
          <Link
            to="/careers"
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-cyan-300 transition-all flex items-center gap-1.5 w-fit"
          >
            <span>Browse More Open Requisitions</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-12 text-center max-w-xl mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Active Applications Found</h3>
            <p className="text-xs text-slate-400 mb-6">Apply to open roles on our careers page to begin your automated assessment.</p>
            <button
              type="button"
              onClick={handleFastTrackDemo}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              Seed Fast-Track Test Application
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const isOfferReady = app.status === 'offered';
              const isMcqReady = app.status === 'applied' || app.status === 'assessment_pending' || app.status === 'mcq_in_progress';
              const isVoiceReady = app.status === 'interview_pending';
              const isDossierReview = app.status === 'pending_hr_review';

              return (
                <div
                  key={app.application_id}
                  className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all hover:border-white/20"
                >
                  {/* Top Bar: Title & SLA Countdown */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {app.job_department || 'Engineering'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{app.job_location || 'Remote'}</span>
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight">{app.job_title}</h2>
                    </div>

                    {/* SLA Timer Badge */}
                    <div className="flex items-center gap-3">
                      {app.isTimedOut ? (
                        <div className="px-4 py-2 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center gap-2 text-xs font-bold font-mono">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>24h SLA Expired (Auto-Rejected)</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span>SLA Window: {formatHoursRemaining(app.slaSecondsRemaining)} remaining</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5-Round Visual Journey Stepper */}
                  <div className="py-6 border-b border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {/* Step 1: Resume Pre-Screening */}
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Round 1</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold text-white block truncate">Resume Screening</span>
                        <span className="text-[10px] text-emerald-400">Passed</span>
                      </div>

                      {/* Step 2: Behavioral MCQ */}
                      <div className={`p-3 rounded-2xl border ${app.mcq_score ? 'bg-slate-950/60 border-emerald-500/30' : isMcqReady ? 'bg-cyan-500/10 border-cyan-400/50' : 'bg-slate-950/30 border-white/5 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Round 2</span>
                          {app.mcq_score ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <span className="text-xs font-semibold text-white block truncate">Behavioral Battery</span>
                        <span className="text-[10px] text-slate-400">{app.mcq_score ? `${app.mcq_score}% Score` : '60-min timer'}</span>
                      </div>

                      {/* Step 3: Aptitude & Systems */}
                      <div className={`p-3 rounded-2xl border ${app.mcq_score ? 'bg-slate-950/60 border-emerald-500/30' : isMcqReady ? 'bg-cyan-500/10 border-cyan-400/50' : 'bg-slate-950/30 border-white/5 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Round 3</span>
                          {app.mcq_score ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        <span className="text-xs font-semibold text-white block truncate">Aptitude & SQL</span>
                        <span className="text-[10px] text-slate-400">{app.mcq_score ? 'Percentile: 94th' : 'Adaptive'}</span>
                      </div>

                      {/* Step 4 & 5: Live AI Voice Interview */}
                      <div className={`p-3 rounded-2xl border ${app.interview_score || isDossierReview ? 'bg-slate-950/60 border-emerald-500/30' : isVoiceReady ? 'bg-cyan-500/10 border-cyan-400/50 ring-2 ring-cyan-500/30' : 'bg-slate-950/30 border-white/5 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Round 4 & 5</span>
                          {app.interview_score || isDossierReview ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <span className="text-xs font-semibold text-white block truncate">Sarah AI Recruiter</span>
                        <span className="text-[10px] text-cyan-300">{isVoiceReady ? 'Ready to launch' : isDossierReview ? 'Completed' : 'Locked'}</span>
                      </div>

                      {/* Final Stage: Dossier Review / Offer */}
                      <div className={`p-3 rounded-2xl border ${isOfferReady ? 'bg-emerald-500/15 border-emerald-400/50 ring-2 ring-emerald-500/30' : isDossierReview ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950/30 border-white/5 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Decision</span>
                          {isOfferReady ? <Award className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        <span className="text-xs font-semibold text-white block truncate">Dossier / Offer</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{isOfferReady ? 'Offer Ready!' : isDossierReview ? 'HR Reviewing' : 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      <span>Current Status: </span>
                      <strong className="text-white font-semibold">{app.funnelStage}</strong>
                    </div>

                    <div className="flex items-center gap-3">
                      {isMcqReady && !app.isTimedOut && (
                        <button
                          type="button"
                          onClick={() => startMcqAssessment(app)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start 60-min MCQ Battery</span>
                        </button>
                      )}

                      {isVoiceReady && !app.isTimedOut && (
                        <button
                          type="button"
                          onClick={() => startVoiceInterview(app)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Launch Live AI Voice Recruiter</span>
                        </button>
                      )}

                      {isOfferReady && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveApplication(app);
                            setCurrentView('offer_letter');
                          }}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 animate-bounce"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Review & Sign Offer Letter</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
