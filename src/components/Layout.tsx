import { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  candidate?: any;
  session?: any;
  currentStageName?: string;
  onOpenCommandPalette?: () => void;
  onPauseSession?: () => void;
}

export default function Layout({ children, candidate, session, currentStageName, onOpenCommandPalette, onPauseSession }: LayoutProps) {
  const currentStage = session?.currentStage || currentStageName || 'welcome';
  const status = session?.status || 'none';

  const stages = ['registration', 'welcome', 'consent', 'resume', 'instructions', 'device_check', 'waiting_room', 'interview_hr_friendly', 'dashboard'];
  const currentIndex = stages.indexOf(currentStage);
  const progressPercentage = Math.max(0, Math.min(100, ((currentIndex + 1) / stages.length) * 100));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white shrink-0">
        <div className="h-1 bg-slate-800 w-full relative">
          <div className="h-full bg-blue-500 transition-all duration-500 ease-in-out absolute left-0 top-0" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-black text-xl leading-none">T</div>
          <span className="text-xl font-bold tracking-tight">TRAINEER</span>
        </div>

        <div className="flex items-center gap-4 text-sm hidden sm:flex">
          <div className="bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'in_progress' || status === 'created' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
            SESSION: {status.replace('_', ' ').toUpperCase()}
          </div>
          {session?.locked && status === 'in_progress' && (
            <div className="bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700 flex items-center gap-2">
               <span className="text-red-500 font-bold flex items-center gap-1 text-xs">🔒 LOCKED</span>
            </div>
          )}
          {session?.locked && status === 'in_progress' && currentStageName !== 'dashboard' && onPauseSession && (
             <button onClick={onPauseSession} className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300 border border-slate-700 font-medium transition-colors">
               Pause Session
             </button>
          )}
          <div className="bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
            ID: {session?.id ? `TRN-2024-${session.id}` : 'N/A'}
          </div>
          <a href={`mailto:support@traineer.com?subject=Support Request for Session ${session?.id ? `TRN-2024-${session.id}` : 'N/A'}&body=Please describe your issue:`} className="text-slate-300 hover:text-white ml-2 font-medium flex items-center gap-1">
            <HelpCircle className="w-4 h-4" /> Support
          </a>
          <button onClick={onOpenCommandPalette} className="text-slate-300 hover:text-white ml-2 font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            Search (Cmd+K)
          </button>
          <button onClick={() => { localStorage.removeItem('traineer_uid'); window.location.reload(); }} className="text-slate-300 hover:text-white ml-2 font-medium">Sign Out</button>
        </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[260px] bg-white border-r border-slate-200 p-6 flex flex-col gap-8 hidden md:flex shrink-0">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-4 font-semibold">Assessment Path</h3>
            <nav className="flex flex-col gap-2">
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
          <div className="mt-auto pt-5 border-t border-slate-200">
            <p className="text-xs text-slate-500 leading-relaxed">
              Candidate: <br/>
              <strong className="text-slate-900 text-sm">{candidate?.name || 'Pending...'}</strong>
            </p>
          </div>
        </aside>
        
        <main className="flex-1 p-6 sm:p-10 overflow-auto bg-slate-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ label, active, completed }: { label: string, active: boolean, completed: boolean }) {
  let colorClass = "text-slate-500";
  let bgClass = "bg-transparent";
  if (active) {
    colorClass = "text-blue-600 font-medium";
    bgClass = "bg-slate-100";
  } else if (completed) {
    colorClass = "text-emerald-500 font-medium";
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${colorClass} ${bgClass}`}>
      <div className={`w-2 h-2 rounded-full ${active || completed ? 'bg-current' : 'bg-slate-300'}`}></div>
      {label}
    </div>
  );
}
