import React from 'react';
import { motion } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';

export function ProjectsIntroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.18),transparent_55%)]" />
      <PaperScrunchOverlay />

      <div className="relative mx-auto max-w-7xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs uppercase tracking-[0.3em] text-white/50"
        >
          Projects
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.36, 1] }}
          className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl"
        >
          Case studies built with motion, structure, and depth.
        </motion.h1>
      </div>
    </section>
  );
}
