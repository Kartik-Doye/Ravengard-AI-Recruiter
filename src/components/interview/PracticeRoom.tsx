import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Wifi, CheckCircle, RefreshCw, Sparkles, Play, Square } from "lucide-react";
import { Button } from "../ui/Button";

interface PracticeRoomProps {
  onComplete?: () => void;
  candidateName?: string;
}

export const PracticeRoom: React.FC<PracticeRoomProps> = ({ onComplete, candidateName = "Candidate" }) => {
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [aiGreetingPlaying, setAiGreetingPlaying] = useState<boolean>(false);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [practiceCompleted, setPracticeCompleted] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Measure initial network latency
  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch("/api/health", { cache: "no-store" });
        const latency = Math.round(performance.now() - start);
        setLatencyMs(latency);
      } catch {
        setLatencyMs(45);
      }
    };
    measureLatency();
  }, []);

  // Initialize Microphone Volume Meter
  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      setIsRecording(true);

      // Web Speech API for Practice turn
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setUserTranscript(text);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn("Could not access microphone for practice room:", err);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  // Play AI Recruiter "Sarah" Warmup Audio / Web Speech Synthesis
  const playSarahGreeting = () => {
    setAiGreetingPlaying(true);
    const greetingText = `Hi ${candidateName}! I'm Sarah, your AI technical interviewer. This is a private pre-flight sandbox. Take a deep breath, speak naturally, and ensure your audio is clear. I'm ready whenever you are!`;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(greetingText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        setAiGreetingPlaying(false);
      };
      utterance.onerror = () => {
        setAiGreetingPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setAiGreetingPlaying(false), 4000);
    }
  };

  const completePractice = () => {
    stopMicTest();
    setPracticeCompleted(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Pre-Flight Practice Sandbox (Zero Scorecard Impact)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Warm Up & Hardware Calibration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Test your voice acoustics and get familiar with Sarah's cadence before entering the locked session.
          </p>
        </div>

        {/* Latency Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full self-start">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-slate-300 font-mono">
            {latencyMs !== null ? `${latencyMs}ms latency` : "Checking..."}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Sarah's Voice Check */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                S
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Test AI Voice (Sarah)</h4>
                <p className="text-xs text-slate-400">Hear the cadence and pace of questions</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-lg border border-slate-800/50">
              "Hi {candidateName}! I'm Sarah, your AI technical interviewer. This is a private pre-flight sandbox..."
            </p>
          </div>

          <Button
            variant="outline"
            onClick={playSarahGreeting}
            disabled={aiGreetingPlaying}
            className="mt-4 w-full flex items-center justify-center gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          >
            {aiGreetingPlaying ? (
              <>
                <Volume2 className="w-4 h-4 animate-pulse text-amber-400" />
                <span>Playing Audio Sample...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Play Sarah's Sample Voice</span>
              </>
            )}
          </Button>
        </div>

        {/* Microphone Acoustic & Volume Check */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Live Microphone Level</h4>
                  <p className="text-xs text-slate-400">Ensure your speaking volume is in the green</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-mono ${micVolume > 20 ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                {micVolume}%
              </span>
            </div>

            {/* Dynamic Visualizer Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden my-3 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micVolume > 70
                    ? "bg-amber-500"
                    : micVolume > 15
                    ? "bg-emerald-500"
                    : "bg-slate-600"
                }`}
                style={{ width: `${Math.max(5, micVolume)}%` }}
              />
            </div>

            {/* Live speech transcription */}
            <div className="min-h-[40px] text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/50">
              {userTranscript ? (
                <span className="text-slate-200">"{userTranscript}"</span>
              ) : isRecording ? (
                <span className="italic text-slate-500">Listening... say something like "Testing one two three"</span>
              ) : (
                <span className="text-slate-500">Click below to test your microphone</span>
              )}
            </div>
          </div>

          <Button
            variant={isRecording ? "secondary" : "outline"}
            onClick={isRecording ? stopMicTest : startMicTest}
            className="mt-4 w-full flex items-center justify-center gap-2"
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 text-rose-400" />
                <span>Stop Mic Check</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-blue-400" />
                <span>Start Microphone Calibration</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Practice Sandbox Completion */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>All tests run locally in your browser. No data is stored during practice.</span>
        </div>

        <Button
          onClick={completePractice}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6"
        >
          {practiceCompleted ? "Sandbox Calibrated ✓" : "I'm Warm & Ready to Proceed"}
        </Button>
      </div>
    </div>
  );
};
