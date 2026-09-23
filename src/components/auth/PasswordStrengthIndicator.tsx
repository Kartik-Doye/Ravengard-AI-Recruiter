import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  percentage: number; // 0 to 100
  label: string;
  color: string;
  barColor: string;
  textColor: string;
  borderColor: string;
  criteria: PasswordCriteria;
  isValid: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const passedCount = Object.values(criteria).filter(Boolean).length;

  let score = 0;
  let label = 'Very Weak';
  let color = 'text-red-400';
  let barColor = 'bg-red-500';
  let textColor = 'text-red-400';
  let borderColor = 'border-red-500/30';

  if (!password) {
    score = 0;
    label = 'Enter Password';
    color = 'text-white/40';
    barColor = 'bg-white/10';
    textColor = 'text-white/40';
    borderColor = 'border-white/10';
  } else if (passedCount <= 1 || password.length < 6) {
    score = 1;
    label = 'Weak';
    color = 'text-red-400';
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
    borderColor = 'border-red-500/30';
  } else if (passedCount === 2 || passedCount === 3) {
    score = 2;
    label = 'Fair';
    color = 'text-amber-400';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
  } else if (passedCount === 4) {
    score = 3;
    label = 'Strong';
    color = 'text-emerald-400';
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
    borderColor = 'border-emerald-500/30';
  } else {
    score = 4;
    label = 'Very Strong';
    color = 'text-cyan-400';
    barColor = 'bg-gradient-to-r from-emerald-400 to-cyan-400';
    textColor = 'text-cyan-400';
    borderColor = 'border-cyan-500/30';
  }

  const percentage = password ? Math.min(100, Math.round((passedCount / 5) * 100)) : 0;
  const isValid = criteria.minLength && passedCount >= 3;

  return {
    score,
    percentage,
    label,
    color,
    barColor,
    textColor,
    borderColor,
    criteria,
    isValid,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirementsList?: boolean;
  compact?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirementsList = true,
  compact = false,
}) => {
  const result = evaluatePasswordStrength(password);

  if (!password && compact) {
    return null;
  }

  const requirements = [
    { label: 'At least 8 characters', met: result.criteria.minLength },
    { label: 'One uppercase letter (A-Z)', met: result.criteria.hasUppercase },
    { label: 'One lowercase letter (a-z)', met: result.criteria.hasLowercase },
    { label: 'One number (0-9)', met: result.criteria.hasNumber },
    { label: 'One special symbol (!@#$%^&*)', met: result.criteria.hasSpecial },
  ];

  return (
    <div className="space-y-2.5 pt-1.5 animate-fadeIn font-sans text-xs">
      {/* Strength Bar & Rating */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center gap-1.5">
            {result.score >= 3 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            Password Strength:
          </span>
          <span className={`text-[11px] font-mono font-semibold ${result.textColor}`}>
            {result.label} {password && `(${result.percentage}%)`}
          </span>
        </div>

        {/* 4-Segment Visual Meter */}
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((level) => {
            const isFilled = result.score >= level;
            return (
              <div
                key={level}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled ? result.barColor : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Real-Time Requirement Checklist */}
      {showRequirementsList && (
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">
            Security Requirements
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
            {requirements.map((req, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
                  req.met ? 'text-emerald-400' : 'text-white/40'
                }`}
              >
                {req.met ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 shrink-0 rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white/30" />
                  </div>
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
