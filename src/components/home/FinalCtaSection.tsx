import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function FinalCtaSection() {
  return (
    <section className="px-6 py-24 md:px-10 z-10 relative bg-[var(--color-bg-0)]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-4xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 text-center backdrop-blur-xl md:p-14"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Next step</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
          Ready to experience the future of hiring?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/70">
          Start the interactive interview gateway or explore the platform's features to see
          the system in detail.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/gateway" className="rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#060814] hover:bg-white/90 transition-colors">
              Run candidate test drive
            </Link>
            <Link to="/demo" className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
              Watch 2-min demo
            </Link>
          </div>
          <p className="text-xs text-white/40 mt-2">2-minute interactive demo • No login required</p>
        </div>
      </motion.div>
    </section>
  );
}
