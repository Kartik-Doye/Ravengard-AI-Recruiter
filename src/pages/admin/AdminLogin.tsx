import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff, Building2, Globe, Check } from 'lucide-react';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';

interface AdminLoginProps {
  onSuccess: (token: string) => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialToken = searchParams.get('token') || '';

  const [activeTab, setActiveTab] = useState<'password' | 'sso' | 'setup'>(initialToken ? 'setup' : 'password');
  const [roleMode, setRoleMode] = useState<'HR' | 'ADMIN'>('ADMIN');
  const [username, setUsername] = useState('madhunand@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [setupTokenInput, setSetupTokenInput] = useState(initialToken);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [ssoDomain, setSsoDomain] = useState('ravengard.com');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: username.trim(),
          token: setupTokenInput.trim(),
          newPassword: newAdminPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setSetupSuccess('Super Admin password set successfully! Redirecting...');
        localStorage.setItem('ravengard_admin_token', data.token);
        localStorage.setItem('ravengard_hr_token', data.token);
        if (data.admin) {
          localStorage.setItem('ravengard_admin_user', JSON.stringify(data.admin));
          localStorage.setItem('ravengard_hr_user', JSON.stringify(data.admin));
        }
        onSuccess(data.token);
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 1200);
      } else {
        setError(data.error || 'Failed to verify setup token.');
      }
    } catch (err: any) {
      console.error('Setup token exchange error:', err);
      setError('Unable to verify setup token with the server.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col justify-center items-center px-4 py-12 selection:bg-white/20 selection:text-white relative overflow-hidden font-sans">
      {/* Background ambient lighting matching homepage */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.15),transparent_60%)] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 shadow-xl mb-3.5 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-[10px] font-mono tracking-widest uppercase mb-2">
            <span>Enterprise Gateway</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            <span>RBAC Protected</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            HR & Admin Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Restricted talent management and evaluation audit portal. Authorized personnel only.
          </p>
        </div>

        {/* Card Panel */}
        <div className="p-7 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl space-y-5 text-slate-50">
          {/* Role Mode Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-full border border-slate-800">
            <button
              type="button"
              onClick={() => handleRoleSelect('HR')}
              className={`py-2 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'HR'
                  ? 'bg-white text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>HR & Talent Team</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`py-2 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'ADMIN'
                  ? 'bg-white text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>System Admin</span>
            </button>
          </div>

          {/* Authentication Method Tabs */}
          <div className="flex border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'password'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Corporate Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sso')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sso'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-300" />
              <span>Enterprise SSO</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'setup'
                  ? 'border-purple-400 text-purple-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-purple-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Setup Token</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {setupSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-emerald-300 text-xs">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{setupSuccess}</span>
            </div>
          )}

          {activeTab === 'setup' ? (
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                Enter your startup auto-generated setup token to initialize permanent Super Admin credentials for <strong className="text-white">madhunand@gmail.com</strong>.
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Super Admin Email
                </label>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900/60 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Setup Token
                </label>
                <input
                  type="text"
                  value={setupTokenInput}
                  onChange={(e) => setSetupTokenInput(e.target.value)}
                  placeholder="Paste 32-character crypto setup token"
                  required
                  className="w-full bg-slate-900/60 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Choose Permanent Password
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-slate-900/60 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/30 disabled:opacity-50"
              >
                {loading ? 'Verifying Token...' : 'Initialize & Sign In as Super Admin'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : activeTab === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
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
                  className="w-full bg-slate-900/60 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-slate-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider">
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
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full bg-slate-900/60 border border-slate-800 text-white pl-3.5 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick credential helper */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-300">Quick Demo Account:</span>
                  <span className="text-white font-semibold">{username} / admin123</span>
                </div>
              </div>

              <button
                id="admin-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-white hover:bg-slate-100 text-slate-950 font-semibold py-3 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Access...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {roleMode === 'HR' ? 'Talent Portal' : 'Admin Audit'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Enterprise SSO Options */
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Corporate Identity Domain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ssoDomain}
                    onChange={(e) => setSsoDomain(e.target.value)}
                    placeholder="ravengard.com"
                    className="w-full bg-slate-900/60 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  disabled={!!ssoLoading}
                  onClick={() => handleSsoLogin('google_workspace')}
                  className="w-full py-2.5 px-4 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 hover:text-white text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {ssoLoading === 'google_workspace' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  className="w-full py-2.5 px-4 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 hover:text-white text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {ssoLoading === 'microsoft_entra' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  className="w-full py-2.5 px-4 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 hover:text-white text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {ssoLoading === 'okta' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white">
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
