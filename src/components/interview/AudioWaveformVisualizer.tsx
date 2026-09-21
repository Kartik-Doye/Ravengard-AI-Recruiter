import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles, Radio } from 'lucide-react';

interface AudioWaveformVisualizerProps {
  isSpeaking: boolean;
  speakingText?: string;
  enableVoiceSynthesis?: boolean;
  onToggleVoice?: (enabled: boolean) => void;
  className?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isSpeaking,
  speakingText = '',
  enableVoiceSynthesis = false,
  onToggleVoice,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Number of discrete frequency bars to render
  const NUM_BARS = 32;
  const barHeightsRef = useRef<number[]>(new Array(NUM_BARS).fill(4));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      phaseRef.current += isSpeaking ? 0.12 : 0.03;
      const phase = phaseRef.current;

      const barWidth = (width / NUM_BARS) - 2.5;
      const centerY = height / 2;

      // Update target heights based on whether speaking or idle
      for (let i = 0; i < NUM_BARS; i++) {
        const norm = i / (NUM_BARS - 1);
        // Human voice frequency formants: peaking in the middle (vocal range ~300Hz-3kHz)
        const formantWeight = Math.sin(norm * Math.PI);

        let targetH = 3;
        if (isSpeaking) {
          const wave1 = Math.sin(phase * 2.5 + i * 0.45);
          const wave2 = Math.cos(phase * 1.8 + i * 0.25);
          const wave3 = Math.sin(phase * 4.0 + i * 0.8);
          const jitter = (Math.random() - 0.5) * 8;
          const amplitude = (wave1 * 0.45 + wave2 * 0.35 + wave3 * 0.2) * formantWeight;
          targetH = Math.max(4, Math.abs(amplitude) * (height * 0.85) + jitter);
        } else {
          // Gentle ambient breathing idle wave
          const waveIdle = Math.sin(phase + i * 0.2);
          targetH = 3 + Math.abs(waveIdle) * 4;
        }

        // Smooth interpolation toward target height
        barHeightsRef.current[i] += (targetH - barHeightsRef.current[i]) * 0.25;
        const currentH = Math.max(3, barHeightsRef.current[i]);

        const x = i * (barWidth + 2.5) + 2;
        const y = centerY - currentH / 2;

        // Gradient for frequency bars
        const gradient = ctx.createLinearGradient(0, y, 0, y + currentH);
        if (isSpeaking) {
          gradient.addColorStop(0, '#fbbf24'); // Amber 400
          gradient.addColorStop(0.5, '#f59e0b'); // Amber 500
          gradient.addColorStop(1, '#d97706'); // Amber 600
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
        }

        ctx.fillStyle = gradient;

        // Rounded pill bar
        const radius = Math.min(barWidth / 2, currentH / 2);
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, currentH, [radius]);
        ctx.fill();

        // High frequency glow dot when active
        if (isSpeaking && currentH > height * 0.45) {
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, y - 2, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-white/10 p-3.5 shadow-lg ${className}`}
      role="region"
      aria-label="AI Interviewer Audio Waveform"
    >
      {/* Visualizer Top Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Radio className={`w-3 h-3 ${isSpeaking ? 'animate-pulse text-amber-400' : 'text-white/40'}`} />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/80 font-medium">
            AI Interviewer Voice Feed
          </span>
          {isSpeaking ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Speaking...
            </span>
          ) : (
            <span className="text-[10px] font-mono text-white/40 uppercase">
              Standby
            </span>
          )}
        </div>

        {onToggleVoice && (
          <button
            type="button"
            onClick={() => onToggleVoice(!enableVoiceSynthesis)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase transition-colors border ${
              enableVoiceSynthesis
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            }`}
            title={enableVoiceSynthesis ? 'Disable audio speech narration' : 'Enable audio speech narration'}
          >
            {enableVoiceSynthesis ? (
              <>
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3" />
                <span>Audio Muted</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Waveform Canvas */}
      <div className="relative w-full h-12 flex items-center justify-center bg-black/40 rounded-lg p-1 border border-white/5">
        <canvas
          ref={canvasRef}
          width={480}
          height={48}
          className="w-full h-full block"
        />

        {/* Center overlay indicator if desired */}
        {!isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
              Awaiting Next AI Stream
            </span>
          </div>
        )}
      </div>

      {/* Bottom Spectrum Metadata */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5 text-[10px] font-mono text-white/40">
        <span>Channel: AI-TTS Primary (16-bit / 48kHz)</span>
        <span>Frequency Band: 80Hz - 8.5kHz</span>
      </div>
    </div>
  );
};
