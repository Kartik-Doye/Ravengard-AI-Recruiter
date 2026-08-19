import { CheckCircle2, PlayCircle, FileCheck2, Lightbulb, Flag, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from './ui/Skeleton';

export default function Dashboard({ candidate, session, resumeText, onResumeSession }: { candidate: any, session: any, resumeText?: string | null, onResumeSession: () => void }) {
  const isComplete = session?.currentStage === 'dashboard' || session?.status === 'completed';
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="max-w-[900px] mx-auto w-full">
      <h1 className="text-3xl font-semibold mb-2 text-white">Command Center</h1>
      <p className="text-white/50 mb-8 font-mono text-xs tracking-wider uppercase">CANDIDATE: {candidate.name}</p>

      {session && !isComplete && (
        <div className="glass-panel p-8 rounded-xl border border-[var(--color-primary)]/30 shadow-[0_0_30px_rgba(139,92,246,0.1)] mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]"></div>
          <div className="flex items-start gap-5">
            <PlayCircle className="w-8 h-8 text-[var(--color-primary)] shrink-0 animate-pulse" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white mb-1 tracking-wide">Session In Progress</h3>
              <p className="text-white/60 text-sm mb-6 font-light">
                You have an interview session currently paused at the <strong className="uppercase text-[var(--color-primary)] font-medium tracking-wider">{session.currentStage.replace('_', ' ')}</strong> stage.
              </p>
              <button
                onClick={onResumeSession}
                className="bg-[var(--color-primary)] hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] tracking-wider uppercase"
              >
                Resume Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-xl border border-[var(--color-success)]/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-success)]"></div>
            <div className="flex items-start gap-5">
              <CheckCircle2 className="w-8 h-8 text-[var(--color-success)] shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2 tracking-wide">Assessment Completed</h3>
                <p className="text-white/60 text-sm mb-0 font-light">
                  Your interview has been successfully processed. The Intelligence Node is finalizing your performance report and learning roadmap.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div>
                <FileCheck2 className="w-6 h-6 text-white/50 mb-4" />
                <h4 className="text-white font-medium mb-1 tracking-wide">Final Report</h4>
                <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Status: Processing</p>
              </div>
              <div className="mt-6 w-full">
                 <Skeleton variant="text" width="66%" height={4} />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div>
                <Lightbulb className="w-6 h-6 text-[var(--color-secondary)]/50 mb-4" />
                <h4 className="text-white font-medium mb-1 tracking-wide">Learning Roadmap</h4>
                <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Status: Compiling</p>
              </div>
               <div className="mt-6 w-full">
                 <Skeleton variant="text" width="50%" height={4} />
              </div>
            </div>
          </div>

          {resumeText && (
            <div className="glass-panel border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium tracking-wide">Extracted Profile Data</h4>
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs font-mono tracking-widest text-[var(--color-primary)] hover:text-white transition-colors uppercase"
                >
                  {showPreview ? 'Hide Data' : 'View Raw'}
                </button>
              </div>
              
              {showPreview && (
                <div className="bg-black/50 border border-white/5 rounded-lg p-4 max-h-60 overflow-y-auto mt-4 custom-scrollbar">
                  <pre className="text-xs text-white/50 whitespace-pre-wrap font-mono leading-relaxed">
                    {resumeText}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-6 border-t border-white/10 flex justify-end gap-6 items-center">
            <button 
              onClick={async () => {
                if (confirm('Are you sure you want to request a retake? This action requires administrator approval.')) {
                  try {
                    const token = localStorage.getItem('ravengard_uid');
                    const res = await fetch(`/api/session/${session.id}/request-retake`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) alert('Retake request submitted.');
                    else alert('Failed to submit retake request.');
                  } catch (e) {
                    alert('Error submitting request.');
                  }
                }
              }}
              className="text-xs font-mono uppercase tracking-wider text-white/40 hover:text-white transition-colors"
            >
              Request Retake
            </button>
            <a href={`mailto:support@ravengard.ai?subject=Review Request - Session TRN-24-${session?.id}&body=Candidate Note: `} className="text-xs font-mono uppercase tracking-wider text-[var(--color-warning)]/70 hover:text-[var(--color-warning)] transition-colors flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Flag Review
            </a>
          </div>
        </div>
      )}
      
      {!session && (
         <div className="glass-panel p-8 rounded-xl border border-white/5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2 tracking-wide">Awaiting Assignment</h3>
                <p className="text-white/50 text-sm mb-6 font-light">
                  You do not have an active interview session.
                </p>
                <button
                  onClick={onResumeSession}
                  className="bg-white text-black px-6 py-2.5 rounded-lg font-medium text-sm transition-all hover:bg-gray-200 tracking-wider uppercase shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Start New Session
                </button>
              </div>
            </div>
         </div>
      )}
    </div>
  );
}
