import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { NetworkStatusBanner } from "./NetworkStatusBanner.tsx";
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export default function RootLayout() {
  const location = useLocation();
  const currentOutlet = useOutlet();
  const isInterview = location.pathname.startsWith('/interview');

  // We hide the standard navbar/footer for the interview gateway so it remains an immersive, focused experience.
  if (isInterview) {
    return (
      <>
        <NetworkStatusBanner />
        <AnimatePresence mode="wait" initial={false}>
          {currentOutlet && (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex flex-col"
            >
              {currentOutlet}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <NetworkStatusBanner />
      <div className="min-h-screen bg-[var(--color-bg-0)] flex flex-col font-sans text-[#F3F4F6]">
        <SiteHeader />

        {/* Main Content with Smooth Page Transitions */}
        <main className="flex-1 pt-20 flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            {currentOutlet && (
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col w-full"
              >
                {currentOutlet}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
