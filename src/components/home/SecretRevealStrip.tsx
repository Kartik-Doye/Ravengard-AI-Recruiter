import React from 'react';
import { motion } from 'motion/react';
import { PaperScrunchOverlay } from '../ui/PaperScrunchOverlay';

type SecretRevealCardProps = {
  title: string;
  subtitle: string;
  secretTitle: string;
  secretBody: string;
};

function SecretRevealCard({ title, subtitle, secretTitle, secretBody }: SecretRevealCardProps) {
  return (
    <motion.article
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020] p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
    >
      <motion.div
        className="absolute inset-0"
        variants={{
          rest: { opacity: 0.35, scale: 1 },
          hover: { opacity: 0.6, scale: 1.02, transition: { duration: 0.28 } },
        }}
      >
        <PaperScrunchOverlay />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_55%)]" />
      </motion.div>

      <div className="relative z-10 min-h-[280px] flex flex-col justify-between">
        <div>
          <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/60">
            Secret
          </span>
          <motion.h3
            variants={{
              rest: { y: 0 },
              hover: { y: -4, transition: { duration: 0.22 } },
            }}
            className="mt-4 text-2xl font-semibold tracking-tight"
          >
            {title}
          </motion.h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">{subtitle}</p>
        </div>

        <motion.div
          variants={{
            rest: { y: 18, opacity: 0, filter: "blur(8px)" },
            hover: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.32 } },
          }}
          className="secret-card-glow rounded-2xl border border-white/10 p-4 backdrop-blur-md"
        >
          <h4 className="text-sm uppercase tracking-[0.18em] text-white/70">{secretTitle}</h4>
          <p className="mt-2 text-sm leading-6 text-white/80">{secretBody}</p>
        </motion.div>
      </div>
    </motion.article>
  );
}

export function SecretRevealStrip() {
  return (
    <section className="px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Reveal</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Hidden layers, unlocked on hover.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <SecretRevealCard
            title="System flow"
            subtitle="Hover to reveal the state machine logic."
            secretTitle="What it does"
            secretBody="Guides the interview through registration, pre-flight, rounds, and assessment."
          />
          <SecretRevealCard
            title="Motion language"
            subtitle="Hover to uncover how depth is built."
            secretTitle="Motion stack"
            secretBody="Uses fade, blur, scale, and scroll-linked parallax to keep motion premium."
          />
          <SecretRevealCard
            title="Texture layer"
            subtitle="Hover for the surface treatment."
            secretTitle="Visual texture"
            secretBody="Paper scrunch overlays and blend modes give the UI an editorial feel."
          />
        </div>
      </div>
    </section>
  );
}
