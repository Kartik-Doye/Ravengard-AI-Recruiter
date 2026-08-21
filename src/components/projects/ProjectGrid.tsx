import React from 'react';
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export type ProjectItem = {
  title: string;
  summary: string;
  slug: string;
  year?: string;
  category?: string;
  tags?: string[];
  image?: string;
  accent?: string;
};

type ProjectGridProps = {
  projects: ProjectItem[];
  activeCategories: string[];
};

export function ProjectGrid({ projects, activeCategories }: ProjectGridProps) {
  const filtered =
    activeCategories.length === 0
      ? projects
      : projects.filter((project) =>
          (project.tags ?? []).some((tag) => activeCategories.includes(tag))
        );

  return (
    <section className="px-6 py-4 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <motion.article
            key={project.slug}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl"
          >
            <div className="relative aspect-[16/11] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${project.image ?? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"})`,
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background:
                    project.accent ??
                    "linear-gradient(180deg, rgba(16,18,32,0.10), rgba(6,8,20,0.72))",
                }}
              />
            </div>

            <div className="p-6 relative z-10 -mt-8">
              <div className="bg-[#0A0B0E]/90 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
                <p className="text-xs uppercase tracking-[0.26em] text-white/45">
                  {project.category} {project.year ? `· ${project.year}` : ""}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  {project.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  {project.summary}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(project.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/projects/${project.slug}`}
                  className="mt-6 inline-flex text-sm font-medium text-white underline underline-offset-4"
                >
                  Open case study
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
