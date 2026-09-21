import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Sparkles, Check } from 'lucide-react';

interface VoiceInputToggleProps {
  onTranscript: (newText: string, isFinal: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceInputToggle: React.FC<VoiceInputToggleProps> = ({
  onTranscript,
  disabled = false,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript, true);
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was silent, ignore
        } else {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (disabled || !isSupported) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error(e);
      }
      setIsListening(false);
      setInterimText('');
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
      } catch (e: any) {
        console.error('Speech recognition start failed:', e);
        setError('Could not access microphone. Please verify device permissions.');
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-[11px] font-mono text-white/40 flex items-center gap-1.5 ${className}`}>
        <MicOff className="w-3.5 h-3.5 text-white/30" />
        <span>Voice-to-Text supported in Chrome & Edge</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? 'Click to stop voice dictation' : 'Click to answer with voice (Web Speech API)'}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 border ${
            isListening
              ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-md shadow-red-500/20 ring-2 ring-red-500/30'
              : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Listening (Click to Pause)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice-to-Text Input</span>
            </>
          )}
        </button>

        {isListening && (
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
            Dictating live...
          </span>
        )}
      </div>

      {interimText && (
        <div className="text-xs text-amber-300/80 italic font-mono bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 max-w-md line-clamp-1">
          &ldquo;{interimText}...&rdquo;
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
