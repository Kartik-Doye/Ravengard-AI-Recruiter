import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

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

      <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <motion.div style={{ y: fgY }} className="relative z-10">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-secondary)]" /> Designed for fair, auditable hiring.
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            Cut time-to-hire by 40% with auditable AI interviews.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-white/80 md:text-xl md:leading-9">
            Run 1,000+ first-round interviews per month with structured AI, bias controls, and compliance-ready audit logs.
          </p>

          <div className="mt-10 flex flex-col items-start gap-4">
            <div className="flex flex-col w-full md:w-auto md:flex-row gap-3">
              <Link to="/gateway" className="w-full md:w-auto text-center rounded-full bg-white px-8 py-4 text-base font-medium text-[#060814] hover:bg-white/90 transition-colors shadow-lg">
                Run Candidate Demo
              </Link>
              <Link to="/demo" className="w-full md:w-auto text-center flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-medium text-white hover:bg-white/10 transition-colors">
                Watch 2-min Demo
              </Link>
            </div>
          </div>
          
          <div className="mt-12 flex flex-wrap items-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">GDPR-aligned</div>
            <div className="w-1 h-1 rounded-full bg-white/30 hidden md:block"></div>
            <div className="flex items-center gap-2">SOC 2 controls</div>
            <div className="w-1 h-1 rounded-full bg-white/30 hidden md:block"></div>
            <div className="flex items-center gap-2">EEOC-aware scoring</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />
          
          <div className="relative z-10 flex flex-col items-center gap-6 py-8">
            <div className="text-[var(--color-secondary)]">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="4"/>
                <path d="M38 62L54 78L84 46" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">Fairness & Integrity</h3>
              <p className="mt-3 text-sm leading-6 text-white/70 max-w-xs">
                Integrity checks that protect candidates and employers. Transparent, auditable decisions — not black-box scoring.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
