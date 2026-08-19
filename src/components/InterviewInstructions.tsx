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
        body: JSON.stringify({ stage: 'device_check', version: session.version })
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

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Interview Instructions</h1>
      <p className="text-slate-500 mb-8">Please read these rules carefully. They explain how the AI interviewer will evaluate you.</p>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">AI Follow-up Questions</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our AI adapts to your answers. If you give a brief or vague answer, the AI may ask a follow-up question to probe deeper. Answer naturally and fully, just like you would in a real interview.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">"Think Again" Feature</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            You have <strong>2 "Think Again" uses</strong> for the entire interview. If you stumble or want to rephrase, you can use one to discard your current recording and start your answer over. Use them wisely!
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Silence & Timeouts</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you remain silent for too long, the AI will prompt you to speak. If you continue to remain silent, it will automatically move to the next question. Do not leave the tab idle.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Auto-Save & Disconnects</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your progress is saved continuously. If your browser crashes or network drops, simply return to this link. You will resume from exactly where you left off.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <div className="flex flex-col space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-slate-800 whitespace-pre-line text-sm">
            {aiMessage}
          </div>
          
          <form onSubmit={handleChat} className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={agreed || aiLoading}
              placeholder={agreed ? "Instructions Understood" : "Type 'I Understand' or ask a question..."}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100"
            />
            <button 
              type="submit" 
              disabled={agreed || aiLoading || !inputText.trim()}
              className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <button
        onClick={handleProceed}
        disabled={!agreed || loading}
        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'PROCEED TO DEVICE CHECK'}
      </button>
    </div>
  );
}
