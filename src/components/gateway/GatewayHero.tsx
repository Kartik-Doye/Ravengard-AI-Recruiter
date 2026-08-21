import React from 'react';
import { motion } from 'motion/react';
import { gatewayContent } from '../../content/gateway';

export function GatewayHero() {
  return (
    <section className="relative pt-32 pb-12 px-6 lg:pt-48 overflow-hidden text-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full max-h-[300px] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 mb-8">
            Evaluation Gateway
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-medium leading-[1.1] tracking-tight mb-6">
            {gatewayContent.hero.title}
          </h1>
          <p className="text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
            {gatewayContent.hero.body}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
