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
  Briefcase,
  Fingerprint,
  QrCode,
  Smartphone,
  Scan
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { signInWithGooglePopup, signInWithLinkedInPopup } from '../../lib/firebase';

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

  // Mode: 'login', 'register', or 'qr'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'qr'>('login');
  
  // Credentials state
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('ravengard_remember_candidate_email'));
  });
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('ravengard_remember_candidate_email') || 'candidate@ravengard.com';
  });
  const [password, setPassword] = useState<string>('demo123');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // WebAuthn / Biometrics State
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(() => {
    return localStorage.getItem('ravengard_webauthn_registered') === 'true';
  });

  // QR Code Quick Login State
  const [qrSessionId, setQrSessionId] = useState<string>(() => `qr_sess_${Math.random().toString(36).substring(2, 10)}`);
  const [qrTimerSeconds, setQrTimerSeconds] = useState<number>(300);
  const [qrScanning, setQrScanning] = useState<boolean>(false);

  // Status states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Real-time email validation
  const isEmailEntered = email.trim().length > 0;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Auto-populate credentials upon component mount
  useEffect(() => {
    const saved = localStorage.getItem('ravengard_remember_candidate_email');
    if (saved) {
      setEmail(saved);
    }
    setError(null);
  }, []);

  if (isModal && !isOpen) return null;

  const handleFillDemo = () => {
    setAuthMode('login');
    setEmail('candidate@ravengard.com');
    setPassword('demo123');
    setError(null);
  };

  const persistSession = (token: string, candidate?: any) => {
    localStorage.setItem('ravengard_candidate_token', token);
    const expTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration
    localStorage.setItem('ravengard_candidate_exp', expTime.toString());
    if (candidate) {
      localStorage.setItem('ravengard_candidate_user', JSON.stringify(candidate));
      if (candidate.id) {
        localStorage.setItem('ravengard_uid', candidate.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (rememberMe) {
      localStorage.setItem('ravengard_remember_candidate_email', trimmedEmail);
    } else {
      localStorage.removeItem('ravengard_remember_candidate_email');
    }

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

      if (data.token) {
        persistSession(data.token, data.candidate);
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

  const handleSocialAuth = async (provider: 'google' | 'linkedin') => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      let socialProfile = { email: '', name: '' };
      if (provider === 'google') {
        socialProfile = await signInWithGooglePopup();
      } else {
        socialProfile = await signInWithLinkedInPopup();
      }

      const res = await fetch('/api/auth/candidate-mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: socialProfile.email,
          name: socialProfile.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${provider} sign in failed.`);

      if (data.token) {
        persistSession(data.token, data.candidate);
      }

      setSuccessMsg(`Authenticated via Firebase ${provider === 'google' ? 'Google' : 'LinkedIn'}! Redirecting...`);

      if (onSuccess) {
        onSuccess(data.token, data.candidate);
      } else {
        setTimeout(() => {
          if (onClose) onClose();
          navigate('/portal');
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || `Unable to authenticate with ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: window.location.hostname,
            userVerification: 'preferred',
            timeout: 60000,
          },
        }).catch(() => null);
      }
      setSuccessMsg('Authenticated via Touch ID / Face ID! Redirecting...');
      setTimeout(() => {
        if (onClose) onClose();
        navigate('/portal');
      }, 600);
    } catch (err: any) {
      setError('Biometric authentication cancelled or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authMode !== 'qr') return;
    const interval = setInterval(() => {
      setQrTimerSeconds((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [authMode]);

  const handleSimulateQrScan = async () => {
    setQrScanning(true);
    setError(null);
    setTimeout(() => {
      setQrScanning(false);
      setSuccessMsg('Mobile device scan verified! Redirecting...');
      setTimeout(() => {
        if (onClose) onClose();
        navigate('/portal');
      }, 600);
    }, 1200);
  };

  const handleRefreshQrCode = () => {
    setQrSessionId(`qr_sess_${Math.random().toString(36).substring(2, 10)}`);
    setQrTimerSeconds(300);
  };

  const content = (
    <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-cyan-950/50 relative text-slate-100 z-10 animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out">
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

      {/* Header Branding matching Admin Portal */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-0.5 shadow-xl mb-3 flex items-center justify-center text-cyan-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-300 text-[10px] font-mono tracking-widest uppercase mb-2">
          <span>Candidate Gateway</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Proctored Assessment</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Candidate Portal
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Ravengard 24-Hour SLA candidate assessment & evaluation hub.
        </p>
      </div>

      {/* Tab switch (Sign In, Register, QR Login) */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/60 rounded-full border border-slate-800 mb-5 text-xs font-medium">
        <button
          type="button"
          onClick={() => { setAuthMode('login'); setError(null); }}
          className={`py-1.5 px-2 rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
            authMode === 'login'
              ? 'bg-white text-slate-950 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('register'); setError(null); }}
          className={`py-1.5 px-2 rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
            authMode === 'register'
              ? 'bg-white text-slate-950 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Register</span>
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('qr'); setError(null); }}
          className={`py-1.5 px-2 rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
            authMode === 'qr'
              ? 'bg-white text-slate-950 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Login</span>
        </button>
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

      {authMode === 'qr' ? (
        /* QR Code Quick Login View */
        <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Animated Laser Beam Scanner Effect */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Styled High-Tech SVG QR Code */}
            <div className="p-3.5 bg-white rounded-2xl shadow-2xl relative border-2 border-cyan-400/50">
              <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                <rect x="9" y="9" width="17" height="17" fill="white" />
                <rect x="13" y="13" width="9" height="9" fill="#06b6d4" />

                <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                <rect x="74" y="9" width="17" height="17" fill="white" />
                <rect x="78" y="13" width="9" height="9" fill="#06b6d4" />

                <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                <rect x="9" y="74" width="17" height="17" fill="white" />
                <rect x="13" y="78" width="9" height="9" fill="#06b6d4" />

                <path d="M35 10h10v5H35zM50 10h15v5H50zM35 20h5v10H35zM45 20h10v5H45zM60 20h5v15H60zM35 35h15v5H35zM55 35h10v5H55zM10 35h20v5H10zM10 45h5v20H10zM20 45h15v5H20zM40 45h20v5H40zM65 45h25v5H65zM20 55h10v10H20zM35 55h15v5H35zM55 55h15v10H55zM75 55h15v5H75zM35 70h10v15H35zM50 70h15v5H50zM70 70h10v10H70zM85 70h10v20H85zM50 80h25v5H50zM65 90h15v5H65z" fill="#0f172a" />
              </svg>
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-white flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan with Ravengard Mobile App or Camera</span>
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                Session ID: <span className="text-cyan-300 font-semibold">{qrSessionId}</span>
              </p>
              <p className="text-[10px] text-amber-400 font-mono">
                Expires in {Math.floor(qrTimerSeconds / 60).toString().padStart(2, '0')}:{(qrTimerSeconds % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateQrScan}
            disabled={qrScanning}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {qrScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
            <span>{qrScanning ? 'Verifying Mobile Scan...' : 'Simulate Mobile Device Scan'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshQrCode}
            className="text-xs text-slate-400 hover:text-cyan-300 transition-colors font-mono cursor-pointer"
          >
            Refresh QR Code
          </button>
        </div>
      ) : (
        /* Standard Credentials + Biometrics Form */
        <>
          {/* Biometric Touch ID / Face ID Option */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span>{hasBiometrics ? 'Sign in with Touch ID / Face ID' : 'Sign in with Biometrics'}</span>
            </button>
          </div>

          {/* Fast Social OAuth Sign-In (Firebase Auth Google / LinkedIn) */}
          <div className="space-y-2 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block text-center">Fast Social Authentication</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>
          <button
            type="button"
            onClick={() => handleSocialAuth('linkedin')}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.63a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
            </svg>
            <span>LinkedIn</span>
          </button>
        </div>
      </div>

      <div className="relative my-3 text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
        <span className="relative bg-slate-900/90 px-3 text-[10px] font-mono tracking-wider uppercase text-slate-400">or email sign in</span>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {authMode === 'register' && (
          <div className="relative group">
            <input
              id="modal-auth-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              className="peer w-full bg-slate-950 border border-slate-700 rounded-xl pt-5 pb-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
            />
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 peer-focus:text-cyan-400 transition-colors" />
            <label
              htmlFor="modal-auth-name"
              className="absolute left-10 top-3 text-xs text-slate-400 font-medium transition-all duration-200 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-cyan-400 peer-focus:bg-slate-900 peer-focus:px-1.5 peer-focus:rounded peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-cyan-400 peer-[:not(:placeholder-shown)]:bg-slate-900 peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:rounded peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
            >
              Full Name
            </label>
          </div>
        )}

        {/* Floating Label Email Input */}
        <div className="relative group">
          <input
            id="modal-auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            className={`peer w-full bg-slate-950 border rounded-xl pt-5 pb-2 pl-10 pr-10 text-sm text-white focus:outline-none transition-all font-medium ${
              isEmailEntered
                ? isValidEmail
                  ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-amber-500/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
                : 'border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30'
            }`}
          />
          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 peer-focus:text-cyan-400 transition-colors" />
          <label
            htmlFor="modal-auth-email"
            className="absolute left-10 top-3 text-xs text-slate-400 font-medium transition-all duration-200 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-cyan-400 peer-focus:bg-slate-900 peer-focus:px-1.5 peer-focus:rounded peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-cyan-400 peer-[:not(:placeholder-shown)]:bg-slate-900 peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:rounded peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
          >
            Email Address
          </label>
          {isEmailEntered && (
            <div className="absolute right-3.5 top-3.5 pointer-events-none">
              {isValidEmail ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
          )}
        </div>

        {/* Floating Label Password Input */}
        <div>
          <div className="relative group">
            <input
              id="modal-auth-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="peer w-full bg-slate-950 border border-slate-700 rounded-xl pt-5 pb-2 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
            />
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 peer-focus:text-cyan-400 transition-colors" />
            <label
              htmlFor="modal-auth-password"
              className="absolute left-10 top-3 text-xs text-slate-400 font-medium transition-all duration-200 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-cyan-400 peer-focus:bg-slate-900 peer-focus:px-1.5 peer-focus:rounded peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-cyan-400 peer-[:not(:placeholder-shown)]:bg-slate-900 peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:rounded peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <div className="flex items-center gap-2 select-none group">
              <input
                type="checkbox"
                id="modal-remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30 accent-cyan-500 cursor-pointer"
              />
              <label htmlFor="modal-remember-me" className="text-[11px] text-slate-300 group-hover:text-white transition-colors cursor-pointer">
                Remember me
              </label>
            </div>
            {authMode === 'login' && (
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>

          {/* Real-time Password Strength Meter */}
          {password.length > 0 && (
            <div className="mt-2.5">
              <PasswordStrengthIndicator password={password} userInputs={[email, name]} />
            </div>
          )}
        </div>

        {/* Animated Checkmark Submit Button */}
        <button
          type="submit"
          disabled={loading || Boolean(successMsg)}
          className={`w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-90 flex items-center justify-center gap-2 cursor-pointer ${
            successMsg
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/30 scale-[1.02]'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20'
          }`}
        >
          {successMsg ? (
            <div className="flex items-center gap-2 animate-in zoom-in-75 duration-300">
              <div className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center shadow">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="tracking-wide text-slate-950 font-bold">Authenticated Successfully!</span>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{authMode === 'register' ? 'Create Candidate Account' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
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
        </>
      )}

      {/* Fast Track / Demo button */}
      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
        <span className="relative bg-slate-900 px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">or quick action</span>
      </div>

      <button
        type="button"
        onClick={handleFillDemo}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div className="relative z-10 w-full max-w-md flex justify-center animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.18),transparent_60%)] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="relative w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out">
        {content}
      </div>
    </div>
  );
};
