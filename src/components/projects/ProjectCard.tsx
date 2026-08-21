import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

type ProjectCardProps = {
  title: string;
  summary: string;
  slug: string;
  year?: string;
  category?: string;
};

export function ProjectCard({ title, summary, slug, year, category }: ProjectCardProps) {
  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <p className="text-xs uppercase tracking-[0.25em] text-white/45">
        {category} {year ? `· ${year}` : ""}
      </p>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/65">{summary}</p>
      <Link to={`/projects/${slug}`} className="mt-6 inline-flex text-sm font-medium text-white underline underline-offset-4">
        Open case study
      </Link>
    </motion.article>
  );
}
