import React from "react";
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[var(--color-bg-0)] px-6 py-8 text-white/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-white/40 font-mono">
          © 2026 Ravengard AI Recruiting Systems. Internal Governance & Compliance.
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <Link to="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link to="/features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <Link
            to="/admin"
            className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
