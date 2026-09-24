import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Shield, BrainCircuit, Activity, FileJson, Sparkles } from 'lucide-react';
import { DemoLink } from '../components/ui/DemoLink';

export default function AssessmentGuide() {
  const criteria = [
    {
      title: "Technical Architecture & Depth",
      weight: "40%",
      desc: "Distributed systems, concurrency, state management, caching paradigms, and API contracts.",
      details: [
        "Trade-off analysis between scalability, durability, and operational overhead",
        "Deterministic error boundary and failure recovery strategies",
        "Relational vs. NoSQL persistence architecture and data modeling"
      ]
    },
    {
      title: "Communication & Technical Articulation",
      weight: "35%",
      desc: "Clarity of thought, structural responses, reasoning under constraints, and transparent problem breakdown.",
      details: [
        "Structured problem-solving (First Principles & top-down decomposition)",
        "Precision in explaining trade-offs and edge cases",
        "Constructive response to counter-questions and clarifying prompts"
      ]
    },
    {
      title: "Integrity & Code Reliability",
      weight: "25%",
      desc: "Robustness of implementation, defensive validation, testability, and adherence to security constraints.",
      details: [
        "Deterministic input validation and schema validation",
        "Security-first mentality (zero trust, sanitized boundaries)",
        "Observable execution telemetry and auditable outputs"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 pt-36">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-20 text-center max-w-3xl mx-auto space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50 flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-secondary)]" /> Official Standards & Criteria
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-white leading-tight">
          Candidate Assessment Guide.
        </h1>
        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
          Every candidate is scored across normalized dimensions using deterministic rubrics. Discover how the RavenGard assessment engine evaluates engineering talent.
        </p>
      </motion.div>

      {/* Core Flow Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white">1. Asynchronous MCQ & Prescreen</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Timed skill-battery questions evaluating foundational engineering knowledge and domain patterns with instant cutoff validation.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white">2. Conversational Voice Loop</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Dynamic technical dialogue with the AI interviewer. Follow-up inquiries drill into architectural trade-offs in real time.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileJson className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white">3. Deterministic Rubric Report</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Full transcript extraction against strict rubrics, compiling comprehensive multi-axis evidence for review panels.
          </p>
        </div>
      </div>

      {/* Evaluation Rubrics Breakdown */}
      <section className="space-y-8 mb-24">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
            Scoring Dimensions & Weights
          </h2>
          <p className="text-sm md:text-base text-white/70">
            Our scoring engine weights competencies consistently across all candidates.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {criteria.map((item, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[var(--color-secondary)]">
                    Weight: {item.weight}
                  </span>
                </div>
                <h3 className="text-xl font-display font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <div className="text-xs uppercase tracking-wider font-semibold text-white/50">Key Indicators</div>
                {item.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-16 flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link 
          to="/gateway" 
          className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-sm flex items-center gap-2"
        >
          <span>Run Candidate Demo</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </Link>
        <DemoLink 
          className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
        >
          Book a Demo
        </DemoLink>
      </motion.div>
    </div>
  );
}
