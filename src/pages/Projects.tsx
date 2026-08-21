import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectsIntroSection } from '../components/projects/ProjectsIntroSection';
import { ProjectFilterBar } from '../components/projects/ProjectFilterBar';
import { ProjectGrid, type ProjectItem } from '../components/projects/ProjectGrid';
import { ProjectsClosingCta } from '../components/projects/ProjectsClosingCta';

const categories = [
  { label: "All", value: "all", count: 3 },
  { label: "Product", value: "product", count: 1 },
  { label: "UI", value: "ui", count: 1 },
  { label: "Experience", value: "experience", count: 1 },
];

const projects: ProjectItem[] = [
  {
    title: "Ravengard",
    summary: "Premium interview engine with state-machine flow and anti-cheat logic.",
    slug: "ravengard",
    year: "2026",
    category: "Product",
    tags: ["product", "experience"],
    image: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2564&auto=format&fit=crop",
    accent: "linear-gradient(180deg, rgba(116,129,255,0.18), rgba(6,8,20,0.78))",
  },
  {
    title: "Motion Shell",
    summary: "Layered hero, reveal cards, and scroll-linked depth.",
    slug: "motion-shell",
    year: "2026",
    category: "UI",
    tags: ["ui"],
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2564&auto=format&fit=crop",
    accent: "linear-gradient(180deg, rgba(255,132,177,0.16), rgba(6,8,20,0.78))",
  },
  {
    title: "Gateway",
    summary: "A clean entry experience with smooth transitions and a single CTA.",
    slug: "gateway",
    year: "2026",
    category: "Experience",
    tags: ["experience"],
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    accent: "linear-gradient(180deg, rgba(119,255,203,0.14), rgba(6,8,20,0.78))",
  },
];

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategories = useMemo(() => {
    const raw = searchParams.get("category");
    if (!raw || raw === "all") return [];
    return raw.split(",").filter(Boolean);
  }, [searchParams]);

  const setCategories = (next: string[]) => {
    if (!next.length) {
      searchParams.delete("category");
    } else {
      searchParams.set("category", next.join(","));
    }
    setSearchParams(searchParams, { replace: true });
  };

  const toggleCategory = (value: string) => {
    if (value === "all") {
      setCategories([]);
      return;
    }

    const next = activeCategories.includes(value)
      ? activeCategories.filter((v) => v !== value)
      : [...activeCategories, value];

    setCategories(next);
  };

  const clearAll = () => setCategories([]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-0)]">
      <ProjectsIntroSection />
      <ProjectFilterBar
        categories={categories}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        onClearAll={clearAll}
      />
      <ProjectGrid projects={projects} activeCategories={activeCategories} />
      <ProjectsClosingCta />
    </div>
  );
}
