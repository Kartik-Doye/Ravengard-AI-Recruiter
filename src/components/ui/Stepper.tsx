import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({ steps, currentStepIndex, orientation = 'horizontal', className = '' }: StepperProps) {
  const isVertical = orientation === 'vertical';
  
  return (
    <nav aria-label="Progress" className={className}>
      <ol role="list" className={`flex ${isVertical ? 'flex-col gap-6' : 'flex-row items-center justify-between w-full'}`}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          return (
            <li key={step.id} className={`relative ${isVertical ? '' : 'flex-1 flex flex-col items-center'}`}>
              {!isVertical && index !== steps.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-[2px] bg-white/10" aria-hidden="true">
                  <motion.div 
                    className="h-full bg-[var(--color-primary)]" 
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              )}
              
              <div 
                className={`flex ${isVertical ? 'items-start gap-4' : 'flex-col items-center gap-3 relative z-10'}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className={`
                  flex items-center justify-center rounded-full shrink-0
                  ${isVertical ? 'w-10 h-10' : 'w-8 h-8'} 
                  transition-colors duration-300
                  ${isCompleted ? 'bg-[var(--color-primary)] text-white' : 
                    isCurrent ? 'border-2 border-[var(--color-primary)] bg-black/40 text-[var(--color-primary)] shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 
                    'border border-white/20 bg-white/5 text-white/40'}
                `}>
                  {isCompleted ? (
                    <Check className={isVertical ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={3} />
                  ) : (
                    <span className={`font-semibold ${isVertical ? 'text-sm' : 'text-xs'}`}>{index + 1}</span>
                  )}
                </div>
                
                <div className={`flex flex-col ${isVertical ? 'mt-1' : 'items-center text-center'}`}>
                  <span className={`text-sm font-medium tracking-wide ${isCurrent ? 'text-white' : isCompleted ? 'text-white/80' : 'text-white/40'}`}>
                    {step.title}
                  </span>
                  {step.description && isVertical && (
                    <span className="text-xs text-white/50 mt-1 max-w-[200px]">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
              
              {isVertical && index !== steps.length - 1 && (
                <div className="absolute top-10 left-5 -ml-px w-[2px] h-full pb-6" aria-hidden="true">
                  <div className="h-full bg-white/10">
                    <motion.div 
                      className="w-full bg-[var(--color-primary)]" 
                      initial={{ height: '0%' }}
                      animate={{ height: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
