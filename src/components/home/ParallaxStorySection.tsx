import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';

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
    <section ref={ref} className="relative overflow-hidden px-6 py-24 md:px-10">
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <PaperScrunchOverlay strong />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,147,255,0.18),transparent_50%)]" />
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <motion.div style={{ y: fgY }} className="md:col-span-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Story</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Scroll-driven narrative depth.
          </h2>
        </motion.div>

        <motion.div
          style={{ y: midY }}
          className="md:col-span-2 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        >
          <p className="max-w-3xl text-base leading-8 text-white/75 md:text-lg">
            This section uses layered motion to make the page feel cinematic.
            The background drifts slower than the content, which gives the
            layout depth without making it hard to read.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
