import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

export default function WaitingRoom({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [countdown, setCountdown] = useState(15);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTransitioned = useRef(false);

  useEffect(() => {
    // Start camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(mediaStream => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch(console.error);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !hasTransitioned.current) {
      hasTransitioned.current = true;
      handleStartInterview();
    }
  }, [countdown]);

  const handleStartInterview = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: 'interview_hr_friendly', version: session.version })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        onNext(updatedSession);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto flex flex-col items-center justify-center min-h-[70vh] relative">
      {/* Background glow for the video feed */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] aspect-video bg-[var(--color-primary)] rounded-full filter blur-[100px] opacity-10 pointer-events-none z-0"></div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-3xl font-light mb-3 text-white tracking-wide">Holding Area</h1>
        <p className="text-white/50 max-w-lg mx-auto font-light leading-relaxed">
          The Intelligence Node is preparing your scenario. Take a deep breath. 
          The assessment will begin automatically.
        </p>
      </div>

      <div className="w-full max-w-md bg-black/50 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8 z-10">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse shadow-[0_0_5px_var(--color-success)]"></div>
          <span className="text-[10px] text-white/80 tracking-widest uppercase font-mono">Live</span>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-white/5 shadow-xl text-center max-w-xs w-full relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] opacity-50"></div>
        <div className={`text-6xl font-light tracking-widest mb-3 font-mono transition-colors duration-500 ${countdown <= 5 ? 'text-[var(--color-warning)]' : 'text-white'}`}>
          {countdown > 0 ? (
            <span className="tabular-nums">00:{countdown.toString().padStart(2, '0')}</span>
          ) : (
            <span className="text-[var(--color-success)] text-3xl tracking-widest">INITIALIZING...</span>
          )}
        </div>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-medium font-mono">
          Until Assessment Commences
        </p>
      </div>
    </div>
  );
}
