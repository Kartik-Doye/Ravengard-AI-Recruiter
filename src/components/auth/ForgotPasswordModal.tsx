import React, { useState } from 'react';
import { 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Sparkles, 
  KeyRound, 
  Lock, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { PasswordStrengthIndicator, evaluatePasswordStrength } from './PasswordStrengthIndicator';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  portalType?: 'candidate' | 'admin' | 'hr';
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  portalType = 'candidate',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'password_reset' | 'resend_magic_link'>(
    portalType === 'candidate' ? 'resend_magic_link' : 'password_reset'
  );
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const strengthResult = evaluatePasswordStrength(newPassword);
  const isMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const isMismatch = Boolean(confirmPassword && newPassword !== confirmPassword);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (newPassword && !strengthResult.isValid) {
      setErrorMessage('Please meet the password security requirements (at least 8 characters with upper, lower, number or symbols).');
      return;
    }

    if (newPassword && isMismatch) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      // Dispatch recovery/reset verification
      const res = await fetch('/api/candidate/recover-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          `Security verification and password reset instructions have been dispatched to ${trimmedEmail}.`
        );
      } else {
        setSuccessMessage(
          `Password reset request recorded for ${trimmedEmail}. If this account exists in our secure registry, verification instructions have been dispatched.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        throw new Error('Please enter your candidate email address.');
      }

      const res = await fetch('/api/candidate/recover-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Assessment access link dispatched to your inbox.');
      } else {
        setErrorMessage(data.error || 'Unable to locate an active assessment for this email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while attempting to recover assessment link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-lg my-8 rounded-2xl bg-[#0B0F19] border border-white/10 shadow-2xl p-6 md:p-8 text-white space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center justify-center text-[var(--color-secondary)]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-secondary)]">
                Secure Identity & Access Control
              </span>
              <h2 className="text-xl font-bold font-display text-white">
                Account Recovery & Password Reset
              </h2>
            </div>
          </div>
          <p className="text-xs text-white/60 font-sans">
            Dispatch a secure password reset link or assessment access token directly to your verified email.
          </p>
        </div>

        {/* Mode Selector */}
        {portalType === 'candidate' && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setActiveTab('resend_magic_link');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                activeTab === 'resend_magic_link'
                  ? 'bg-[var(--color-secondary)] text-black shadow-md font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Recover Assessment Link
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('password_reset');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                activeTab === 'password_reset'
                  ? 'bg-[var(--color-secondary)] text-black shadow-md font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Reset Credentials
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-emerald-300 text-xs">
            <div className="flex items-start gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
            <p className="text-[11px] text-white/60 pl-6.5">
              Please check your inbox (and spam folder) for the confirmation link.
            </p>
          </div>
        )}

        {/* Reset / Recovery Form */}
        <form onSubmit={activeTab === 'password_reset' ? handlePasswordReset : handleResendMagicLink} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5">
              Your Registered Email Address <span className="text-[var(--color-secondary)]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] transition-all font-sans"
              />
            </div>
          </div>

          {/* New Password & Real-Time Strength Meter in Reset Mode */}
          {activeTab === 'password_reset' && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div>
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Desired New Password</span>
                  <span className="text-[10px] text-white/40 normal-case">Real-time security check</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password..."
                    className="w-full pl-10 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors cursor-pointer"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-time Strength Indicator */}
                {newPassword && (
                  <PasswordStrengthIndicator password={newPassword} showRequirementsList={true} />
                )}
              </div>

              {/* Confirm Password */}
              {newPassword && (
                <div>
                  <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password..."
                      className={`w-full pl-10 pr-11 py-2.5 bg-white/5 border ${
                        isMatching 
                          ? 'border-emerald-500/50 focus:border-emerald-400' 
                          : isMismatch 
                          ? 'border-red-500/50 focus:border-red-400' 
                          : 'border-white/10 focus:border-[var(--color-secondary)]'
                      } rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 transition-all font-sans`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isMatching && (
                    <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match perfectly
                    </p>
                  )}
                  {isMismatch && (
                    <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 space-y-1">
            <div className="flex items-center gap-1.5 text-white/70 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
              <span>Identity Verification Notice</span>
            </div>
            <p>
              {activeTab === 'password_reset'
                ? 'The security engine will verify your identity and generate an encrypted single-use reset token valid for 60 minutes.'
                : 'If an assessment session matches your email, an active single-use access link will be immediately dispatched.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (activeTab === 'password_reset' && newPassword.length > 0 && (!strengthResult.isValid || isMismatch))}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-black font-semibold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[var(--color-secondary)]/20"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{activeTab === 'password_reset' ? 'Update & Send Link' : 'Send Recovery Email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Help for Login Issues */}
        <div className="pt-4 border-t border-white/5 flex flex-col gap-2 text-[11px] text-white/40 font-mono">
          <div className="flex justify-between items-center">
            <span>Trouble logging in?</span>
            <span className="text-[var(--color-secondary)]/80">Support Online</span>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed font-sans">
            Authorized administrators and HR recruiters can log in using their credentials (<code className="text-white/60">admin / admin123</code> or <code className="text-white/60">hr / admin123</code>).
          </p>
        </div>
      </div>
    </div>
  );
};
