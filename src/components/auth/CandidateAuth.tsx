import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export interface CandidateAuthProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (token: string, candidate: any) => void;
  isModal?: boolean;
}

export const CandidateAuth: React.FC<CandidateAuthProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  isModal = false,
}) => {
  const navigate = useNavigate();

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Credentials state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Status states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Auto-populate with demo credentials upon component mount
  useEffect(() => {
    setEmail('candidate@ravengard.com');
    setPassword('demo123');
    setError(null);
  }, []);

  if (isModal && !isOpen) return null;

  const handleFillDemo = () => {
    setAuthMode('login');
    setEmail('candidate@ravengard.com');
    setPassword('demo123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    const endpoint = authMode === 'login' ? '/api/candidate/auth/login' : '/api/candidate/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      // Persist auth tokens
      if (data.token) {
        localStorage.setItem('ravengard_candidate_token', data.token);
        if (data.candidate?.id) {
          localStorage.setItem('ravengard_uid', data.candidate.id);
        }
      }

      setSuccessMsg(authMode === 'login' ? 'Authentication successful! Redirecting...' : 'Account created! Redirecting...');

      if (onSuccess) {
        onSuccess(data.token, data.candidate);
      } else {
        setTimeout(() => {
          if (onClose) onClose();
          navigate('/portal');
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to candidate service.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/30 rounded-3xl p-8 shadow-2xl shadow-cyan-950/50 relative text-slate-100 z-10">
      {/* Close button if in modal mode */}
      {isModal && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight text-white">Candidate Portal</h2>
            <p className="text-xs text-slate-400">Ravengard Assessment Hub</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-800/80 rounded-xl p-1 border border-white/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              authMode === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              authMode === 'register'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {successMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === 'register' && (
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@ravengard.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-200">Password</label>
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
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>{authMode === 'register' ? 'Create Candidate Account' : 'Sign In to Portal'}</span>
        </button>

        {/* Demo Helper Text */}
        {authMode === 'login' && (
          <div className="mt-3 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-center shadow-inner">
            <p className="text-xs text-cyan-300 font-medium">
              Demo Candidate: <span className="text-white font-mono font-semibold">candidate@ravengard.com</span> / <span className="text-white font-mono font-semibold">demo123</span>
            </p>
          </div>
        )}
      </form>

      {/* Fast Track / Demo button */}
      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
        <span className="relative bg-slate-900 px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">or quick action</span>
      </div>

      <button
        type="button"
        onClick={handleFillDemo}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-cyan-300 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Reset Demo Credentials</span>
      </button>

      {/* Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <Link
          to="/careers"
          onClick={isModal && onClose ? onClose : undefined}
          className="hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
          <span>Open Positions</span>
        </Link>
        <Link
          to="/assessment-guide"
          onClick={isModal && onClose ? onClose : undefined}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
        >
          Assessment Guide
        </Link>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal
          isOpen={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          defaultEmail={email}
          portalType="candidate"
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative z-10 w-full max-w-md flex justify-center">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col justify-center items-center px-4 py-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[110px] pointer-events-none" />
      {content}
    </div>
  );
};
