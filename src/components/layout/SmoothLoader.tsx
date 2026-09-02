import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CubeLoader } from '../ui/CubeLoader';

export function SmoothLoader({ 
  duration = 1200,
  isLoading: externalIsLoading,
  messages = ["Loading...", "Please wait..."]
}: { 
  duration?: number;
  isLoading?: boolean;
  messages?: string[];
}) {
  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const activeLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

  useEffect(() => {
    if (externalIsLoading !== undefined) return;
    const timer = setTimeout(() => {
      setInternalIsLoading(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, externalIsLoading]);

  // Cycle through messages if activeLoading is true
  useEffect(() => {
    if (!activeLoading || !messages || messages.length <= 1) return;
    
    // Divide duration (or default 2500ms if controlled externally) to cycle messages
    const cycleTime = externalIsLoading ? 2500 : Math.max(500, duration / messages.length);
    
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, cycleTime);
    
    return () => clearInterval(interval);
  }, [activeLoading, messages, duration, externalIsLoading]);

  const currentMessage = messages?.[messageIndex] || "Loading...";

  return (
    <AnimatePresence>
      {activeLoading && (
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
            
            <div className="flex flex-col items-center gap-4 mt-4">
              <h2 className="font-display text-lg tracking-widest uppercase text-white/90">
                Ravengard
              </h2>
              
              <div className="h-6 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-white/50 text-sm font-light tracking-wide text-center"
                  >
                    {currentMessage}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="w-24 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white/40"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: externalIsLoading ? 2 : duration / 1000, 
                    ease: "easeInOut",
                    repeat: externalIsLoading ? Infinity : 0
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
