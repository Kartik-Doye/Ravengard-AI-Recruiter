import React from "react";
import { motion } from "motion/react";

type FilterItem = {
  label: string;
  value: string;
  count?: number;
};

type ProjectFilterBarProps = {
  categories: FilterItem[];
  activeCategories: string[];
  onToggleCategory: (value: string) => void;
  onClearAll: () => void;
};

export function ProjectFilterBar({
  categories,
  activeCategories,
  onToggleCategory,
  onClearAll,
}: ProjectFilterBarProps) {
  const hasActive = activeCategories.length > 0;

  return (
    <section className="px-6 pb-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        {categories.map((category) => {
          const active = activeCategories.includes(category.value);

          return (
            <motion.button
              key={category.value}
              type="button"
              onClick={() => onToggleCategory(category.value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-white bg-white text-[#060814]"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{category.label}</span>
              {typeof category.count === "number" ? (
                <span className={`ml-2 ${active ? "text-[#060814]/70" : "text-white/45"}`}>
                  {category.count}
                </span>
              ) : null}
            </motion.button>
          );
        })}

        {hasActive ? (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  );
}
