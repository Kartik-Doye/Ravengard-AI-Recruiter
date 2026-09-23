import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff, Building2, Globe, Check } from 'lucide-react';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';

interface AdminLoginProps {
  onSuccess: (token: string) => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'sso'>('password');
  const [roleMode, setRoleMode] = useState<'HR' | 'ADMIN'>('HR');
  const [username, setUsername] = useState('hr@ravengard.com');
  const [password, setPassword] = useState('admin123');
  const [ssoDomain, setSsoDomain] = useState('ravengard.com');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSelect = (mode: 'HR' | 'ADMIN') => {
    setRoleMode(mode);
    if (mode === 'HR') {
      setUsername('hr@ravengard.com');
      setPassword('admin123');
    } else {
      setUsername('admin@ravengard.com');
      setPassword('admin123');
    }
  };

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
        localStorage.setItem('ravengard_hr_token', data.token);
        if (data.admin) {
          localStorage.setItem('ravengard_admin_user', JSON.stringify(data.admin));
          localStorage.setItem('ravengard_hr_user', JSON.stringify(data.admin));
        }

        onSuccess(data.token);

        // Role-based routing: HR goes to /hr, Admin to /admin
        const isHrRole = data.role === 'HR' || data.specificRole === 'hr_admin' || data.specificRole === 'recruiter';
        const from = (location.state as any)?.from?.pathname;
        if (from && from !== '/admin/login') {
          navigate(from, { replace: true });
        } else if (isHrRole) {
          navigate('/hr', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        setError(data.error || 'Invalid enterprise credentials. Access denied.');
      }
    } catch (err: any) {
      console.error('Admin login network failure:', err);
      setError('Unable to contact the authentication authority. Verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoLogin = async (provider: 'google_workspace' | 'microsoft_entra' | 'okta') => {
    setError(null);
    setSsoLoading(provider);

    try {
      const corporateEmail = `${roleMode === 'HR' ? 'hr' : 'admin'}@${ssoDomain || 'ravengard.com'}`;
      const res = await fetch('/api/admin/sso-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: corporateEmail,
          name: roleMode === 'HR' ? 'HR Talent Director' : 'Ravengard Systems Admin',
          roleHint: roleMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('ravengard_admin_token', data.token);
        localStorage.setItem('ravengard_hr_token', data.token);
        if (data.admin) {
          localStorage.setItem('ravengard_admin_user', JSON.stringify(data.admin));
          localStorage.setItem('ravengard_hr_user', JSON.stringify(data.admin));
        }

        onSuccess(data.token);

        const isHrRole = data.role === 'HR' || data.specificRole === 'hr_admin';
        if (isHrRole) {
          navigate('/hr', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        setError(data.error || `Failed to authenticate with ${provider}.`);
      }
    } catch (err: any) {
      console.error('SSO login error:', err);
      setError('Enterprise SSO connection timed out. Please try password sign in.');
    } finally {
      setSsoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-emerald-600/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-0.5 shadow-xl shadow-indigo-600/25 mb-3.5 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono tracking-widest uppercase mb-2">
            <span>Enterprise Gateway</span>
            <span className="w-1 h-1 rounded-full bg-indigo-400" />
            <span>RBAC Protected</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            HR & Admin Operations
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Restricted talent management and evaluation audit portal. Authorized personnel only.
          </p>
        </div>

        {/* Card Panel */}
        <div className="p-7 rounded-xl border border-white/10 bg-[#0C101B]/95 backdrop-blur-2xl shadow-2xl space-y-5">
          {/* Role Mode Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => handleRoleSelect('HR')}
              className={`py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'HR'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>HR & Talent Team</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>System Admin</span>
            </button>
          </div>

          {/* Authentication Method Tabs */}
          <div className="flex border-b border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'password'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Corporate Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sso')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sso'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise SSO</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <input
                  id="admin-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={roleMode === 'HR' ? 'hr@ravengard.com' : 'admin@ravengard.com'}
                  required
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] font-mono text-indigo-400 hover:underline transition-all cursor-pointer"
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
                    className="w-full bg-white/5 border border-white/10 text-white pl-3.5 pr-10 py-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick credential helper */}
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-zinc-300">Quick Demo Account:</span>
                  <span className="text-indigo-300 font-semibold">{username} / admin123</span>
                </div>
              </div>

              <button
                id="admin-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing Access...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {roleMode === 'HR' ? 'Talent Portal' : 'Admin Audit'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Enterprise SSO Options */
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 uppercase tracking-wider mb-1.5">
                  Corporate Identity Domain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ssoDomain}
                    onChange={(e) => setSsoDomain(e.target.value)}
                    placeholder="ravengard.com"
                    className="w-full bg-white/5 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  disabled={!!ssoLoading}
                  onClick={() => handleSsoLogin('google_workspace')}
                  className="w-full py-2.5 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {ssoLoading === 'google_workspace' ? (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Sign in with Google Workspace</span>
                </button>

                <button
                  type="button"
                  disabled={!!ssoLoading}
                  onClick={() => handleSsoLogin('microsoft_entra')}
                  className="w-full py-2.5 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {ssoLoading === 'microsoft_entra' ? (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                  )}
                  <span>Sign in with Microsoft Entra (Azure AD)</span>
                </button>

                <button
                  type="button"
                  disabled={!!ssoLoading}
                  onClick={() => handleSsoLogin('okta')}
                  className="w-full py-2.5 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {ssoLoading === 'okta' ? (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-indigo-400 flex items-center justify-center text-[9px] font-bold text-indigo-400">
                      O
                    </div>
                  )}
                  <span>Sign in with Okta SSO</span>
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 text-center pt-1">
                Authenticating validates corporate identity claim and issues a tenant-scoped JWT.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 text-center">
            <a
              href="/"
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors inline-block"
            >
              ← Return to Candidate Gateway
            </a>
          </div>
        </div>

        {/* Security watermark */}
        <div className="mt-5 text-center text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
          Ravengard Recruiter • Tenant Isolation & IAM Active
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={username.includes('@') ? username : ''}
        portalType="admin"
      />
    </div>
  );
}
