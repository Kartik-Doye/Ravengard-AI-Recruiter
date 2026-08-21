import React from 'react';
import { motion, useMotionValue, useMotionTemplate, useSpring } from 'motion/react';
import { Shield, Target, Zap } from 'lucide-react';

export function PrinciplesGrid() {
  const principles = [
    {
      title: "Objective Truth",
      body: "Every candidate is evaluated against a fixed rubric, ensuring that scores are based on merit, not mood or background.",
      icon: Target,
      highlight: "from-blue-500/20 to-blue-500/0"
    },
    {
      title: "Absolute Integrity",
      body: "O(1) telemetry tracking monitors hardware and tab context, guaranteeing the authenticity of every submission.",
      icon: Shield,
      highlight: "from-green-500/20 to-green-500/0"
    },
    {
      title: "Frictionless Speed",
      body: "From resume ingestion to final assessment, the entire pipeline is optimized for minimal latency and maximum clarity.",
      icon: Zap,
      highlight: "from-amber-500/20 to-amber-500/0"
    }
  ];

  return (
    <section className="py-40 px-6 bg-[var(--color-bg-0)] relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-8">
            The Engine
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-medium mb-6">Core Principles.</h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            The foundation of our engineering ethos. We build systems that are fair, transparent, and undeniably rigorous.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {principles.map((p, idx) => (
            <PrincipleCard key={idx} principle={p} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

const PrincipleCard: React.FC<{ principle: any; index: number }> = ({ principle, index }) => {
  // Setup mouse tracking for the localized glow effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] overflow-hidden transition-colors hover:border-white/10"
    >
      {/* Follow-mouse glow */}
      <motion.div
        className="absolute -inset-px rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      
      {/* Top color highlight gradient */}
      <div className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-b ${principle.highlight} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500 shadow-lg">
          <principle.icon className="w-7 h-7 text-white/80" />
        </div>
        <h3 className="text-2xl font-display font-medium mb-4">{principle.title}</h3>
        <p className="text-white/50 leading-relaxed text-base group-hover:text-white/70 transition-colors duration-300">
          {principle.body}
        </p>
      </div>
    </motion.div>
  );
}
