import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InterviewProgressStepper, InterviewStageKey } from '../components/interview/InterviewProgressStepper';
import { AudioWaveformVisualizer } from '../components/interview/AudioWaveformVisualizer';
import { VoiceInputToggle } from '../components/interview/VoiceInputToggle';
import { Volume2, VolumeX, Sparkles, MessageSquare } from 'lucide-react';

export default function InterviewEngine({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [interviewSession, setInterviewSession] = useState<any>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [enableVoiceNarration, setEnableVoiceNarration] = useState(false);
  
  const token = localStorage.getItem('ravengard_uid');
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Map question index to explicit interview stages
  const getStageFromIndex = (idx: number): InterviewStageKey => {
    if (idx <= 1) return 'Introduction';
    if (idx === 2) return 'Technical';
    if (idx === 3) return 'Behavioral';
    return 'Conclusion';
  };

  // Clean up any speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Start interview session
    const startSession = async () => {
      let timeoutId: any;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 45000);
        const res = await fetch(`/api/interview/${session.id}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await res.json();
        if (data.success) {
          setInterviewSession(data.interviewSession);
          fetchNextQuestion(1, 1);
        }
      } catch (e: any) {
        console.error("Failed to start session:", e);
        if (e && e.name === 'AbortError') {
          setQuestionText('Starting the interview took too long. Please refresh the page and try again.');
          setLoading(false);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    startSession();
  }, [session.id, token]);

  const speakQuestion = (text: string) => {
    if (!enableVoiceNarration || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsAiSpeaking(true);
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsAiSpeaking(false);
    }
  };

  const fetchNextQuestion = (attempt = 1, nextIdx?: number) => {
    setLoading(false);
    setIsStreaming(true);
    setIsAiSpeaking(true);

    if (nextIdx) {
      setQuestionIndex(nextIdx);
    }

    if (attempt === 1) {
      setQuestionText('');
      setQuestionId(null);
      setResponse('');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    const eventSource = new EventSource(`/api/interview/${session.id}/stream-question?token=${token}`);
    let accumulatedText = '';
        
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        setIsStreaming(false);
        setIsAiSpeaking(false);
        eventSource.close();
        handleRetryFetchQuestion(attempt);
      } else if (data.done) {
        setQuestionId(data.questionId);
        setIsStreaming(false);
        eventSource.close();

        // If voice narration is active, continue visualizer while speaking completed text
        if (enableVoiceNarration && accumulatedText) {
          speakQuestion(accumulatedText);
        } else {
          setIsAiSpeaking(false);
        }
      } else if (data.text) {
        accumulatedText += data.text;
        setQuestionText(prev => prev + data.text);
      }
    };
    
    eventSource.onerror = () => {
      setIsStreaming(false);
      setIsAiSpeaking(false);
      eventSource.close();
      handleRetryFetchQuestion(attempt);
    };
  };

  const handleRetryFetchQuestion = (attempt: number) => {
    if (attempt < 4) {
      setQuestionText(`Connection lost. Retrying... (Attempt ${attempt}/3)`);
      setTimeout(() => fetchNextQuestion(attempt + 1), 2000 * attempt);
    } else {
      setIsStreaming(false);
      setIsAiSpeaking(false);
      setQuestionText("Connection failed. Please check your network and refresh the page to continue.");
    }
  };

  const handleFinish = async () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSubmitting(true);
    try {
      const stageRes = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ stage: 'report_generation', currentStage: session.currentStage })
      });
      if (stageRes.ok) {
        const updated = await stageRes.json();
        onNext(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !questionId) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSubmitting(true);
    
    let success = false;
    let attempts = 0;
    
    while (!success && attempts < 3) {
      attempts++;
      try {
        const res = await fetch(`/api/interview/${session.id}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ questionId, responseText: response })
        });
        
        const data = await res.json();
        if (data.success) {
          success = true;
          const nextQ = questionIndex + 1;
          setQuestionIndex(nextQ);
          fetchNextQuestion(1, nextQ);
        } else {
          throw new Error('Failed to submit');
        }
      } catch (e) {
        console.error(`Submit error (Attempt ${attempts}):`, e);
        if (attempts === 3) {
          alert("Failed to submit answer due to a network error. Please try again.");
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    setIsSubmitting(false);
  };

  // Handle Voice-to-Text transcript from Web Speech API
  const handleVoiceTranscript = (newText: string, isFinal: boolean) => {
    setResponse((prev) => {
      const cleanPrev = prev.trim();
      const cleanNew = newText.trim();
      if (!cleanPrev) return cleanNew;
      return `${cleanPrev} ${cleanNew}`;
    });
  };

  if (loading) {
    return (
      <div className="text-white text-center py-20 space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-white/50">Initializing Autonomous Engine...</p>
      </div>
    );
  }

  const currentStageKey = getStageFromIndex(questionIndex);

  return (
    <div className="max-w-[760px] mx-auto py-8 px-4 space-y-6">
      {/* 1. Linear Progress Stepper Component */}
      <InterviewProgressStepper
        currentStage={currentStageKey}
        currentQuestionIndex={questionIndex}
        totalQuestions={4}
      />

      {/* 2. Real-Time Audio Frequency Waveform Visualizer */}
      <AudioWaveformVisualizer
        isSpeaking={isStreaming || isAiSpeaking}
        speakingText={questionText}
        enableVoiceSynthesis={enableVoiceNarration}
        onToggleVoice={(enabled) => {
          setEnableVoiceNarration(enabled);
          if (enabled && questionText && !isStreaming) {
            speakQuestion(questionText);
          } else if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsAiSpeaking(false);
          }
        }}
      />

      {/* Question Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{interviewSession?.roundType || 'General'} Stage: {currentStageKey}</span>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            Prompt #{questionIndex}
          </span>
        </div>

        <Card className="p-6 sm:p-8 bg-white/[0.03] border-white/10 relative overflow-hidden backdrop-blur-sm">
          <div className="min-h-[90px] text-lg text-white/90 leading-relaxed font-light">
            {questionText || (
              <span className="text-white/30 animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                Formulating assessment question...
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Answer Area with Voice-to-Text Input Toggle */}
      <Card className="p-1 bg-white/[0.03] border-white/10 overflow-hidden shadow-2xl">
        {/* Voice Input Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-black/40 border-b border-white/10">
          <VoiceInputToggle
            onTranscript={handleVoiceTranscript}
            disabled={isStreaming || isSubmitting}
          />
          <span className="text-[11px] font-mono text-white/40">
            {response.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={isStreaming || isSubmitting}
          placeholder={
            isStreaming
              ? "Wait for the AI question to complete..."
              : "Type your answer or click 'Voice-to-Text Input' to speak using your microphone..."
          }
          className="w-full h-44 bg-transparent border-0 p-4 text-white focus:ring-0 resize-none font-light placeholder:text-white/30 leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t border-white/10 bg-black/30">
          <Button
            variant="outline"
            onClick={handleFinish}
            disabled={isStreaming || isSubmitting}
            className="text-xs font-mono uppercase tracking-wider"
          >
            Conclude Assessment
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isStreaming || isSubmitting || !response.trim()}
            className="text-xs font-mono uppercase tracking-wider"
          >
            {isSubmitting ? "Submitting Response..." : "Submit Answer & Proceed"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
