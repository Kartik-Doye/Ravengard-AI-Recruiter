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
  }, []);

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
      const token = localStorage.getItem('traineer_uid');
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
    <div className="max-w-[800px] mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-3 text-slate-900">Waiting Room</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          Your interviewer is getting ready. Take a deep breath. 
          The interview will begin automatically in a moment.
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border-4 border-slate-800 shadow-xl mb-6">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center max-w-md w-full">
        <div className="text-5xl font-light text-blue-600 mb-2">
          {countdown > 0 ? (
            <span className="tabular-nums">00:{countdown.toString().padStart(2, '0')}</span>
          ) : (
            <span className="text-emerald-500">Starting...</span>
          )}
        </div>
        <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
          Until Interview Begins
        </p>
      </div>
    </div>
  );
}
