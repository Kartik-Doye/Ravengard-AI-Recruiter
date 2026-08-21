import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { RavengardEye } from "../ui/RavengardEye";

type AnimatedCharacterProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function AnimatedCharacter({
  title = "Guide",
  subtitle = "A small motion companion for the home hero.",
  className = "",
}: AnimatedCharacterProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springX = useSpring(mouseX, { stiffness: 120, damping: 18, mass: 0.45 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 18, mass: 0.45 });

  const glowX = useTransform(springX, [0, 1], [-14, 14]);
  const glowY = useTransform(springY, [0, 1], [-14, 14]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mouseX.set(Math.max(0, Math.min(1, x)));
    mouseY.set(Math.max(0, Math.min(1, y)));
  };

  const handlePointerLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1020] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          x: glowX,
          y: glowY,
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.18), transparent 55%)",
          opacity: 0.85,
        }}
      />

      <div className="relative z-10 flex items-center gap-5">
        <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-black/40 border border-white/5 shadow-inner">
          <RavengardEye />
        </div>

        <div className="pb-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            System Overseer
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
