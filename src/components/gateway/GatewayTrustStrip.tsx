import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, EyeOff, Activity, Cpu, Zap } from 'lucide-react';

export function GatewayTrustStrip() {
  const trusts = [
    { icon: Shield, title: "Objective Rubric" },
    { icon: Lock, title: "Zero Cheating" },
    { icon: EyeOff, title: "Bias-Free" },
    { icon: Activity, title: "Real-time Metrics" },
    { icon: Cpu, title: "O(1) Telemetry" },
    { icon: Zap, title: "Instant Feedback" }
  ];

  // Duplicate for infinite scroll
  const marqueeItems = [...trusts, ...trusts, ...trusts];

  return (
    <section className="py-16 border-t border-white/5 bg-[var(--color-bg-1)] overflow-hidden flex flex-col items-center">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-2">Engine Architecture</span>
        <h2 className="text-xl font-display text-white/90">Built for precision and integrity.</h2>
      </div>

      <div className="relative w-full max-w-[100vw] overflow-hidden flex items-center">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--color-bg-1)] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--color-bg-1)] to-transparent z-10" />

        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20
          }}
        >
          {marqueeItems.map((item, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-4 px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shrink-0"
            >
              <item.icon className="w-5 h-5 text-white/70" />
              <span className="text-sm font-medium text-white/90">{item.title}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
