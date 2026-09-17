import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function InterviewEngine({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [interviewSession, setInterviewSession] = useState<any>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const token = localStorage.getItem('ravengard_uid');

  useEffect(() => {
    // Start interview session
    const startSession = async () => {
      let timeoutId;
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
          fetchNextQuestion();
        }
      } catch (e) {
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

    const fetchNextQuestion = (attempt = 1) => {
    setLoading(false);
    setIsStreaming(true);
    if (attempt === 1) {
      setQuestionText('');
      setQuestionId(null);
      setResponse('');
    }
    const eventSource = new EventSource(`/api/interview/${session.id}/stream-question?token=${token}`);
        
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        setIsStreaming(false);
        eventSource.close();
        handleRetryFetchQuestion(attempt);
      } else if (data.done) {
        setQuestionId(data.questionId);
        setIsStreaming(false);
        eventSource.close();
      } else if (data.text) {
        setQuestionText(prev => prev + data.text);
      }
    };
    
    eventSource.onerror = () => {
      setIsStreaming(false);
      eventSource.close();
      handleRetryFetchQuestion(attempt);
    };
  };

  const handleRetryFetchQuestion = (attempt) => {
    if (attempt < 4) {
      setQuestionText(`Connection lost. Retrying... (Attempt ${attempt}/3)`);
      setTimeout(() => fetchNextQuestion(attempt + 1), 2000 * attempt);
    } else {
      setIsStreaming(false);
      setQuestionText("Connection failed. Please check your network and refresh the page to continue.");
    }
  };

  
  const handleFinish = async () => {
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
          fetchNextQuestion();
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

  if (loading) {
    return <div className="text-white text-center py-20">Initializing Engine...</div>;
  }

  return (
    <div className="max-w-[700px] mx-auto py-10">
      <div className="mb-6">
        <div className="text-xs font-mono text-[var(--color-secondary)] mb-2 tracking-widest uppercase">
          {interviewSession?.roundType} ROUND
        </div>
        <h2 className="text-2xl font-display text-white">Question</h2>
      </div>

      <Card className="p-8 bg-white/5 border-white/10 mb-6">
        <div className="min-h-[100px] text-lg text-white/90 leading-relaxed font-light">
          {questionText || <span className="text-white/30 animate-pulse">Generating...</span>}
        </div>
      </Card>

      <Card className="p-1 bg-white/5 border-white/10">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={isStreaming || isSubmitting}
          placeholder={isStreaming ? "Wait for question to complete..." : "Type your answer..."}
          className="w-full h-40 bg-transparent border-0 p-4 text-white focus:ring-0 resize-none font-light"
        />
        <div className="flex justify-end p-3 border-t border-white/10 bg-black/20">
          
          <Button 
            variant="outline"
            onClick={handleFinish} 
            disabled={isStreaming || isSubmitting}
            className="mr-3"
          >
            Finish Interview
          </Button>
          <Button 
            onClick={handleSubmit} 

            disabled={isStreaming || isSubmitting || !response.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
