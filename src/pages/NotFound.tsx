import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="font-display text-[8rem] leading-none text-white/5 font-bold mb-4 tracking-tighter">
          404
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-white">Signal Lost</h1>
        <p className="text-white/60 mb-8">
          The requested coordinate does not exist in the current sector. Please return to the primary gateway.
        </p>
        <Link to="/">
          <Button variant="solid" className="px-8 py-3">
            Return to Gateway
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
