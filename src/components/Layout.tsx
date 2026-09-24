import { ReactNode, useState } from 'react';
import { HelpCircle, Hexagon, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { transitions, variants } from '../theme/motion';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { BackButton } from './ui/BackButton';

interface LayoutProps {
  children: ReactNode;
  candidate?: any;
  session?: any;
  currentStageName?: string;
  onOpenCommandPalette?: () => void;
  onPauseSession?: () => void;
  onBackStep?: () => void;
}

export default function Layout({ children, candidate, session, currentStageName, onOpenCommandPalette, onPauseSession, onBackStep }: LayoutProps) {
  const currentStage = session?.currentStage || currentStageName || 'welcome';
  const status = session?.status || 'none';
  
  const [showExitModal, setShowExitModal] = useState(false);

  const stages = ['registration', 'welcome', 'consent', 'resume', 'instructions', 'device_check', 'waiting_room', 'interview_hr_friendly', 'dashboard'];
  const currentIndex = stages.indexOf(currentStage);
  const progressPercentage = Math.max(0, Math.min(100, ((currentIndex + 1) / stages.length) * 100));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-50 font-sans selection:bg-white/20 selection:text-white">
      <header className="bg-slate-900/60 shrink-0 relative z-20 border-b border-slate-800">
        <div className="h-1 w-full bg-slate-800/80 relative">
          <div className="h-full bg-white transition-all duration-1000 ease-in-out absolute left-0 top-0 shadow-[0_0_12px_rgba(255,255,255,0.7)]" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="h-16 flex items-center justify-between px-6 backdrop-blur-xl bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/15 shadow-sm">
              <Hexagon className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-wider text-slate-100">RAVENGARD</span>
            
            {(status === 'active' || status === 'created') && currentStageName !== 'dashboard' && onBackStep && (
              <div className="ml-4 pl-4 border-l border-slate-800">
                <BackButton label="Step Back" onClick={onBackStep} />
              </div>
            )}
            {(status === 'active' || status === 'created') && currentStageName !== 'dashboard' && onPauseSession && (
              <div className="ml-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowExitModal(true)}
                  className="text-slate-400 hover:text-white font-mono uppercase tracking-widest text-xs py-1.5 px-3"
                >
                  Dashboard
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm hidden sm:flex">
            <div className="rounded-full px-3.5 py-1 text-slate-300 border border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'active' || status === 'created' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-500'}`}></div>
              <span className="tracking-wider text-xs font-mono font-medium">SESSION: {status.replace('_', ' ').toUpperCase()}</span>
            </div>
            {session?.locked && status === 'active' && (
              <div className="rounded-full px-3 py-1 border border-rose-500/30 bg-rose-500/10 flex items-center gap-1.5">
                 <span className="text-rose-400 font-semibold flex items-center gap-1 text-xs tracking-wider font-mono">🔒 LOCKED</span>
              </div>
            )}
            <div className="rounded-full px-3.5 py-1 text-slate-400 border border-slate-800 bg-slate-900/50 text-xs tracking-wider font-mono">
              ID: {session?.id ? `TRN-24-${session.id.substring(0,8)}` : 'N/A'}
            </div>
            <a href={`mailto:support@ravengard.ai?subject=Support Request for Session ${session?.id ? `TRN-24-${session.id}` : 'N/A'}&body=Please describe your issue:`} className="text-slate-400 hover:text-white ml-2 font-medium flex items-center gap-1 text-xs tracking-wider transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> SUPPORT
            </a>
            <button onClick={onOpenCommandPalette} className="text-slate-400 hover:text-white ml-2 font-medium flex items-center gap-1 text-xs tracking-wider transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              CMD+K
            </button>
            <button onClick={() => { localStorage.removeItem('ravengard_uid'); window.location.reload(); }} className="text-rose-400 hover:text-rose-300 ml-2 font-medium text-xs tracking-wider transition-colors cursor-pointer">SIGN OUT</button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Subtle ambient lighting matching homepage */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.08),transparent_60%)] pointer-events-none z-0"></div>
        
        <aside className="w-[280px] bg-slate-900/40 backdrop-blur-xl border-r border-slate-800 p-8 flex flex-col gap-8 hidden md:flex shrink-0 relative z-10">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-6 font-semibold">Assessment Path</h3>
            <nav className="flex flex-col gap-1.5">
              <NavItem label="Registration" active={currentStage === 'registration'} completed={!!candidate} />
              <NavItem label="Welcome" active={currentStage === 'welcome'} completed={currentIndex > stages.indexOf('welcome')} />
              <NavItem label="Consent & Privacy" active={currentStage === 'consent'} completed={currentIndex > stages.indexOf('consent')} />
              <NavItem label="Resume Analysis" active={currentStage === 'resume'} completed={currentIndex > stages.indexOf('resume')} />
              <NavItem label="Instructions" active={currentStage === 'instructions'} completed={currentIndex > stages.indexOf('instructions')} />
              <NavItem label="Device Check" active={currentStage === 'device_check'} completed={currentIndex > stages.indexOf('device_check')} />
              <NavItem label="Waiting Room" active={currentStage === 'waiting_room'} completed={currentIndex > stages.indexOf('waiting_room')} />
              <NavItem label="Interview" active={currentStage.startsWith('interview_')} completed={currentIndex > stages.indexOf('interview_hr_friendly')} />
              <NavItem label="Dashboard" active={currentStage === 'dashboard'} completed={false} />
            </nav>
          </div>
          <div className="mt-auto pt-6 border-t border-slate-800/80">
            <p className="text-xs text-slate-400 leading-relaxed font-mono uppercase tracking-wider mb-1">
              Candidate
            </p>
            <p className="text-slate-100 text-sm font-medium tracking-wide">
              {candidate?.name || 'Pending...'}
            </p>
          </div>
        </aside>
        
        <main className="flex-1 p-6 sm:p-10 overflow-auto relative z-10 scrollbar-hide">
          <motion.div
            variants={variants.smoothFadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.smoothFade}
            className="h-full flex flex-col"
            key={currentStageName}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Pause Interview?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExitModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowExitModal(false);
                if (onPauseSession) onPauseSession();
              }}
            >
              Pause & Return to Dashboard
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to pause your active assessment? Your progress is saved, but you will leave the current interactive flow. You can resume from the dashboard at any time.
        </p>
      </Modal>
    </div>
  );
}

function NavItem({ label, active, completed }: { label: string, active: boolean, completed: boolean }) {
  let colorClass = "text-slate-400 hover:text-slate-200 hover:bg-white/5";
  let bgClass = "bg-transparent";
  let dotClass = "bg-slate-600";
  
  if (active) {
    colorClass = "text-slate-100 font-semibold";
    bgClass = "bg-white/10 border border-white/10 shadow-sm";
    dotClass = "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]";
  } else if (completed) {
    colorClass = "text-emerald-400 font-medium";
    dotClass = "bg-emerald-400";
  }

  return (
    <div className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${colorClass} ${bgClass}`}>
      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${dotClass}`}></div>
      <span className="tracking-wide text-xs">{label}</span>
    </div>
  );
}
