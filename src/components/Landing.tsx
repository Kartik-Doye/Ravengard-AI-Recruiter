import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="h-16 bg-white flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-black text-white text-xl leading-none shadow-sm">T</div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TRAINEER</span>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-[700px] w-full text-center relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Assessment Engine</span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Master your next <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">technical interview</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-[600px] mx-auto">
            Experience realistic, adaptive AI interview personas. Upload your resume, match with industry-standard scenarios, and get actionable feedback.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignIn}
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold py-4 px-8 rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl text-lg group"
          >
            Start Assessment 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
}
