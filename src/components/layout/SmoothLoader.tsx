import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CubeLoader } from '../ui/CubeLoader';

export function SmoothLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Artificial delay for the branded loader experience (per spec: 900ms to 1600ms)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-bg-0)]"
        >
          {/* Subtle texture in the loader */}
          <div className="absolute inset-0 paper-scrunch-overlay pointer-events-none opacity-20" />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-12"
          >
            <CubeLoader />
            
            <div className="flex flex-col items-center gap-2 mt-4">
              <h2 className="font-display text-lg tracking-widest uppercase text-white/90">
                Ravengard
              </h2>
              <div className="w-24 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white/40"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
