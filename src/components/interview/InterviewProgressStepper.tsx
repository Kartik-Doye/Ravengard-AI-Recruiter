import React from 'react';
import { Check, Circle, Sparkles } from 'lucide-react';

export type InterviewStageKey = 'Introduction' | 'Technical' | 'Behavioral' | 'Conclusion';

export interface StageDefinition {
  key: InterviewStageKey;
  label: string;
  description: string;
  questionNumber: number;
}

export const INTERVIEW_STAGES: StageDefinition[] = [
  {
    key: 'Introduction',
    label: 'Introduction',
    description: 'Background & Orientation',
    questionNumber: 1,
  },
  {
    key: 'Technical',
    label: 'Technical',
    description: 'Core Engineering & Architecture',
    questionNumber: 2,
  },
  {
    key: 'Behavioral',
    label: 'Behavioral',
    description: 'Collaboration & Culture',
    questionNumber: 3,
  },
  {
    key: 'Conclusion',
    label: 'Conclusion',
    description: 'Synthesis & Final Remarks',
    questionNumber: 4,
  },
];

interface InterviewProgressStepperProps {
  currentStage?: InterviewStageKey;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  className?: string;
}

export const InterviewProgressStepper: React.FC<InterviewProgressStepperProps> = ({
  currentStage = 'Introduction',
  currentQuestionIndex = 1,
  totalQuestions = 4,
  className = '',
}) => {
  // Determine current active index from currentStage or currentQuestionIndex
  let activeIndex = INTERVIEW_STAGES.findIndex(s => s.key.toLowerCase() === currentStage.toLowerCase());
  if (activeIndex === -1) {
    activeIndex = Math.min(Math.max(0, currentQuestionIndex - 1), INTERVIEW_STAGES.length - 1);
  }

  const currentStageObj = INTERVIEW_STAGES[activeIndex] || INTERVIEW_STAGES[0];
  const progressPercent = Math.min(100, Math.round(((activeIndex) / (INTERVIEW_STAGES.length - 1)) * 100));

  return (
    <div
      className={`w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl ${className}`}
      role="region"
      aria-label="Interview Progress Tracker"
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
            Assessment In Progress
          </span>
          <span className="text-white/20">•</span>
          <span className="text-xs text-white/70 font-sans">
            Stage <span className="text-white font-mono font-medium">{activeIndex + 1}</span> of <span className="text-white font-mono">{INTERVIEW_STAGES.length}</span>: <strong className="text-white font-normal">{currentStageObj.label}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/50">
            Question <span className="text-amber-300 font-bold">{currentQuestionIndex}</span> / {totalQuestions}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {progressPercent}% Completed
          </span>
        </div>
      </div>

      {/* Linear Stepper Track */}
      <div className="relative pt-1 pb-2">
        {/* Background Track Bar */}
        <div className="absolute top-5 left-6 right-6 h-[2px] bg-white/10 -translate-y-1/2 z-0 hidden sm:block">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Nodes */}
        <ol className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 list-none p-0 m-0">
          {INTERVIEW_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isUpcoming = idx > activeIndex;

            return (
              <li
                key={stage.key}
                className="flex flex-col items-start sm:items-center text-left sm:text-center group"
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Node Pill / Circle */}
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                      : isCurrent
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/30 font-bold scale-110'
                      : 'bg-white/5 text-white/40 border border-white/15'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="font-mono text-xs text-black font-extrabold">{idx + 1}</span>
                  ) : (
                    <span className="font-mono text-xs text-white/40">{idx + 1}</span>
                  )}
                </div>

                {/* Stage Title */}
                <div className="mt-2 w-full">
                  <div className="flex items-center sm:justify-center gap-1.5">
                    <span
                      className={`text-xs font-medium tracking-wide uppercase font-mono ${
                        isCurrent
                          ? 'text-amber-300 font-bold'
                          : isCompleted
                          ? 'text-white/90'
                          : 'text-white/40'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow hidden sm:inline" />
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5 leading-snug line-clamp-1 hidden sm:block">
                    {stage.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
