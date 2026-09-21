import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Code2, FileCheck, Layers, ArrowUpRight } from 'lucide-react';

const featureCards = [
  {
    title: "Collaborative Work Samples",
    tag: "Hands-on Evaluation",
    summary: "Interactive, real-world engineering scenarios that evaluate candidate architectural reasoning, system design, and clean code principles in real time.",
    href: "/features#engine",
    linkText: "Explore work samples",
    icon: <Code2 className="h-6 w-6 text-sky-400" />,
    iconBg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "1-Minute Executive Summaries",
    tag: "Deterministic Rubrics",
    summary: "Instant multi-axis rubric synthesis delivering concise AI-extracted scorecards detailing candidate competencies, key strengths, and actionable hiring evidence.",
    href: "/features#reporting",
    linkText: "View scorecard format",
    icon: <FileCheck className="h-6 w-6 text-emerald-400" />,
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Native ATS Pipeline Sync",
    tag: "Enterprise Ecosystem",
    summary: "Direct bi-directional sync with Greenhouse, Lever, and Workday. Seamlessly transition candidates, export PDF dossiers, and route evaluations to hiring managers.",
    href: "/admin/ats",
    linkText: "Explore ATS integration",
    icon: <Layers className="h-6 w-6 text-violet-400" />,
    iconBg: "bg-violet-500/10 border-violet-500/20",
  },
];

export function ProjectTeaserGrid() {
  return (
    <section className="px-6 py-20 md:px-10 z-10 relative bg-[var(--color-bg-0)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Recruiter Copilot Architecture</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl text-white">
            Built for modern engineering and talent teams.
          </h2>
          <p className="mt-3 text-sm text-white/60 max-w-2xl">
            Standardized technical assessments that save senior engineers hundreds of interview hours without sacrificing depth or candidate trust.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {featureCards.map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full flex flex-col justify-between rounded-[28px] border border-white/10 bg-slate-900/50 p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-slate-900/70"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${card.iconBg}`}>
                    {card.icon}
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono font-medium text-white/75">
                    {card.tag}
                  </span>
                </div>

                <h3 className="text-xl font-semibold tracking-tight text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/70">
                  {card.summary}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <Link
                  to={card.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-[var(--color-secondary)] transition-colors group"
                >
                  <span>{card.linkText}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
