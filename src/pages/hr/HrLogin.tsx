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
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0E1526] rounded-[10px] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white font-display">
          Ravengard Talent Suite
        </h2>
        <p className="mt-1 text-center text-xs text-white/50 font-mono tracking-wider uppercase">
          HR & Employer Recruitment Gateway
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0E1526]/80 backdrop-blur-xl border border-white/10 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-sans">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-mono text-white/70 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-mono text-blue-400 hover:underline transition-all cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
          <div className="mt-6 pt-6 border-t border-white/10">
            <span className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-2.5 text-center">
              Pre-Configured Demo Account
            </span>
            <button
              type="button"
              onClick={() => handleQuickDemo('hr@ravengard.com')}
              className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white flex items-center justify-between transition-colors font-mono cursor-pointer"
            >
              <span>hr@ravengard.com</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold">
                HR Admin (admin123)
              </span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/candidate"
              className="text-xs text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1 font-mono"
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
