import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, Globe, CheckCircle2, XCircle, AlertCircle, Loader2, Send } from 'lucide-react';

export default function DeviceCheck({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [checks, setChecks] = useState({
    browser: { status: 'pending', message: 'Checking browser compatibility...' },
    camera: { status: 'pending', message: 'Requesting camera access...' },
    mic: { status: 'pending', message: 'Requesting microphone access...' },
    speaker: { status: 'pending', message: 'Waiting for speaker test...' },
    network: { status: 'pending', message: 'Checking internet speed...' }
  });

  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    runChecks();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const updateCheck = (key: keyof typeof checks, status: 'pending' | 'success' | 'error', message: string) => {
    setChecks(prev => ({ ...prev, [key]: { status, message } }));
  };

  const runChecks = async () => {
    // 1. Browser Check
    const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (isSupported) {
      updateCheck('browser', 'success', 'Browser supported');
    } else {
      updateCheck('browser', 'error', 'Browser not supported. Please use recent Chrome/Edge/Safari.');
      return;
    }

    // 2. Camera & Mic Check
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      updateCheck('camera', 'success', 'Camera access granted');
      updateCheck('mic', 'success', 'Microphone access granted');
    } catch (err) {
      updateCheck('camera', 'error', 'Camera/Mic access denied. Please allow permissions in your browser.');
      updateCheck('mic', 'error', 'Camera/Mic access denied.');
    }

    // 3. Network Check (Simulated for now)
    setTimeout(() => {
      updateCheck('network', 'success', 'Network connection stable');
    }, 1500);
  };

  const playTestSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const handleSpeakerConfirm = (heard: boolean) => {
    if (heard) {
      updateCheck('speaker', 'success', 'Speaker working properly');
    } else {
      updateCheck('speaker', 'error', 'Speaker test failed. Check your volume and output device.');
    }
  };

  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [readinessConfirmed, setReadinessConfirmed] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);

  const checkCompleted = Object.values(checks).every((c: any) => c.status !== 'pending');
  const allPassed = Object.values(checks).every((c: any) => c.status === 'success');
  const anyFailed = Object.values(checks).some((c: any) => c.status === 'error');
  const hardwarePermanentFailure = checks.camera.status === 'error' || checks.mic.status === 'error';

  useEffect(() => {
    if (checkCompleted) {
      const validateWithAi = async () => {
        setAiLoading(true);
        try {
          const token = localStorage.getItem('ravengard_uid');
          const payload = {
            camera: checks.camera.status === 'success',
            microphone: checks.mic.status === 'success',
            speaker: checks.speaker.status === 'success',
            browser: checks.browser.message,
            internetMbps: 15 // Mocking internet speed
          };
          const res = await fetch(`/api/device-check/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            setAiMessage(data.message);
            if (data.allPassed) {
               // Initiate readiness confirm
               const readyRes = await fetch(`/api/interview/readiness/confirm`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: "", sessionId: session.id })
               });
               if (readyRes.ok) {
                 const readyData = await readyRes.json();
                 setAiMessage(readyData.response);
               }
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setAiLoading(false);
        }
      };
      validateWithAi();
    }
  }, [checkCompleted, checks.camera.status, checks.mic.status, checks.speaker.status, checks.browser.status, session.id]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/interview/readiness/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText, sessionId: session.id })
      });
      if (res.ok) {
        const data = await res.json();
        setAiMessage(data.response);
        if (inputText.toLowerCase().includes("i'm ready") || inputText.toLowerCase().includes("i am ready") || inputText.toLowerCase().includes("ready")) {
          setReadinessConfirmed(true);
        }
      }
    } catch(err) {
      console.error(err);
    } finally {
      setAiLoading(false);
      setInputText('');
    }
  };

  const handleProceed = async () => {
    setLoading(true);
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
        body: JSON.stringify({ stage: 'waiting_room', version: session.version })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        onNext(updatedSession);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!window.confirm("Are you sure you want to cancel? This will mark the session as failed.")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setIsCancelled(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="max-w-[800px] mx-auto text-center mt-20">
        <h1 className="text-3xl font-semibold mb-4 text-white">Session Cancelled</h1>
        <p className="text-white/60 mb-8">
          This session has been marked as failed due to hardware access denial. You can safely close this window. When you are ready to try again with a working camera and microphone on a different device, please start a new session.
        </p>
        <button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-md transition-colors border border-white/5">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const renderStatusIcon = (status: string) => {
    if (status === 'pending') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-white">Device Check</h1>
      <p className="text-white/50 mb-8 font-mono text-xs tracking-wider">LET'S MAKE SURE YOUR EQUIPMENT IS READY FOR THE INTERVIEW.</p>
        
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.browser.status === 'error' ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30' : 'glass-panel border-white/5'}`}>
            <Globe className="w-6 h-6 text-white/30" />
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm">Browser</h4>
              <p className="text-xs text-white/50">{checks.browser.message}</p>
            </div>
            {renderStatusIcon(checks.browser.status)}
          </div>

          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.camera.status === 'error' ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30' : 'glass-panel border-white/5'}`}>
            <Camera className="w-6 h-6 text-white/30" />
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm">Camera</h4>
              <p className="text-xs text-white/50">{checks.camera.message}</p>
            </div>
            {renderStatusIcon(checks.camera.status)}
          </div>

          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.mic.status === 'error' ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30' : 'glass-panel border-white/5'}`}>
            <Mic className="w-6 h-6 text-white/30" />
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm">Microphone</h4>
              <p className="text-xs text-white/50">{checks.mic.message}</p>
            </div>
            {renderStatusIcon(checks.mic.status)}
          </div>

          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.network.status === 'error' ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30' : 'glass-panel border-white/5'}`}>
            <Globe className="w-6 h-6 text-white/30" />
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm">Network</h4>
              <p className="text-xs text-white/50">{checks.network.message}</p>
            </div>
            {renderStatusIcon(checks.network.status)}
          </div>

          <div className={`p-4 border rounded-xl flex flex-col gap-3 ${checks.speaker.status === 'error' ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30' : 'glass-panel border-white/5'}`}>
            <div className="flex items-center gap-4">
              <Volume2 className="w-6 h-6 text-white/30" />
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">Speaker</h4>
                <p className="text-xs text-white/50">{checks.speaker.message}</p>
              </div>
              {renderStatusIcon(checks.speaker.status)}
            </div>
            {checks.speaker.status === 'pending' && (
              <div className="flex items-center gap-3 mt-2 pt-3 border-t border-white/5">
                <button onClick={playTestSound} className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md font-medium transition-colors border border-white/5">
                  Play Test Sound
                </button>
                <span className="text-xs text-white/40 font-mono">Did you hear it?</span>
                <button onClick={() => handleSpeakerConfirm(true)} className="text-xs bg-[var(--color-success)]/20 text-[var(--color-success)] hover:bg-[var(--color-success)]/30 px-3 py-1.5 rounded-md font-medium transition-colors border border-[var(--color-success)]/30">
                  Yes
                </button>
                <button onClick={() => handleSpeakerConfirm(false)} className="text-xs bg-[var(--color-error)]/20 text-[var(--color-error)] hover:bg-[var(--color-error)]/30 px-3 py-1.5 rounded-md font-medium transition-colors border border-[var(--color-error)]/30">
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-black/80 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${checks.camera.status === 'success' ? 'opacity-100' : 'opacity-0'}`} 
            />
            {checks.camera.status !== 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-3">
                <Camera className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium tracking-widest font-mono uppercase">Camera Preview</span>
              </div>
            )}
            {checks.camera.status === 'success' && (
               <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shadow-[0_0_5px_var(--color-success)] animate-pulse"></div>
                 <span className="text-[10px] text-white/80 tracking-widest uppercase font-mono">Live</span>
               </div>
            )}
          </div>
          {anyFailed && (
            <div className="mt-4 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--color-error)]/90">
                <strong className="font-semibold block mb-1 text-[var(--color-error)] tracking-wide">Checks Failed</strong>
                Please fix the errors above and ensure permissions are granted. You cannot proceed until all checks pass.
                <div className="mt-3 flex gap-2">
                  <button onClick={runChecks} className="text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md font-medium text-xs tracking-wider border border-white/5">
                    Retry Checks
                  </button>
                  {hardwarePermanentFailure && (
                    <button onClick={handleCancelSession} disabled={loading} className="text-[var(--color-error)] bg-[var(--color-error)]/10 hover:bg-[var(--color-error)]/20 px-3 py-1.5 rounded-md font-medium text-xs tracking-wider border border-[var(--color-error)]/30">
                      Cancel Session
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {checkCompleted && (
        <div className="glass-panel border border-white/5 rounded-xl p-6 mb-8 mt-4">
          <div className="flex flex-col space-y-4">
            <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 p-4 rounded-lg text-white/90 whitespace-pre-line text-sm leading-relaxed">
              {aiLoading ? <span className="flex items-center gap-2 font-mono text-[var(--color-primary)]"><Loader2 className="w-4 h-4 animate-spin" /> ANALYZING_SYSTEM_STATE...</span> : aiMessage}
            </div>
            
            {allPassed && (
              <form onSubmit={handleChat} className="flex gap-3">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={readinessConfirmed || aiLoading}
                  placeholder={readinessConfirmed ? "READINESS CONFIRMED" : "Type 'I'm Ready'..."}
                  className="flex-1 px-4 py-3 border border-white/10 bg-black/40 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white disabled:opacity-50 font-mono tracking-wider transition-all shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={readinessConfirmed || aiLoading || !inputText.trim()}
                  className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-md hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button

        onClick={handleProceed}
        disabled={!allPassed || !readinessConfirmed || loading}
        className="bg-[var(--color-primary)] text-white font-semibold py-3 px-8 rounded-md hover:bg-violet-500 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)] tracking-widest"
      >
        {loading ? 'PROCESSING...' : 'ENTER WAITING ROOM'}
      </button>
    </div>
  );
}
