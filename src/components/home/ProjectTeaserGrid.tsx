import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const projects = [
  {
    title: "Ravengard Engine",
    summary: "State-driven interview flow with locked transitions.",
    href: "/projects/ravengard",
  },
  {
    title: "Motion UI Shell",
    summary: "Layered hero, reveal cards, and parallax depth.",
    href: "/projects/motion-ui-shell",
  },
  {
    title: "Gateway Experience",
    summary: "Clean entry page with smooth loading and action focus.",
    href: "/projects/gateway-experience",
  },
];

export function ProjectTeaserGrid() {
  return (
    <section className="px-6 py-20 md:px-10 z-10 relative bg-[var(--color-bg-0)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Selected work</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
             Preview the case studies.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <motion.div
              key={project.href}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <h3 className="text-xl font-semibold tracking-tight">{project.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/65">{project.summary}</p>
              <Link
                to={project.href}
                className="mt-6 inline-flex text-sm font-medium text-white underline underline-offset-4"
              >
                Open case study
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
