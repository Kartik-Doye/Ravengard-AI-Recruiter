import { ArrowRight, Sparkles, Hexagon } from 'lucide-react';
import { motion } from 'motion/react';
import { transitions } from '../theme/motion';

export default function Landing({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-bg-0)] text-white font-sans selection:bg-[var(--color-primary)] selection:text-white relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-secondary)] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>

      <header className="h-20 flex items-center justify-between px-8 z-10 shrink-0 border-b border-white/[0.05] bg-[var(--color-bg-0)]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Hexagon className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <span className="text-xl font-medium tracking-widest text-white/90">RAVENGARD</span>
        </div>
        <button 
          onClick={onSignIn}
          className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2"
        >
          Sign In
        </button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smoothFade}
          className="max-w-[800px] w-full text-center relative flex flex-col items-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...transitions.smoothFade, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[var(--color-secondary)] text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="tracking-wide">Next-Gen Interview Intelligence</span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl font-bold mb-8 tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            Master your next <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">technical assessment.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/50 mb-12 leading-relaxed max-w-[600px] font-light">
            Experience realistic, adaptive AI interview personas. Upload your resume, match with industry-standard scenarios, and get actionable feedback.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignIn}
            className="relative inline-flex items-center gap-3 bg-white text-[var(--color-bg-0)] font-medium py-4 px-10 rounded-full transition-all shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] text-lg group overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Assessment 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent group-hover:translate-x-full duration-1000 -translate-x-full transition-transform ease-in-out"></div>
          </motion.button>
        </motion.div>

        {/* 3D-like structural ring element */}
        <motion.div
          initial={{ opacity: 0, rotateX: 60, scale: 0.8 }}
          animate={{ opacity: 0.15, rotateX: 60, scale: 1, rotateZ: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[var(--color-primary)] rounded-full pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        />
        <motion.div
          initial={{ opacity: 0, rotateX: 70, scale: 0.9 }}
          animate={{ opacity: 0.1, rotateX: 70, scale: 1.1, rotateZ: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-[var(--color-secondary)] rounded-full pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        />
      </main>
    </div>
  );
}
