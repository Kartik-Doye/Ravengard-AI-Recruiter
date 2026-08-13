import React from "react";
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function Consent({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("Please read the policy above. When you are ready, type 'I Agree' to lock your session and begin.");
  const [inputText, setInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('traineer_uid');
      const res = await fetch(`/api/session/${session.id}/policy-confirm`, {
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
        if (inputText.toLowerCase().includes('i agree')) {
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

  const handleEnter = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('traineer_uid');
      const res = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: 'resume', version: session.version })
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
    <div className="max-w-[700px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Policy & Consent</h1>
      <p className="text-slate-500 mb-8">Please review and agree to our data usage and privacy policies before beginning your assessment.</p>
        
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-8 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Privacy & Data Retention Policy</h3>
        </div>
        <div className="p-6 text-sm text-slate-700 space-y-4">
          <p>
            <strong>What we collect:</strong> Traineer collects your registration details, resume (PDF/DOCX), and records your voice and video via your browser during the assessment.
          </p>
          <p>
            <strong>How it is used:</strong> Your data is used exclusively to conduct the mock AI interview, generate your personalized evaluation report, and provide actionable feedback. Your audio and video are processed in real-time by AI models to simulate a live interview.
          </p>
          <p>
            <strong>Data Retention:</strong> 
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong>Raw Media:</strong> Raw audio and video recordings are <strong>deleted after 30 days</strong>.</li>
              <li><strong>Transcripts & Reports:</strong> Text transcripts, extracted resume data, and generated reports are retained for up to 1 year to allow you to review your progress and for system auditing.</li>
            </ul>
          </p>
          <p>
            <strong>Your Rights:</strong> You can request deletion of all your data at any time by contacting support. Once deleted, it cannot be recovered.
          </p>
          <p>
            <strong>Eligibility:</strong> By continuing, you confirm that you are at least 18 years of age.
          </p>
        </div>
        <div className="p-6 bg-slate-50 border-t border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Assessment Rules</h3>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-slate-700 list-disc list-inside text-sm">
            <li>Ensure you are in a quiet environment with a stable internet connection.</li>
            <li>Camera and Microphone access are required for the AI interviewer to interact with you.</li>
            <li>The assessment is locked once started. However, you may pause the session and resume within 2 hours if an emergency occurs.</li>
          </ul>
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
              placeholder={agreed ? "Session Locked" : "Type 'I Agree' or ask a question..."}
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
        onClick={handleEnter}
        disabled={!agreed || loading}
        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Entering...' : 'ENTER TRAINEER'}
      </button>
    </div>
  );
}
