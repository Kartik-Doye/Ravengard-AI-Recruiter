import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, ChevronLeft, ChevronRight, Star, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarInitials: string;
  stat: string;
  statLabel: string;
  tags: string[];
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      "Ravengard completely replaced our erratic first-round technical phone screens. Instead of senior staff engineers burning 15 hours a week asking trivia, candidates submit verifiable distributed systems reasoning on their own time. The 1-minute executive digests give us signal in 60 seconds.",
    author: "Marcus Vance",
    role: "VP of Engineering",
    company: "Apex Cloud Infrastructure",
    avatarInitials: "MV",
    stat: "78% Time Saved",
    statLabel: "Engineering hours preserved per req",
    tags: ["Distributed Systems", "Greenhouse Sync", "Rubric Calibration"],
  },
  {
    id: '2',
    quote:
      "The Blind Evaluation mode solved a massive internal bias problem. Evaluating candidates purely on their code execution, architecture choices, and edge-case testing—without seeing names or universities—boosted our offer acceptance rate by 34%. It's the only AI interviewer our team genuinely trusts.",
    author: "Elena Rostova",
    role: "Head of Infrastructure & Core Platform",
    company: "Hyperion Protocol",
    avatarInitials: "ER",
    stat: "Zero Demographic Bias",
    statLabel: "NYC Local Law 144 audit compliance",
    tags: ["Blind Evaluation", "EEOC Dossiers", "Deterministic Scoring"],
  },
  {
    id: '3',
    quote:
      "Unlike mock interview bots that hallucinate scores, Ravengard's rubric-driven architecture is rock-solid. When our candidates get disconnected or experience browser glitches, the session recovery brings them right back without penalizing them. Candidates actually praise the candidate experience.",
    author: "David K. Chen",
    role: "Chief Technology Officer",
    company: "SentryFlow Distributed",
    avatarInitials: "DC",
    stat: "99.4% Candidate NPS",
    statLabel: "Self-reported candidate satisfaction",
    tags: ["Fault Tolerant", "Work Sample Proof", "Lever ATS Sync"],
  },
  {
    id: '4',
    quote:
      "We scaled our autumn hiring surge to 1,200 applicants without adding a single recruiter head. The auto-generated magic invitation links and instant ATS scorecard pushes gave our hiring managers a streamlined pipeline that felt like a superpower.",
    author: "Aria Montgomery",
    role: "Global Director of Technical Talent",
    company: "Starlight Quantum Systems",
    avatarInitials: "AM",
    stat: "4.2x Throughput",
    statLabel: "Candidates screened per calendar week",
    tags: ["High Volume", "Enterprise Copilot", "Cryptographic Links"],
  },
];

export function TestimonialsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const activeTestimonial = testimonials[currentIndex];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.28 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <section 
      id="testimonials" 
      className="relative px-6 py-24 md:px-10 z-10 bg-[var(--color-bg-0)] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Engineering Leadership Validation</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl text-white">
              Trusted by tech leads who refuse to waste senior engineering hours.
            </h2>
            <p className="mt-3 text-sm md:text-base text-white/65 max-w-2xl leading-relaxed">
              Real testimonials from VP of Engineering and CTO leaders running deterministic AI evaluations across global distributed teams.
            </p>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={prevSlide}
              aria-label="Previous testimonial"
              className="w-12 h-12 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-mono text-xs text-white/60 tracking-wider px-2">
              <span className="text-white font-bold">{currentIndex + 1}</span> / {testimonials.length}
            </div>
            <button
              onClick={nextSlide}
              aria-label="Next testimonial"
              className="w-12 h-12 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Testimonial Active Display Card */}
        <div className="relative min-h-[380px] md:min-h-[320px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={activeTestimonial.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="rounded-[32px] border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(124,147,255,0.12),transparent_70%)] pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 md:gap-12 items-center relative z-10">
                {/* Left: Quote and Author Info */}
                <div className="space-y-6">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                    <span className="text-xs font-mono text-white/40 ml-2">Verified Enterprise Deployment</span>
                  </div>

                  {/* Quote Body */}
                  <blockquote className="text-lg md:text-2xl text-white/95 font-medium leading-relaxed">
                    "{activeTestimonial.quote}"
                  </blockquote>

                  {/* Author Attribution */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-400 text-white font-semibold flex items-center justify-center text-sm shadow-md shrink-0">
                      {activeTestimonial.avatarInitials}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-base tracking-tight">
                        {activeTestimonial.author}
                      </h4>
                      <p className="text-xs text-white/60">
                        {activeTestimonial.role} • <span className="text-white/80 font-medium">{activeTestimonial.company}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Key Result Metric Block */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-1">
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Measured Impact
                    </p>
                    <div className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight pt-2">
                      {activeTestimonial.stat}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {activeTestimonial.statLabel}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <p className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Features Utilized</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTestimonial.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 font-sans"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {testimonials.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all rounded-full cursor-pointer ${
                idx === currentIndex
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
