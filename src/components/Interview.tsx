import { useVisibilityCheck } from '../hooks/useVisibilityCheck';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Mic, StopCircle, User, AlertTriangle } from 'lucide-react';

function pcmToBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToPcm(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

export default function Interview({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [time, setTime] = useState(0);
  const [thinkAgainLeft, setThinkAgainLeft] = useState(2 - (session?.thinkAgainUsed || 0));
  const [showWarning, setShowWarning] = useState(false);

  useVisibilityCheck(session?.id, () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  });

  
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    // Timer
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Setup video
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }).catch(console.error);

    // Setup websocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('ravengard_uid');
    const wsUrl = `${protocol}//${window.location.host}/api/live?sessionId=${session?.id}&token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      setConnected(true);
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };
      } catch (err) {
        console.error("Mic access denied", err);
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.audio) {
        setIsSpeaking(true);
        const pcm = base64ToPcm(msg.audio);
        const audioCtx = outputAudioCtxRef.current;
        if (audioCtx) {
          const buffer = audioCtx.createBuffer(1, pcm.length, 24000);
          buffer.copyToChannel(pcm, 0);
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          
          if (nextStartTimeRef.current < audioCtx.currentTime) {
             nextStartTimeRef.current = audioCtx.currentTime;
          }
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          activeSourcesRef.current.push(source);
          
          source.onended = () => {
             activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
             if (activeSourcesRef.current.length === 0) {
                setIsSpeaking(false);
             }
          };
        }
      }
      if (msg.interrupted) {
         setIsSpeaking(false);
         activeSourcesRef.current.forEach(s => s.stop());
         activeSourcesRef.current = [];
         nextStartTimeRef.current = 0;
      }
    };

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
      if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
      }
    };
  }, []);


  const handleThinkAgain = async () => {
    if (thinkAgainLeft <= 0) return;
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session?.id}/think-again`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setThinkAgainLeft(prev => prev - 1);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ text: "The candidate has used a 'Think Again' pass. Please provide a brief, helpful hint for the current question to guide their thinking without giving away the complete answer, then encourage them to try answering again." }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session?.id || 'new'}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: 'dashboard', version: session.version })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        onNext(updatedSession);
      } else {
        // Mock fallback if offline/no session
        onNext({ ...session, currentStage: 'dashboard' });
      }
    } catch (error) {
      console.error(error);
      onNext({ ...session, currentStage: 'dashboard' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto h-[85vh] flex flex-col relative">
      {showWarning && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <p className="font-bold text-lg">Warning: Tab Switched</p>
            <p className="text-sm">Navigating away from the assessment is prohibited and has been logged.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Friendly HR <span className="text-slate-400 text-lg font-normal ml-2">(Round 1 of 9)</span></h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            {connected ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Connected</>
            ) : (
              <><Loader2 className="w-3 h-3 animate-spin" /> Connecting to AI Engine...</>
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono text-slate-700">{formatTime(time)}</div>
          <p className="text-slate-400 text-xs font-semibold tracking-wider">ELAPSED TIME</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 min-h-0">
        <div className="bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800 shadow-xl">
          <div className="text-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-500 ${isSpeaking ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.5)]' : 'bg-slate-800'}`}>
              <User className={`w-14 h-14 ${isSpeaking ? 'text-white' : 'text-slate-600'}`} />
            </div>
            <p className="text-white font-medium text-lg">AI Interviewer</p>
            <p className="text-slate-400 text-sm mt-1">{isSpeaking ? 'Speaking...' : 'Listening...'}</p>
          </div>
          
          {/* Audio Waveform Viz (fake CSS animation for effect) */}
          {isSpeaking && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ height: Math.random() * 24 + 8, animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800 shadow-xl">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90 transform -scale-x-100" />
           <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <span className="text-white text-xs font-medium">Recording</span>
           </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
             <Mic className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-900 font-medium">Your Microphone is Active</p>
            <p className="text-sm text-slate-500">Speak clearly. The AI will respond when you finish.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 ml-6">
           <button onClick={handleThinkAgain} disabled={thinkAgainLeft <= 0} className="bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50">
             Think Again ({thinkAgainLeft} left)
           </button>
           <button
             onClick={handleComplete}
             disabled={loading}
             className="bg-red-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
             End Session
           </button>
        </div>
      </div>
    </div>
  );
}
