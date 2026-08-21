import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function ProjectsClosingCta() {
  return (
    <section className="px-6 py-24 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-4xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 text-center backdrop-blur-xl md:p-14"
      >
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Want the full story behind the build?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/70">
          Continue to the contact flow or open the gateway to start the experience.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/gateway" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-[#060814]">
            Start Session
          </Link>
          <Link to="/contact" className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white">
            Contact
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
