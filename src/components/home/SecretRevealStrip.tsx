import React from 'react';
import { motion } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';
import { FileText, Play, ShieldAlert, BarChart3 } from 'lucide-react';

type FeatureCardProps = {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
};

function FeatureCard({ title, subtitle, description, icon }: FeatureCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020] p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
    >
      <div className="absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-60">
        <PaperScrunchOverlay />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          {icon}
        </div>
        
        <div>
          <span className="inline-flex rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-3 py-1 text-xs uppercase tracking-[0.15em] text-[var(--color-secondary)]">
            {subtitle}
          </span>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            {title}
          </h3>
        </div>
        
        <div className="mt-4 flex-grow rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-sm leading-6 text-white/75">{description}</p>
        </div>
      </div>
    </article>
  );
}

export function SecretRevealStrip() {
  return (
    <section className="px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Enterprise-grade assessment infrastructure.
          </h2>
          <p className="mt-4 max-w-2xl text-white/60">
            A complete platform built to scale your hiring process securely and efficiently.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<FileText className="h-5 w-5 text-white/80" />}
            title="Resume Intelligence"
            subtitle="Analysis"
            description="Automated parsing and contextual alignment of candidate history against job requirements."
          />
          <FeatureCard
            icon={<Play className="h-5 w-5 text-white/80" />}
            title="Structured Engine"
            subtitle="Interviews"
            description="Dynamic, conversational video and text rounds that adapt to candidate responses while maintaining standardized rubrics."
          />
          <FeatureCard
            icon={<ShieldAlert className="h-5 w-5 text-white/80" />}
            title="Work Sample Authenticity"
            subtitle="Verification"
            description="Verified code execution and transparent work sample validation to ensure authentic candidate performance."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5 text-white/80" />}
            title="Scoring & Reporting"
            subtitle="Outcomes"
            description="Zero-shot extractions process answers to deliver accurate, multi-faceted scorecards without manual grading."
          />
        </div>
      </div>
    </section>
  );
}
