import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DemoLink } from '../ui/DemoLink';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  Bot,
  User,
  Shield,
  Layers,
  Cpu,
  Zap,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

type ModelComplexity = 'general' | 'complex' | 'fast';
type ChatRole = 'candidate_advisor' | 'admin_copilot';

const STARTER_PROMPTS: Record<ChatRole, string[]> = {
  candidate_advisor: [
    'How does the 7-phase assessment journey work?',
    'What is Blind Evaluation Mode and how does it prevent bias?',
    'What happens if my network disconnects mid-interview?',
    'How does deterministic rubric scoring evaluate code?'
  ],
  admin_copilot: [
    'How are rubric weights assigned across competencies?',
    'What integrity signals are tracked during the session?',
    'How do I generate a magic link for a candidate?',
    'Explain the 1-Minute Executive Digest format'
  ]
};

export function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Settings
  const [taskComplexity, setTaskComplexity] = useState<ModelComplexity>('general');
  const [role, setRole] = useState<ChatRole>('candidate_advisor');

  // Messages & Input
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      content:
        "Greetings! I am RavenGard's AI Assessment Advisor. I can answer any questions about our 7-phase sequential interview process, deterministic rubric scoring, Blind Evaluation Mode, or hardware checks.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Map history for Gemini API
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          role,
          taskComplexity
        })
      });

      const data = await res.json();
      const modelReply: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: data.reply || 'I am ready to assist with any questions regarding your assessment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || getModelLabel(taskComplexity)
      };

      setMessages((prev) => [...prev, modelReply]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorReply: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content:
          'RavenGard AI utilizes deterministic rubrics to evaluate engineering competencies objectively. You can continue or ask another question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'fallback'
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'model',
        content: 'Conversation reset. How may I assist your engineering assessment today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: getModelLabel(taskComplexity)
      }
    ]);
  };

  function getModelLabel(complexity: ModelComplexity) {
    switch (complexity) {
      case 'complex':
        return 'gemini-3.1-pro-preview';
      case 'fast':
        return 'gemini-3.1-flash-lite';
      case 'general':
      default:
        return 'gemini-3.5-flash';
    }
  }

  return (
    <>
      {/* Floating Chat / Advisor Consultation Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <DemoLink
          to="/contact"
          className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-zinc-200 no-underline"
          aria-label="Ask the Advisor - Book Consultation"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Ask the Advisor</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </DemoLink>
      </div>

      {/* Main Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={`bg-[#0f1117] border border-white/15 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col w-full text-white overflow-hidden transition-all duration-300 ${
                isExpanded
                  ? 'sm:max-w-4xl h-[92vh]'
                  : 'sm:max-w-xl h-[80vh] sm:h-[650px]'
              }`}
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">RavenGard AI Advisor</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[9px] font-mono uppercase">
                        {getModelLabel(taskComplexity)}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 font-mono">Multi-turn verification assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden sm:inline-flex p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title={isExpanded ? 'Restore size' : 'Expand window'}
                  >
                    {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Model & Role Configuration Strip */}
              <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                {/* Role Switcher */}
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40">Role:</span>
                  <button
                    onClick={() => setRole('candidate_advisor')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      role === 'candidate_advisor'
                        ? 'bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Candidate Guide
                  </button>
                  <button
                    onClick={() => setRole('admin_copilot')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      role === 'admin_copilot'
                        ? 'bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Recruiter Copilot
                  </button>
                </div>

                {/* Model Complexity Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40">Engine:</span>
                  <select
                    value={taskComplexity}
                    onChange={(e) => setTaskComplexity(e.target.value as ModelComplexity)}
                    className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80 focus:outline-none focus:border-amber-400"
                  >
                    <option value="general" className="bg-[#12141a]">General (gemini-3.5-flash)</option>
                    <option value="complex" className="bg-[#12141a]">Deep Reasoning (gemini-3.1-pro-preview)</option>
                    <option value="fast" className="bg-[#12141a]">Rapid Q&A (gemini-3.1-flash-lite)</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Conversation Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex-shrink-0 flex items-center justify-center text-amber-400 mt-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-amber-400 text-black font-sans font-medium rounded-tr-sm shadow-md'
                            : 'bg-white/[0.04] border border-white/10 text-white/90 rounded-tl-sm font-sans'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>

                        <div
                          className={`flex items-center justify-between gap-3 mt-1.5 pt-1 text-[10px] font-mono border-t ${
                            isUser
                              ? 'border-black/10 text-black/60'
                              : 'border-white/5 text-white/40'
                          }`}
                        >
                          <span>{m.timestamp}</span>
                          {m.modelUsed && !isUser && (
                            <span className="text-[9px] opacity-75">{m.modelUsed}</span>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex-shrink-0 flex items-center justify-center text-white/70 mt-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2 text-white/40 text-xs font-mono pl-9">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></div>
                    <span className="ml-1 text-[11px]">Synthesizing with {getModelLabel(taskComplexity)}...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter Suggestions Chips */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 border-t border-white/5 bg-black/20">
                  <div className="text-[10px] font-mono text-white/40 uppercase mb-1.5">Suggested Inquiries:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_PROMPTS[role].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-left transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Ask about evaluation, scoring, or rules (${getModelLabel(taskComplexity)})...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={loading}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 font-sans"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 text-black transition-all cursor-pointer flex items-center justify-center shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
