import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Clock, RotateCcw, Send } from 'lucide-react';

export default function InterviewInstructions({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("Loading instructions...");
  const [inputText, setInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const token = localStorage.getItem('ravengard_uid');
        const res = await fetch(`/api/interview/instructions/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: "" })
        });
        if (res.ok) {
          const data = await res.json();
          setAiMessage(data.response);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstructions();
  }, []);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/interview/instructions/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText })
      });
      if (res.ok) {
        const data = await res.json();
        setAiMessage(data.response);
        if (inputText.toLowerCase().includes('i understand')) {
          setAgreed(true);
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
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: 'device_check', toStage: 'device_check', version: session?.version })
      });
      if (res.ok) {
        const data = await res.json();
        onNext(data.session || data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-white">Interview Instructions</h1>
      <p className="text-white/50 mb-8">Please review these operational guidelines carefully before entering the assessment room.</p>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel border border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">AI Follow-up Questions</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Our AI adapts dynamically to your answers. If you provide a high-level summary, the interviewer may probe deeper into architecture, tradeoffs, or edge-cases. Answer naturally and with technical precision.
          </p>
        </div>

        <div className="glass-panel border border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">"Think Again" Feature</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            You have <strong>2 "Think Again" uses</strong> across the entire session. If you want to rephrase or rethink an answer, you can invoke one before submitting.
          </p>
        </div>

        <div className="glass-panel border border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Response Timing & Pace</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Each question provides adequate preparation and speaking time. Stay engaged and do not switch away from the assessment tab during active rounds.
          </p>
        </div>

        <div className="glass-panel border border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Auto-Save & Disconnects</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Your progress is locked and persisted to the cloud continuously. If your network or browser interrupts, simply reopen the portal to resume your exact stage.
          </p>
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex flex-col space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-blue-200 whitespace-pre-line text-sm">
            {aiMessage}
          </div>
          
          <form onSubmit={handleChat} className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={agreed || aiLoading}
              placeholder={agreed ? "Instructions Understood (Ready to proceed)" : "Type 'I Understand' or ask a question..."}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/20 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm text-white placeholder:text-white/40 disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={agreed || aiLoading || !inputText.trim()}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-5 py-2.5 rounded-md transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProceed}
          disabled={!agreed || loading}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 px-8 rounded-lg transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg"
        >
          {loading ? 'Processing...' : 'PROCEED TO DEVICE CHECK'}
        </button>
      </div>
    </div>
  );
}
