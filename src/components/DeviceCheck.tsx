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

  const checkCompleted = Object.values(checks).every((c: any) => c.status !== 'pending');
  const allPassed = Object.values(checks).every((c: any) => c.status === 'success');
  const anyFailed = Object.values(checks).some((c: any) => c.status === 'error');

  useEffect(() => {
    if (checkCompleted) {
      const validateWithAi = async () => {
        setAiLoading(true);
        try {
          const token = localStorage.getItem('traineer_uid');
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
      const token = localStorage.getItem('traineer_uid');
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
      const token = localStorage.getItem('traineer_uid');
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

  const renderStatusIcon = (status: string) => {
    if (status === 'pending') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Device Check</h1>
      <p className="text-slate-500 mb-8">Let's make sure your equipment is ready for the interview.</p>
        
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.browser.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <Globe className="w-6 h-6 text-slate-400" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 text-sm">Browser</h4>
              <p className="text-xs text-slate-500">{checks.browser.message}</p>
            </div>
            {renderStatusIcon(checks.browser.status)}
          </div>

          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.camera.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <Camera className="w-6 h-6 text-slate-400" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 text-sm">Camera</h4>
              <p className="text-xs text-slate-500">{checks.camera.message}</p>
            </div>
            {renderStatusIcon(checks.camera.status)}
          </div>

          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.mic.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <Mic className="w-6 h-6 text-slate-400" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 text-sm">Microphone</h4>
              <p className="text-xs text-slate-500">{checks.mic.message}</p>
            </div>
            {renderStatusIcon(checks.mic.status)}
          </div>

          <div className={`p-4 border rounded-xl flex items-center gap-4 ${checks.network.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <Globe className="w-6 h-6 text-slate-400" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 text-sm">Network</h4>
              <p className="text-xs text-slate-500">{checks.network.message}</p>
            </div>
            {renderStatusIcon(checks.network.status)}
          </div>

          <div className={`p-4 border rounded-xl flex flex-col gap-3 ${checks.speaker.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <Volume2 className="w-6 h-6 text-slate-400" />
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 text-sm">Speaker</h4>
                <p className="text-xs text-slate-500">{checks.speaker.message}</p>
              </div>
              {renderStatusIcon(checks.speaker.status)}
            </div>
            {checks.speaker.status === 'pending' && (
              <div className="flex items-center gap-3 mt-2 pt-3 border-t border-slate-100">
                <button onClick={playTestSound} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md font-medium transition-colors">
                  Play Test Sound
                </button>
                <span className="text-xs text-slate-500">Did you hear it?</span>
                <button onClick={() => handleSpeakerConfirm(true)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-md font-medium transition-colors">
                  Yes
                </button>
                <button onClick={() => handleSpeakerConfirm(false)} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-md font-medium transition-colors">
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-800 shadow-inner">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${checks.camera.status === 'success' ? 'opacity-100' : 'opacity-0'}`} 
            />
            {checks.camera.status !== 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Camera className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">Camera Preview</span>
              </div>
            )}
          </div>
          {anyFailed && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong className="font-semibold block mb-1">Checks Failed</strong>
                Please fix the errors above and ensure permissions are granted. You cannot proceed until all checks pass.
                <button onClick={runChecks} className="mt-2 block text-red-700 underline font-medium hover:text-red-900">
                  Run Checks Again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {checkCompleted && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 mt-4">
          <div className="flex flex-col space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-slate-800 whitespace-pre-line text-sm">
              {aiLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> AI Analyzing setup...</span> : aiMessage}
            </div>
            
            {allPassed && (
              <form onSubmit={handleChat} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={readinessConfirmed || aiLoading}
                  placeholder={readinessConfirmed ? "Ready to begin!" : "Type 'I'm Ready'..."}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100"
                />
                <button 
                  type="submit" 
                  disabled={readinessConfirmed || aiLoading || !inputText.trim()}
                  className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button

        onClick={handleProceed}
        disabled={!allPassed || !readinessConfirmed || loading}
        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'ENTER WAITING ROOM'}
      </button>
    </div>
  );
}
