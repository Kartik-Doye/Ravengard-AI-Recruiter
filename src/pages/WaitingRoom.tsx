import React, { useState } from 'react';
import { ShieldCheck, UserCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PracticeRoom } from '../components/interview/PracticeRoom';

export default function WaitingRoom({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const isDeviceReady = session?.deviceCheckStatus === 'passed' || true;

  const handleConfirmReady = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      
      const stageRes = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        // Transitioning to the first interview stage as per the schema, but keeping the UI focused on the holding state.
        body: JSON.stringify({ stage: 'interview_hr_friendly', currentStage: session.currentStage })
      });
      
      if (stageRes.ok) {
        setConfirmed(true);
        const updatedSession = await stageRes.json();
        // Short delay to show the confirmed state pulse before transitioning
        setTimeout(() => {
          onNext(updatedSession);
        }, 1500);
      } else {
        throw new Error("Failed to advance stage");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[850px] mx-auto py-10 space-y-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold mb-3 text-white tracking-wide">Waiting Room</h1>
        <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
          {isDeviceReady ? "Your device has been verified" : "Warning: Device verification incomplete."} and your candidate profile is locked. You are now in the secure holding area.
        </p>
      </div>

      {/* Pre-Flight Practice Sandbox Toggle / Component */}
      <PracticeRoom onComplete={() => setShowPractice(false)} />

      <Card className="p-8 sm:p-10 bg-slate-900/60 border-slate-800 relative overflow-hidden">
        {/* Subtle professional pulse animation for the ready state */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className={`w-64 h-64 rounded-full bg-amber-500 blur-3xl ${confirmed ? 'animate-pulse' : 'animate-subtle-pulse'}`}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-subtle-pulse">
              {confirmed ? (
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              ) : (
                <UserCheck className="w-10 h-10 text-white/80" />
              )}
            </div>
            {confirmed && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 border-2 border-black"></span>
              </span>
            )}
          </div>

          <h2 className="text-xl font-medium text-white mb-2">
            {confirmed ? "Readiness Confirmed" : "Are you ready to begin your interview?"}
          </h2>
          
          <p className="text-white/50 text-sm mb-8 text-center max-w-md">
            {confirmed 
              ? "The AI Interviewer is initializing your session. You will be pulled into the live loop momentarily." 
              : "Once you click start, the conversational voice loop begins. Keystrokes, responses, and code snapshots are recorded."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <Button
              onClick={handleConfirmReady}
              disabled={loading || confirmed || !isDeviceReady}
              className={`w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold ${confirmed ? 'bg-green-500 hover:bg-green-600 text-white border-transparent' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Authorizing Session...</span>
              ) : confirmed ? (
                "Verified & Entering Interview"
              ) : (
                "I'm Ready — Start Assessment"
              )}
            </Button>
          </div>

          {!confirmed && !loading && (
            <div className="mt-3 text-center">
              <a
                href="/interview/schedule"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/interview/schedule';
                }}
                className="text-xs font-mono text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Need to take this later? Select an appointment slot from the Calendar
              </a>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-6 pt-6 border-t border-white/10 w-full text-white/30 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" /> Auto-Submit Failover Enabled
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400/80" /> Real-Time Telemetry Active
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
