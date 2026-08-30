import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, Globe, AlertCircle, Loader2, Send, CheckCircle2, XCircle, Settings, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from './ui/Card';
import { Button } from './ui/Button';

export default function DeviceCheck({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [hasStarted, setHasStarted] = useState(false);
  
  type PermissionState = 'idle' | 'prompt' | 'granted' | 'denied' | 'blocked' | 'unsupported';
  
  const [cameraState, setCameraState] = useState<PermissionState>('idle');
  const [micState, setMicState] = useState<PermissionState>('idle');
  
  const [speakerTestPassed, setSpeakerTestPassed] = useState<boolean | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Check basic browser support
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsBrowserSupported(supported);
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const requestPermissions = async () => {
    setHasStarted(true);
    setCameraState('prompt');
    setMicState('prompt');
    
    if (!isBrowserSupported) {
      setCameraState('unsupported');
      setMicState('unsupported');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraState('granted');
      setMicState('granted');
    } catch (err: any) {
      console.error(err);
      // Determine if it's denied or blocked based on error name
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // We'll mark it as blocked if they previously denied it, or just denied. 
        // In many browsers, a second try automatically fails and is considered 'blocked'.
        setCameraState('blocked');
        setMicState('blocked');
      } else if (err.name === 'NotFoundError') {
        setCameraState('denied'); // Or another state for missing hardware
        setMicState('denied');
      } else {
        setCameraState('denied');
        setMicState('denied');
      }
    }
  };

  const playTestSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const handleProceed = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      
      // Save device check status
      const statusRes = await fetch(`/api/device-check/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          sessionId: session.id,
          status: (cameraState === 'granted' && micState === 'granted' && speakerTestPassed) ? 'passed' : 'failed',
          camera: cameraState,
          mic: micState,
          speaker: speakerTestPassed,
          browser: isBrowserSupported,
          meta: {}
        })
      });
      
      if (!statusRes.ok) throw new Error("Failed to save device check status");

      // Advance stage
      const stageRes = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ stage: 'waiting_room', version: session.version })
      });
      
      if (stageRes.ok) {
        const updatedSession = await stageRes.json();
        onNext(updatedSession);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderFallback = () => {
    if (cameraState === 'blocked' || micState === 'blocked' || cameraState === 'denied' || micState === 'denied') {
      return (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-200">
            <strong className="font-semibold block mb-1 text-rose-400 tracking-wide">Permissions Blocked</strong>
            <p className="mb-3">We cannot access your camera or microphone. Please click the lock icon in your browser's address bar to allow permissions, then click Retry.</p>
            <div className="flex gap-3">
              <Button onClick={requestPermissions} variant="outline" className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20 py-2">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Check
              </Button>
              <Button onClick={() => window.open('about:preferences', '_blank')} variant="outline" className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20 py-2">
                <Settings className="w-4 h-4 mr-2" /> Open Settings
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const allPassed = cameraState === 'granted' && micState === 'granted' && speakerTestPassed === true;

  return (
    <div className="max-w-[800px] mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-2 text-white tracking-wide">Device & Environment Check</h1>
      <p className="text-white/50 mb-8">Let's make sure your camera, microphone, and speakers are ready for the interview.</p>
      
      {!hasStarted ? (
        <Card className="p-8 text-center bg-white/5 border-white/10">
          <div className="flex justify-center gap-6 mb-6">
            <Camera className="w-12 h-12 text-white/30" />
            <Mic className="w-12 h-12 text-white/30" />
            <Volume2 className="w-12 h-12 text-white/30" />
          </div>
          <h2 className="text-xl text-white font-medium mb-3">Hardware Readiness</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            We will now request access to your camera and microphone. This is required to proceed into the waiting room.
          </p>
          <Button onClick={requestPermissions} className="w-full sm:w-auto px-8">
            Start Device Check
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="p-4 border-white/5 bg-white/5 flex items-center gap-4">
              <Camera className={`w-6 h-6 ${cameraState === 'granted' ? 'text-green-400' : cameraState === 'blocked' ? 'text-rose-400' : 'text-white/30'}`} />
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">Camera</h4>
                <p className="text-xs text-white/50 capitalize">{cameraState}</p>
              </div>
              {cameraState === 'granted' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : cameraState === 'blocked' ? <XCircle className="w-5 h-5 text-rose-400" /> : <Loader2 className="w-5 h-5 text-white/30 animate-spin" />}
            </Card>
            
            <Card className="p-4 border-white/5 bg-white/5 flex items-center gap-4">
              <Mic className={`w-6 h-6 ${micState === 'granted' ? 'text-green-400' : micState === 'blocked' ? 'text-rose-400' : 'text-white/30'}`} />
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">Microphone</h4>
                <p className="text-xs text-white/50 capitalize">{micState}</p>
              </div>
              {micState === 'granted' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : micState === 'blocked' ? <XCircle className="w-5 h-5 text-rose-400" /> : <Loader2 className="w-5 h-5 text-white/30 animate-spin" />}
            </Card>
            
            <Card className="p-4 border-white/5 bg-white/5">
              <div className="flex items-center gap-4">
                <Volume2 className={`w-6 h-6 ${speakerTestPassed ? 'text-green-400' : speakerTestPassed === false ? 'text-rose-400' : 'text-white/30'}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">Speaker</h4>
                  <p className="text-xs text-white/50">
                    {speakerTestPassed === null ? 'Pending test' : speakerTestPassed ? 'Working' : 'Test failed'}
                  </p>
                </div>
                {speakerTestPassed ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : speakerTestPassed === false ? <XCircle className="w-5 h-5 text-rose-400" /> : null}
              </div>
              
              {speakerTestPassed === null && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                  <Button onClick={playTestSound} variant="ghost" className="text-xs py-1.5 px-3">
                    Play Test Sound
                  </Button>
                  <span className="text-xs text-white/40">Did you hear it?</span>
                  <button onClick={() => setSpeakerTestPassed(true)} className="text-xs text-green-400 hover:bg-green-400/10 px-2 py-1 rounded">Yes</button>
                  <button onClick={() => setSpeakerTestPassed(false)} className="text-xs text-rose-400 hover:bg-rose-400/10 px-2 py-1 rounded">No</button>
                </div>
              )}
            </Card>
            
            {renderFallback()}
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-black/80 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${cameraState === 'granted' ? 'opacity-100' : 'opacity-0'}`} 
              />
              {cameraState !== 'granted' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-3">
                  <Camera className="w-8 h-8 opacity-50" />
                  <span className="text-sm font-medium tracking-widest font-mono uppercase">Camera Preview</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleProceed}
                disabled={!allPassed || loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Enter Waiting Room'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
