import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';
import { ShieldCheck, Scale, LockKeyhole } from 'lucide-react';

export function ParallaxStorySection() {
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, -18]);

  return (
    <section id="security" ref={ref} className="relative overflow-hidden px-6 py-24 md:px-10 scroll-mt-24">
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <PaperScrunchOverlay strong />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,147,255,0.18),transparent_50%)]" />
      </motion.div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-3 mb-12">
          <motion.div style={{ y: fgY }} className="md:col-span-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Compliance & Trust</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl text-white">
              Enterprise Security &amp; AI Governance.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Candidate-respectful assessment infrastructure engineered for rigorous global compliance, complete auditability, and zero invasive surveillance.
            </p>
          </motion.div>

          <motion.div
            style={{ y: midY }}
            className="md:col-span-2 rounded-[32px] border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl flex flex-col justify-center"
          >
            <p className="text-base leading-8 text-white/80 md:text-lg">
              Ravengard sets a new standard for hiring trust with standardized work samples, verified execution environments, and deterministic rubric scoring. Every assessment outcome is auditable, repeatable, and aligned with enterprise legal standards.
            </p>
          </motion.div>
        </div>

        {/* 3 Core Compliance Highlights */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Zero Biometric Retention
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                No camera, keystroke, or audio biometric data stored. Candidates engage through ethical, transparent work sample simulations without invasive monitoring.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="inline-flex items-center text-xs font-mono text-emerald-400/90 font-medium">
                Privacy-first architecture
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                EEOC &amp; NYC Local Law 144 Readiness
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Independent bias auditing and deterministic rubric evaluation prevent algorithmic drift and guarantee equitable assessment across candidate demographics.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="inline-flex items-center text-xs font-mono text-sky-400/90 font-medium">
                Auditable rubric scoring
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                GDPR &amp; CCPA Data Rights
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Automated 30/60/90-day candidate data purge options, full export portability, and self-serve candidate consent management compliant with EU and US frameworks.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="inline-flex items-center text-xs font-mono text-violet-400/90 font-medium">
                Configurable retention policies
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
