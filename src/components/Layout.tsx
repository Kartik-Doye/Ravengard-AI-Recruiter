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
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-bg-0)] text-white font-sans selection:bg-[var(--color-primary)] selection:text-white">
      <header className="bg-[var(--color-bg-1)] shrink-0 relative z-20 border-b border-[var(--color-glass-highlight)]">
        <div className="h-1 w-full bg-[var(--color-bg-3)] relative">
          <div className="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-in-out absolute left-0 top-0 shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="h-16 flex items-center justify-between px-6 backdrop-blur-md bg-[var(--color-bg-1)]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Hexagon className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <span className="text-lg font-medium tracking-widest text-white/90">RAVENGARD</span>
            
            {(status === 'active' || status === 'created') && currentStageName !== 'dashboard' && onBackStep && (
              <div className="ml-4 pl-4 border-l border-white/10">
                <BackButton label="Step Back" onClick={onBackStep} />
              </div>
            )}
            {(status === 'active' || status === 'created') && currentStageName !== 'dashboard' && onPauseSession && (
              <div className="ml-2">
                <Button 
                  variant="ghost" 
                   
                  onClick={() => setShowExitModal(true)}
                  className="text-white/50 hover:text-white font-mono uppercase tracking-widest text-xs"
                >
                  Dashboard
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm hidden sm:flex">
            <div className="glass-panel px-4 py-1.5 rounded-full text-white/70 border border-white/5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${status === 'active' || status === 'created' ? 'bg-[var(--color-success)] text-[var(--color-success)]' : 'bg-white/40'}`}></div>
              <span className="tracking-widest text-xs font-medium">SESSION: {status.replace('_', ' ').toUpperCase()}</span>
            </div>
            {session?.locked && status === 'active' && (
              <div className="glass-panel px-3 py-1.5 rounded-full border border-[var(--color-error)]/30 flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                 <span className="text-[var(--color-error)] font-bold flex items-center gap-1 text-xs tracking-widest">🔒 LOCKED</span>
              </div>
            )}
            <div className="glass-panel px-4 py-1.5 rounded-full text-white/50 border border-white/5 text-xs tracking-widest font-mono">
              ID: {session?.id ? `TRN-24-${session.id.substring(0,8)}` : 'N/A'}
            </div>
            <a href={`mailto:support@ravengard.ai?subject=Support Request for Session ${session?.id ? `TRN-24-${session.id}` : 'N/A'}&body=Please describe your issue:`} className="text-white/60 hover:text-white ml-2 font-medium flex items-center gap-1 text-xs tracking-wider transition-colors">
              <HelpCircle className="w-4 h-4" /> SUPPORT
            </a>
            <button onClick={onOpenCommandPalette} className="text-white/60 hover:text-white ml-2 font-medium flex items-center gap-2 text-xs tracking-wider transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              CMD+K
            </button>
            <button onClick={() => { localStorage.removeItem('ravengard_uid'); window.location.reload(); }} className="text-[var(--color-error)]/80 hover:text-[var(--color-error)] ml-2 font-medium text-xs tracking-wider transition-colors">SIGN OUT</button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Deep ambient background elements */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[var(--color-bg-0)] to-[var(--color-bg-1)] pointer-events-none z-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[150px] opacity-5 animate-pulse pointer-events-none z-0"></div>
        
        <aside className="w-[280px] bg-[var(--color-bg-1)]/80 backdrop-blur-xl border-r border-[var(--color-glass-highlight)] p-8 flex flex-col gap-8 hidden md:flex shrink-0 relative z-10">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-6 font-semibold">Assessment Path</h3>
            <nav className="flex flex-col gap-1">
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
          <div className="mt-auto pt-6 border-t border-white/5">
            <p className="text-xs text-white/40 leading-relaxed font-mono uppercase tracking-wider mb-2">
              Candidate
            </p>
            <p className="text-white/90 text-sm font-medium tracking-wide">
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
  let colorClass = "text-white/40";
  let bgClass = "bg-transparent";
  let dotClass = "bg-white/20";
  
  if (active) {
    colorClass = "text-white font-medium";
    bgClass = "glass-panel bg-white/5";
    dotClass = "bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]";
  } else if (completed) {
    colorClass = "text-[var(--color-success)] font-medium";
    dotClass = "bg-[var(--color-success)]";
  }

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${colorClass} ${bgClass}`}>
      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${dotClass}`}></div>
      <span className="tracking-wide text-[13px]">{label}</span>
    </div>
  );
}
