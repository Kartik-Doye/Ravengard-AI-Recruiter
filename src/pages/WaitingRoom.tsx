import React, { useState } from 'react';
import { ShieldCheck, UserCheck, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function WaitingRoom({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const isDeviceReady = session?.deviceCheckStatus === 'passed';

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
    <div className="max-w-[700px] mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-3 text-white tracking-wide">Waiting Room</h1>
        <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
          {isDeviceReady ? "Your device has been verified" : "Warning: Device verification incomplete."} and your profile is loaded. You are now in the secure holding area.
        </p>
      </div>

      <Card className="p-10 bg-white/5 border-white/10 relative overflow-hidden">
        {/* Subtle professional pulse animation for the ready state */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className={`w-64 h-64 rounded-full bg-white blur-3xl ${confirmed ? 'animate-pulse' : 'animate-subtle-pulse'}`}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
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
            {confirmed ? "Readiness Confirmed" : "Are you ready to begin?"}
          </h2>
          
          <p className="text-white/50 text-sm mb-8 text-center max-w-sm">
            {confirmed 
              ? "The AI Interviewer is initializing your session. You will be pulled in momentarily." 
              : "The interview will start as soon as you confirm. Please ensure you are in a quiet environment."}
          </p>

          <div className="flex flex-col gap-4 w-full sm:w-auto min-w-[200px]">
            <Button
              onClick={handleConfirmReady}
              disabled={loading || confirmed || !isDeviceReady}
              className={`w-full ${confirmed ? 'bg-green-500 hover:bg-green-600 text-white border-transparent' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Confirming...</span>
              ) : confirmed ? (
                "Verified"
              ) : (
                "I'm Ready"
              )}
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 pt-6 border-t border-white/10 w-full text-white/30 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-400/50" /> Secure Connection
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400/50"></span> Environment Verified
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
