import { CheckCircle2, PlayCircle, FileCheck2, Lightbulb, Flag, ShieldAlert, Calendar, Clock, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/Skeleton';

export default function Dashboard({ 
  candidate, 
  session, 
  resumeText, 
  onResumeSession,
  onOpenSchedule
}: { 
  candidate: any; 
  session: any; 
  resumeText?: string | null; 
  onResumeSession: () => void;
  onOpenSchedule?: () => void;
}) {
  const isComplete = session?.currentStage === 'dashboard' || session?.status === 'completed';
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledSlot, setScheduledSlot] = useState<any | null>(null);

  useEffect(() => {
    if (!candidate?.id) return;
    const token = localStorage.getItem('ravengard_uid') || candidate?.id;
    fetch(`/api/candidate/scheduling/my-schedule?candidateId=${encodeURIComponent(candidate?.id)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.schedules) {
          const active = d.schedules.find((s: any) => s.status === 'confirmed' && new Date(s.scheduledAt) > new Date());
          setScheduledSlot(active || null);
        }
      })
      .catch(() => {});
  }, [candidate?.id]);

  return (
    <div className="max-w-[900px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-1 text-white">Command Center</h1>
          <p className="text-white/50 font-mono text-xs tracking-wider uppercase">CANDIDATE: {candidate.name}</p>
        </div>
        {onOpenSchedule && (
          <button
            onClick={onOpenSchedule}
            className="self-start sm:self-auto bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-mono uppercase tracking-wider px-4 py-2.5 rounded-lg border border-slate-700/80 hover:border-violet-500/50 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            {scheduledSlot ? 'Manage Scheduled Slot' : 'Calendar Scheduling'}
          </button>
        )}
      </div>

      {/* Calendar Scheduled Appointment Banner (if booked) */}
      {scheduledSlot && (
        <div className="glass-panel p-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Scheduled Assessment Confirmed
                </span>
                <p className="text-white text-sm font-medium mt-1 font-mono">
                  {new Date(scheduledSlot.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                  {new Date(scheduledSlot.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Track: <strong className="text-slate-200 capitalize">{scheduledSlot.roundType.replace('_', ' ')}</strong> (45 Mins) • Timezone: {scheduledSlot.timezone}
                </p>
              </div>
            </div>
            {onOpenSchedule && (
              <button
                onClick={onOpenSchedule}
                className="text-xs font-mono uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800/40 px-3.5 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                Change Slot
              </button>
            )}
          </div>
        </div>
      )}

      {/* Persistent Scheduling Promotion Card if not yet booked */}
      {!scheduledSlot && onOpenSchedule && (
        <div className="glass-panel p-6 rounded-xl border border-violet-500/20 bg-violet-950/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Interview Calendar Scheduling</h3>
              <p className="text-slate-400 text-xs mt-0.5 max-w-lg leading-relaxed">
                Need to plan ahead? Pick from verified 45-minute enterprise assessment windows to take your interview at a convenient time.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSchedule}
            className="text-xs font-mono uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Select Slot
          </button>
        </div>
      )}


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
