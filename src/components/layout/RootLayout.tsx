import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight } from 'lucide-react';
import { SmoothLoader } from './SmoothLoader';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export default function RootLayout() {
  const location = useLocation();
  const isInterview = location.pathname.startsWith('/interview');

  // We hide the standard navbar/footer for the interview gateway so it remains an immersive, focused experience.
  if (isInterview) {
    return (
      <>
        <SmoothLoader />
        <Outlet />
      </>
    );
  }

  return (
    <>
      <SmoothLoader />
      <div className="min-h-screen bg-[var(--color-bg-0)] flex flex-col font-sans text-[#F3F4F6]">
        <SiteHeader />

        {/* Main Content with Page Transitions */}
        <main className="flex-1 pt-20 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
