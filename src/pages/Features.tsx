import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Shield, Search, BrainCircuit, Activity, FileJson, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DemoLink } from '../components/ui/DemoLink';

export default function Features() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 pt-36">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-20 text-center max-w-3xl mx-auto space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">The Platform</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-white leading-tight">
          System Architecture.
        </h1>
        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
          Ravengard is built on a foundation of uncompromised integrity, deterministic scoring rubrics, and dynamic conversational AI.
        </p>
      </motion.div>
      
      {/* Engine Section */}
      <section id="engine" className="mb-24 scroll-mt-32">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">AI Interview Engine</h2>
            <p className="text-white/70 leading-relaxed">
              A state-driven, conversational interview flow with locked session integrity. The engine dynamically adjusts its questioning based on real-time candidate responses, drilling down into technical gaps while maintaining a natural, conversational tone.
            </p>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Dynamic technical deep-dives</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Real-time context awareness</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Streaming Server-Sent Events (SSE)</li>
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl glass-panel p-8 md:p-12 aspect-square flex flex-col justify-center items-center shadow-2xl relative overflow-hidden border border-slate-800"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,147,255,0.1),transparent_70%)]" />
            <Cpu className="w-20 h-20 text-white/30 mb-8" />
            <div className="w-full max-w-sm space-y-4">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-white" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <div className="h-2 w-3/4 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-[var(--color-secondary)]" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="mb-24 scroll-mt-32">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl glass-panel p-8 md:p-12 aspect-square flex flex-col justify-center items-center shadow-2xl relative overflow-hidden order-2 md:order-1 border border-slate-800"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,100,0.06),transparent_70%)]" />
            <Activity className="w-20 h-20 text-white/30 mb-8" />
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-4 border border-white/10 rounded-2xl bg-white/5 text-center">
                <div className="text-3xl font-display font-semibold text-white">100%</div>
                <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Rubric Alignment</div>
              </div>
              <div className="p-4 border border-white/10 rounded-2xl bg-white/5 text-center">
                <div className="text-3xl font-display font-semibold text-emerald-400">Verified</div>
                <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Status</div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 md:order-2 space-y-6"
          >
            <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">Collaborative Insights</h2>
            <p className="text-white/70 leading-relaxed">
              Real-time competency assessment, technical reasoning breakdowns, and rubric alignment designed for technical hiring teams.
            </p>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Real-time competency evaluation</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Technical reasoning analysis</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Rubric-based performance alignment</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Reporting Section */}
      <section id="reporting" className="mb-24 scroll-mt-32">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <FileJson className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">Automated Reporting</h2>
            <p className="text-white/70 leading-relaxed">
              Comprehensive zero-shot extraction scorecards and detailed insights. Once a session ends, the entire transcript is evaluated against strict rubrics to generate structured JSON reports detailing technical, behavioral, and communication scores.
            </p>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Multi-axis competency scoring</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Strengths & Weaknesses extraction</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" /> Immutable post-interview records</li>
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl glass-panel p-8 md:p-12 aspect-square flex flex-col justify-center items-center shadow-2xl relative overflow-hidden border border-slate-800"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,255,147,0.06),transparent_70%)]" />
            <Search className="w-20 h-20 text-white/30 mb-8" />
            <div className="w-full max-w-sm p-4 bg-black/60 border border-white/10 rounded-2xl font-mono text-xs text-slate-300 shadow-inner">
              <pre>{`{
  "score": 92,
  "recommendation": "strong_hire",
  "technical": 95,
  "communication": 88
}`}</pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-24 flex flex-col sm:flex-row items-center justify-center gap-4"
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
