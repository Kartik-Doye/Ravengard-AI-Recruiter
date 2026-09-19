import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Scale, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, -28]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.22),transparent_55%)]" />
        <PaperScrunchOverlay />
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:gap-16 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        {/* Left Column: Hero Typography & Actions */}
        <motion.div style={{ y: fgY }} className="relative z-10 flex flex-col">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-secondary)]" /> Designed for fair, auditable hiring.
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl leading-[1.08]">
            Cut time-to-hire by 40% with auditable AI interviews.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-white/80 md:text-xl md:leading-9">
            Run 1,000+ first-round technical evaluations per month with structured rubric rubrics, deterministic scoring, and recruiter-ready work samples.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              to="/gateway"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#060814] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              Run Candidate Demo
              <ArrowRight className="w-4 h-4 text-[#060814]" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
            >
              Watch 2-min Demo
            </Link>
          </div>
          
          {/* Trust Badges - Spaced with generous vertical padding and clean visual separators */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center gap-y-3 gap-x-6 text-sm font-medium text-white/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>GDPR-aligned</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SOC 2 controls</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>EEOC-aware scoring</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-violet-300">
              <Scale className="w-4 h-4 shrink-0" />
              <span>Deterministic Rubrics</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Hero Feature Card */}
        <div className="relative flex flex-col z-10">
          {/* Primary Card: Fairness & Integrity */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
            className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center group hover:border-white/20 transition-colors"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_65%)]" />
            
            <div className="relative z-10 flex flex-col items-center gap-4 py-2">
              <div className="text-[var(--color-secondary)] p-3 rounded-2xl bg-white/5 border border-white/10">
                <svg width="64" height="64" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="4"/>
                  <path d="M38 62L54 78L84 46" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Zero Proctoring Surveillance
                </div>
                <h3 className="text-2xl font-semibold text-white tracking-tight">Fairness & Candidate Prep</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70 max-w-sm mx-auto">
                  Transparent, rubric-grounded evaluations that empower candidates and hiring teams. Auditable decisions with zero black-box scoring.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
