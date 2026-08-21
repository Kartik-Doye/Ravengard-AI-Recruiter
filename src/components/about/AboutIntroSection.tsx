import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function AboutIntroSection() {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const midY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden pt-32 pb-20 border-b border-white/5">
      {/* Deep Background Layer */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 bg-[var(--color-bg-0)]"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-white/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />
      </motion.div>
      
      {/* Texture Layer */}
      <motion.div 
        style={{ y: midY }}
        className="absolute inset-0 paper-scrunch-overlay pointer-events-none opacity-40 mix-blend-overlay"
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 w-full">
        <motion.div
          style={{ y: contentY, opacity }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            The Story
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-display font-medium leading-[1.05] tracking-tight mb-8">
            Built for signal. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/50 to-white/10 italic font-serif mt-2 block">Designed for speed.</span>
          </h1>
          
          <p className="text-xl text-white/60 leading-relaxed max-w-2xl mx-auto backdrop-blur-sm p-4 rounded-2xl">
            Ravengard was built to remove the noise from technical interviews. By combining rigorous, state-machine driven evaluation with non-intrusive anti-cheat telemetry, we ensure fairness, speed, and depth in every assessment.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
