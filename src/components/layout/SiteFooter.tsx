import React from "react";
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[var(--color-bg-0)] px-6 py-8 text-white/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm">© 2026 Ravengard AI. All rights reserved.</p>
        <div className="flex flex-wrap gap-6 text-sm font-medium">
          <Link to="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link to="/projects" className="hover:text-white transition-colors">
            Projects
          </Link>
          <Link to="/features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
