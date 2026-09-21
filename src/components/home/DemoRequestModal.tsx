import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Sparkles, Building2, Mail, User, Users, ChevronDown, ArrowRight } from 'lucide-react';

export type PricingTierName = 'Growth Pilot' | 'Enterprise Copilot' | 'Global Scale';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: PricingTierName;
}

export function DemoRequestModal({ isOpen, onClose, initialTier = 'Enterprise Copilot' }: DemoRequestModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('10–50 hires/mo');
  const [selectedTier, setSelectedTier] = useState<PricingTierName>(initialTier);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTier) {
      setSelectedTier(initialTier);
    }
  }, [initialTier]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on modal close after delay
      const timer = setTimeout(() => {
        setIsSubmitted(false);
        setErrorMessage(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    if (!company.trim()) {
      setErrorMessage('Please enter your company or organization name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          company: company.trim(),
          teamSize,
          selectedTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit demo request.');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Lead submission error:', err);
      setErrorMessage(err.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          {/* Overlay click to close */}
          <div className="fixed inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0f1117] p-6 sm:p-8 shadow-2xl text-white z-10 my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {isSubmitted ? (
              /* Success Confirmation State */
              <div className="py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-semibold text-white tracking-tight">
                    Request Received!
                  </h3>
                  <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                    Our talent strategy team will reach out within <span className="text-white font-medium">2 hours</span>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs font-mono space-y-1.5 max-w-xs mx-auto text-white/60">
                  <div className="flex justify-between">
                    <span>Selected Plan:</span>
                    <span className="text-[var(--color-secondary)] font-semibold">{selectedTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company:</span>
                    <span className="text-white">{company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact:</span>
                    <span className="text-white truncate max-w-[140px]">{email}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors cursor-pointer shadow-lg"
                >
                  Close Window
                </button>
              </div>
            ) : (
              /* Form State */
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-xs font-mono font-medium mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Technical Talent Infrastructure</span>
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
                    Book an Enterprise Consultation
                  </h2>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Explore deterministic rubric scoring, native ATS synchronization, and high-throughput technical evaluations.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-white/80">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Jenkins"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.06] transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-white/80">
                      Work Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="s.jenkins@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.06] transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-white/80">
                      Company / Organization Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stripe, Palantir, Vercel"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.06] transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Two-column: Team Size & Selected Tier */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Team Size / Hiring Volume */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-white/80">
                        Hiring Volume
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={teamSize}
                          onChange={(e) => setTeamSize(e.target.value)}
                          className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 focus:bg-[#161822] transition-all font-sans appearance-none cursor-pointer"
                        >
                          <option value="1–10 hires/mo" className="bg-[#12141a]">1–10 hires/mo</option>
                          <option value="10–50 hires/mo" className="bg-[#12141a]">10–50 hires/mo</option>
                          <option value="50+ hires/mo" className="bg-[#12141a]">50+ hires/mo</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Selected Tier */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-white/80">
                        Interested Plan
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTier}
                          onChange={(e) => setSelectedTier(e.target.value as PricingTierName)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 focus:bg-[#161822] transition-all font-sans appearance-none cursor-pointer"
                        >
                          <option value="Growth Pilot" className="bg-[#12141a]">Growth Pilot ($490/mo)</option>
                          <option value="Enterprise Copilot" className="bg-[#12141a]">Enterprise Copilot ($1,850/mo)</option>
                          <option value="Global Scale" className="bg-[#12141a]">Global Scale (Custom)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 transition-all cursor-pointer shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                          <span>Processing Request...</span>
                        </>
                      ) : (
                        <>
                          <span>Request Enterprise Demo</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
