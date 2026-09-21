import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Shield, Search, BrainCircuit, Activity, FileJson } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Features() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-32 pt-40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-24 text-center max-w-3xl mx-auto"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-4">The Platform</p>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-8">System Architecture.</h1>
        <p className="text-lg text-white/70">
          Ravengard is built on a foundation of uncompromised integrity, collaborative insights, and dynamic conversational AI.
        </p>
      </motion.div>
      
      {/* Engine Section */}
      <section id="engine" className="mb-32 scroll-mt-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-6">
              <BrainCircuit className="w-6 h-6 text-white/80" />
            </div>
            <h2 className="text-3xl font-semibold mb-4">AI Interview Engine</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              A state-driven, conversational interview flow with locked session integrity. The engine dynamically adjusts its questioning based on real-time candidate responses, drilling down into technical gaps while maintaining a natural, conversational tone.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Dynamic technical deep-dives</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Real-time context awareness</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Streaming Server-Sent Events (SSE)</li>
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-white/10 bg-[#0b1020] p-8 aspect-square flex flex-col justify-center items-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,147,255,0.08),transparent_70%)]" />
            <Cpu className="w-24 h-24 text-white/20 mb-8" />
            <div className="w-full max-w-sm space-y-4">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-white/40" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <div className="h-2 w-3/4 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-white/30" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="mb-32 scroll-mt-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-white/10 bg-[#0b1020] p-8 aspect-square flex flex-col justify-center items-center shadow-2xl relative overflow-hidden order-2 md:order-1"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,100,0.05),transparent_70%)]" />
            <Activity className="w-24 h-24 text-white/20 mb-8" />
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-4 border border-white/5 rounded-xl bg-white/5 text-center">
                <div className="text-2xl font-display text-white">100%</div>
                <div className="text-xs text-white/40 uppercase mt-1">Rubric Alignment</div>
              </div>
              <div className="p-4 border border-white/5 rounded-xl bg-white/5 text-center">
                <div className="text-2xl font-display text-green-400">Verified</div>
                <div className="text-xs text-white/40 uppercase mt-1">Status</div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 md:order-2"
          >
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-white/80" />
            </div>
            <h2 className="text-3xl font-semibold mb-4">Collaborative Insights</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Real-time competency assessment, technical reasoning breakdowns, and rubric alignment.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Real-time competency evaluation</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Technical reasoning analysis</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Rubric-based performance alignment</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Reporting Section */}
      <section id="reporting" className="mb-32 scroll-mt-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-6">
              <FileJson className="w-6 h-6 text-white/80" />
            </div>
            <h2 className="text-3xl font-semibold mb-4">Automated Reporting</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Comprehensive zero-shot extraction scorecards and detailed insights. Once a session ends, the entire transcript is evaluated against strict rubrics to generate structured JSON reports detailing technical, behavioral, and communication scores.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Multi-axis competency scoring</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Strengths & Weaknesses extraction</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /> Immutable post-interview records</li>
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-white/10 bg-[#0b1020] p-8 aspect-square flex flex-col justify-center items-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,255,147,0.05),transparent_70%)]" />
            <Search className="w-24 h-24 text-white/20 mb-8" />
            <div className="w-full max-w-sm p-4 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white/50">
              {`{
  "score": 92,
  "recommendation": "strong_hire",
  "technical": 95,
  "communication": 88
}`}
            </div>
          </motion.div>
        </div>
      </section>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-32"
      >
        <Link to="/gateway" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#060814] hover:bg-white/90 transition-colors">
          Experience the Gateway
        </Link>
      </motion.div>
    </div>
  );
}
