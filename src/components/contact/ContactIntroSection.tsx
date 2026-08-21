import React from 'react';
import { motion } from 'motion/react';
import { contactContent } from '../../content/contact';

export function ContactIntroSection() {
  return (
    <section className="relative pt-32 pb-12 px-6 lg:pt-48 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 mb-8">
            {contactContent.intro.subtitle}
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-medium leading-[1.1] tracking-tight mb-6">
            {contactContent.intro.title}
          </h1>
          <p className="text-xl text-white/60 leading-relaxed">
            {contactContent.intro.body}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
