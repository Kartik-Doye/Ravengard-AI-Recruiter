import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';

interface HrLoginProps {
  onSuccess?: () => void;
}

export default function HrLogin({ onSuccess }: HrLoginProps) {
  const [email, setEmail] = useState('hr@ravengard.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/hr/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate HR account.');
      }

      localStorage.setItem('ravengard_hr_token', data.token);
      localStorage.setItem('ravengard_hr_user', JSON.stringify(data.user));

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/hr', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Background glow accents matching homepage */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.15),transparent_60%)] blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 shadow-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white font-display">
          Ravengard Talent Suite
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-mono tracking-wider uppercase">
          HR & Employer Recruitment Gateway
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 font-sans">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@company.com"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-mono text-slate-400 hover:text-white hover:underline transition-all cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Employer Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Pre-Configured Demo Account
            </span>
            <button
              type="button"
              onClick={() => handleQuickDemo('hr@ravengard.com')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-mono cursor-pointer"
            >
              <span>hr@ravengard.com</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold border border-slate-700">
                HR Admin (admin123)
              </span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/candidate"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 font-mono"
            >
              <span>Are you a candidate? Go to Candidate Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Forgot Password / Account Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={email}
        portalType="hr"
      />
    </div>
  );
}
