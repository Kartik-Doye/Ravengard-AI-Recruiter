import { CheckCircle2, PlayCircle, FileCheck2, Lightbulb, Flag, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard({ candidate, session, resumeText, onResumeSession }: { candidate: any, session: any, resumeText?: string | null, onResumeSession: () => void }) {
  const isComplete = session?.currentStage === 'dashboard' || session?.status === 'completed';
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mb-8">Hello, {candidate.name}</p>

      {session && !isComplete && (
        <div className="bg-white p-8 rounded-xl border border-blue-200 shadow-sm mb-8 bg-blue-50/50">
          <div className="flex items-start gap-4">
            <PlayCircle className="w-8 h-8 text-blue-500 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Session In Progress</h3>
              <p className="text-slate-600 text-sm mb-4">
                You have an interview session in progress at the <strong className="uppercase">{session.currentStage.replace('_', ' ')}</strong> stage.
              </p>
              <button
                onClick={onResumeSession}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Assessment Completed</h3>
              <p className="text-slate-600 text-sm mb-4">
                Your interview has been successfully completed. Your performance report and learning roadmap are being generated.
              </p>
              
              {resumeText && (
                <div className="mb-6">
                  <button 
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2 transition-colors"
                  >
                    {showPreview ? 'Hide Resume Text' : 'View Extracted Resume Text'}
                  </button>
                  {showPreview && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">
                        {resumeText}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 flex items-start gap-3 opacity-75">
                  <FileCheck2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Final Report (PDF)</div>
                    <p className="text-xs text-slate-500 mt-1">Pending Generation...</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 flex items-start gap-3 opacity-75">
                  <Lightbulb className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Learning Roadmap</div>
                    <p className="text-xs text-slate-500 mt-1">Pending Generation...</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end gap-6 items-center">
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to request a retake? An admin will review your request.')) {
                      try {
                        const token = localStorage.getItem('traineer_uid');
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
                  className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Request Retake
                </button>
                <a href={`mailto:support@traineer.com?subject=Score Dispute - Session TRN-2024-${session?.id}&body=Candidate Note: `} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Flag this result
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!session && (
         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Active Session</h3>
                <p className="text-slate-600 text-sm mb-4">
                  You haven't started an interview session yet.
                </p>
                <button
                  onClick={onResumeSession}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
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
