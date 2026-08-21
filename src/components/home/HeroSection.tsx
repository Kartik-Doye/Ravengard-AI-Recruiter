import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';
import { Link } from 'react-router-dom';
import { AnimatedCharacter } from './AnimatedCharacter';

export function HeroSection() {
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, -28]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.22),transparent_55%)]" />
        <PaperScrunchOverlay />
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <motion.div style={{ y: fgY }} className="relative z-10">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">RavenGard</p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
            Layered motion, secret reveals, and premium depth.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 md:text-lg">
            A HorizonX-inspired portfolio experience with parallax depth, animated character guidance, and interactive reveal cards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/projects" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-[#060814]">
              View Projects
            </Link>
            <Link to="/contact" className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white">
              Contact
            </Link>
          </div>
        </motion.div>

        <AnimatedCharacter />
      </div>
    </section>
  );
}
