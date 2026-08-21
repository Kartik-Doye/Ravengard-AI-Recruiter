import React from 'react';
import { motion } from 'motion/react';

export type SecretRevealCardProps = {
  title: string;
  subtitle: string;
  secretTitle: string;
  secretBody: string;
  badge?: string;
  imageSrc?: string;
};

export function SecretRevealCard({
  title,
  subtitle,
  secretTitle,
  secretBody,
  badge = "Secret",
  imageSrc,
}: SecretRevealCardProps) {
  return (
    <motion.article
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0B0E] p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: {},
        hover: {},
      }}
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]"
        variants={{
          rest: { opacity: 0.35, scale: 1 },
          hover: { opacity: 0.6, scale: 1.02, transition: { duration: 0.3 } },
        }}
      />

      <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between">
        <div>
          <span className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
            {badge}
          </span>

          <motion.h3
            className="text-2xl font-display font-medium tracking-tight"
            variants={{
              rest: { y: 0, opacity: 1 },
              hover: { y: -4, opacity: 1, transition: { duration: 0.25 } },
            }}
          >
            {title}
          </motion.h3>

          <motion.p
            className="mt-2 max-w-sm text-sm leading-6 text-white/60"
            variants={{
              rest: { opacity: 1 },
              hover: { opacity: 0.85, transition: { duration: 0.2 } },
            }}
          >
            {subtitle}
          </motion.p>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-1">
          <motion.div
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            variants={{
              rest: { y: 20, opacity: 0, filter: "blur(8px)", pointerEvents: "none" },
              hover: { y: 0, opacity: 1, filter: "blur(0px)", pointerEvents: "auto", transition: { duration: 0.32, ease: "easeOut" } },
            }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {secretTitle}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{secretBody}</p>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl border border-white/0"
        variants={{
          rest: { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)" },
          hover: { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" },
        }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 secret-card-glow mix-blend-overlay" />
    </motion.article>
  );
}
