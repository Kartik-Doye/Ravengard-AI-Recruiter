import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-red-500/90 text-white px-4 py-3 text-center flex justify-center items-center gap-3 backdrop-blur-md"
        >
          <WifiOff className="w-5 h-5" />
          <span className="font-medium text-sm">Network connection lost. Some features may be unavailable.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
