import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  HelpCircle,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  Award,
  Video,
  Search
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'Process' | 'Privacy' | 'Technical' | 'Security';
  question: string;
  answer: string;
  badge?: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Process',
    question: 'How does RavenGard’s 7-Phase Assessment Journey work?',
    answer:
      'The assessment is strictly sequential and server-gated across seven deterministic phases: (1) Foundation & Registration, (2) Hardware & Device Check, (3) Waiting Room, (4) Dynamic Technical Interview, (5) Anti-Cheat Telemetry, (6) Rubric-Based Final Report, and (7) Admin Audit. Each phase transitions only when verified, eliminating skips or manual tampering.',
    badge: 'Core Workflow'
  },
  {
    id: 'faq-2',
    category: 'Privacy',
    question: 'What is Blind Evaluation Mode, and how does it prevent hiring bias?',
    answer:
      'Blind Evaluation Mode cryptographically masks personal identifiers—such as candidate names, email addresses, graduation institutions, and demographic metadata—from human reviewers. Engineering panels evaluate solely based on anonymized architectural diagrams, verified code execution, and system trade-off reasoning.',
    badge: 'Merit-First'
  },
  {
    id: 'faq-3',
    category: 'Technical',
    question: 'What hardware checks are conducted before the technical interview?',
    answer:
      'In Phase 2, our engine validates camera feed, microphone input volume, speaker playback loop, and WebRTC browser compatibility. If any permission is blocked or denied, the system provides clear step-by-step diagnostic instructions rather than failing silently.',
    badge: 'Phase 2'
  },
  {
    id: 'faq-4',
    category: 'Technical',
    question: 'What happens if my network drops, computer reboots, or browser crashes?',
    answer:
      'RavenGard enforces resilient session recovery. Every candidate answer and stage transition is durably saved in our relational Cloud SQL database. Upon reconnecting, the candidate portal automatically restores your active stage and prompts exactly where you left off without data loss.',
    badge: 'State Recovery'
  },
  {
    id: 'faq-5',
    category: 'Security',
    question: 'How are anti-cheat integrity signals monitored during the session?',
    answer:
      'Integrity telemetry (such as window focus changes, prolonged pauses, and peripheral device shifts) is recorded asynchronously and non-intrusively via dedicated background endpoints. It never interrupts the candidate’s problem-solving flow; signals are synthesized post-interview into risk indices for human audit.',
    badge: 'Phase 5'
  },
  {
    id: 'faq-6',
    category: 'Process',
    question: 'How does the deterministic scoring rubric evaluate code execution and architecture?',
    answer:
      'Rather than relying on vague subjective impressions, the scoring engine breaks evaluation into three core competencies: Architectural Soundness (50-60%), Code Execution Accuracy (30-40%), and System Trade-offs (10%). Scores are backed by verbatim code evidence and test-suite metrics.',
    badge: 'Scoring Engine'
  },
  {
    id: 'faq-7',
    category: 'Privacy',
    question: 'Can I view my verified scorecard and executive report after finishing?',
    answer:
      'Yes. Once the scoring worker finalizes your submission, you receive an interactive executive report detailing your competency breakdown, strengths, areas for technical growth, and verified work-sample snippets.',
    badge: 'Candidate Report'
  }
];

export function FAQs() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-2': true });
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = ['ALL', 'Process', 'Privacy', 'Technical', 'Security'];

  const filteredFaqs = FAQS_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-20 px-6 max-w-5xl mx-auto w-full" id="faqs">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 text-[var(--color-secondary)] text-xs font-mono uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Candidate & Recruiter Knowledge Base</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-light text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-white/60 mt-3 font-sans leading-relaxed">
          Everything candidates and hiring teams need to know about our deterministic, bias-free AI evaluation platform.
        </p>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-black font-medium shadow-md shadow-amber-400/10'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-white/40 font-mono text-xs">
            No matching questions found.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openIds[faq.id];
            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white/[0.04] border-white/20 shadow-lg shadow-black/20'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/15'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    {faq.badge && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/5 text-white/50 text-[10px] font-mono border border-white/10 flex-shrink-0">
                        {faq.badge}
                      </span>
                    )}
                    <span className="text-sm sm:text-base font-medium text-white/90">
                      {faq.question}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 p-1 text-white/40"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed font-sans border-t border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
