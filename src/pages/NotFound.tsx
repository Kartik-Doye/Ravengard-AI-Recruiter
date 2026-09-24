import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 pt-24 pb-16">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/60">
          <Compass className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
          <span>Error 404 · Unmapped Route</span>
        </div>

        <div className="font-display text-8xl md:text-9xl leading-none text-white/10 font-bold tracking-tighter select-none">
          404
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
            Signal Lost in Sector.
          </h1>
          <p className="text-base text-white/70 leading-relaxed max-w-md mx-auto">
            The coordinate you requested does not exist or has been relocated. Return to the primary gateway to resume your session.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-4">
          <Link 
            to="/" 
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-950 hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-950" />
            <span>Return to Home</span>
          </Link>
          <Link
            to="/gateway"
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
          >
            Candidate Portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
