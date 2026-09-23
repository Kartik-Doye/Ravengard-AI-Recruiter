import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';

interface AdminLoginProps {
  onSuccess: (token: string) => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('ravengard_admin_token', data.token);
        onSuccess(data.token);
        // Navigate to /admin or original destination
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from === '/admin/login' ? '/admin' : from, { replace: true });
      } else {
        setError(data.error || 'Invalid administrator credentials. Access denied.');
      }
    } catch (err: any) {
      console.error('Admin login network failure:', err);
      setError('Unable to contact the authentication authority. Verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-0)] flex flex-col justify-center items-center px-4 py-12 selection:bg-[var(--color-secondary)] selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-xl backdrop-blur-md">
            <ShieldCheck className="w-7 h-7 text-[var(--color-secondary)]" />
          </div>
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[var(--color-secondary)] mb-1">
            Phase 7 Security Protocol
          </span>
          <h1 className="text-2xl font-display font-light tracking-wide text-white">
            Admin Access Portal
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-xs">
            Restricted evaluation control panel. Authorized enterprise auditors only.
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-widest mb-1.5">
                Admin Username or Email
              </label>
              <div className="relative">
                <input
                  id="admin-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-sans focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-widest">
                  Master Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-mono text-[var(--color-secondary)] hover:underline transition-all cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white pl-4 pr-11 py-2.5 rounded-lg text-sm font-sans focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] transition-all placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors cursor-pointer"
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

            {/* Credential Hint Badge */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-[11px] text-white/60 space-y-1">
              <div className="flex items-center gap-1.5 text-white/80 font-mono font-medium">
                <KeyRound className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                <span>Default Credentials</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-white/50 pt-0.5">
                <span>User: <strong className="text-white/80">admin</strong></span>
                <span>Pass: <strong className="text-white/80">admin123</strong></span>
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 py-2.5 px-4 rounded-lg font-medium text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-white/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 text-center">
            <a
              href="/"
              className="text-[11px] text-white/40 hover:text-white/80 transition-colors inline-block"
            >
              ← Return to Candidate Gateway
            </a>
          </div>
        </div>

        {/* Security watermark */}
        <div className="mt-6 text-center text-[10px] font-mono text-white/30 tracking-wider uppercase">
          Ravengard Assessment Platform • Isolated Audit Plane
        </div>
      </div>

      {/* Forgot Password / Account Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={username.includes('@') ? username : ''}
        portalType="admin"
      />
    </div>
  );
}
