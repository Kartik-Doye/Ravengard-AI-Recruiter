import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { RavengardSymbol } from "../ui/RavengardSymbol";

type NavLink = {
  label: string;
  href: string;
};

const links: NavLink[] = [
  { label: "Product", href: "/features" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const activePath = useMemo(() => location.pathname || "/", [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[var(--color-bg-0)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-semibold tracking-[0.2em] text-white flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <RavengardSymbol />
            </div>
            RAVENGARD
          </Link>
          
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors border-l border-white/10 pl-4 md:pl-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => {
              const isActive = activePath === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "text-white font-semibold underline underline-offset-8 decoration-white/40"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <Link
            to="/gateway"
            className="hidden md:inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90 transition-colors ml-4 shadow-sm"
          >
            Book a Demo
          </Link>
          
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden ml-4"
          >
            <span className="sr-only">Toggle menu</span>
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
              className="absolute h-[2px] w-5 bg-white rounded-full"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="absolute h-[2px] w-5 bg-white rounded-full"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
              className="absolute h-[2px] w-5 bg-white rounded-full"
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 top-20 z-40 bg-[var(--color-bg-0)]/95 backdrop-blur-2xl md:hidden overflow-hidden"
          >
            <motion.nav
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex h-full flex-col justify-start gap-4 p-6 pt-12"
            >
              {links.map((link, index) => {
                const isActive = activePath === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.22 }}
                  >
                    <Link
                      to={link.href}
                      className={`block rounded-2xl border px-5 py-4 text-xl font-medium transition ${
                        isActive
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
