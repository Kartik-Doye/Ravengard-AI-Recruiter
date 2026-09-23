import React from 'react';
import { CheckCircle2, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  noCommonSequences: boolean;
  noContextualData: boolean;
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
  feedback: string[];
  isValid: boolean;
}

/**
 * Common weak sequential and keyboard patterns
 */
const WEAK_PATTERNS = [
  /123456/i,
  /password/i,
  /qwerty/i,
  /asdfgh/i,
  /abc123/i,
  /admin123/i,
  /(.)\1{3,}/, // 4 or more repetitive characters like "aaaa"
];

/**
 * Developer Specification: Entropy, character variety, and contextual input scoring
 */
export function getPasswordStrength(
  password: string,
  userInputs: string[] = []
): { score: number; feedback: string[] } {
  if (!password) {
    return { score: 0, feedback: ["Password is required."] };
  }

  let score = 0;
  const feedback: string[] = [];

  // 1. Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // 2. Character Variety
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  // 3. Sequence / Pattern checks
  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push("Avoid common keyboard patterns, sequences, or repeating characters.");
      break;
    }
  }

  // 4. Check for common contextual inputs (name/email prefix)
  userInputs.forEach((input) => {
    if (input && input.trim().length >= 3 && password.toLowerCase().includes(input.toLowerCase().trim())) {
      score = Math.max(0, score - 2);
      feedback.push("Password shouldn't contain personal details like name or email.");
    }
  });

  return { score: Math.min(score, 4), feedback };
}

export function evaluatePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordStrengthResult {
  const { score: computedScore, feedback } = getPasswordStrength(password, userInputs);

  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    noCommonSequences: !WEAK_PATTERNS.some((p) => p.test(password)),
    noContextualData: !userInputs.some(
      (inp) => inp && inp.trim().length >= 3 && password.toLowerCase().includes(inp.toLowerCase().trim())
    ),
  };

  let label = 'Very Weak';
  let color = 'text-red-400';
  let barColor = 'bg-red-500';
  let textColor = 'text-red-400';
  let borderColor = 'border-red-500/30';

  if (!password) {
    label = 'Enter Password';
    color = 'text-white/40';
    barColor = 'bg-white/10';
    textColor = 'text-white/40';
    borderColor = 'border-white/10';
  } else if (computedScore <= 1 || password.length < 8) {
    label = 'Weak';
    color = 'text-red-400';
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
    borderColor = 'border-red-500/30';
  } else if (computedScore === 2) {
    label = 'Fair';
    color = 'text-amber-400';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
  } else if (computedScore === 3) {
    label = 'Strong';
    color = 'text-emerald-400';
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
    borderColor = 'border-emerald-500/30';
  } else {
    label = 'Very Strong';
    color = 'text-cyan-400';
    barColor = 'bg-gradient-to-r from-emerald-400 to-cyan-400';
    textColor = 'text-cyan-400';
    borderColor = 'border-cyan-500/30';
  }

  const percentage = password ? Math.min(100, Math.round((computedScore / 4) * 100)) : 0;
  // Gatekeeper: Requires minimum Score 3 (Strong) and min length 8
  const isValid = computedScore >= 3 && criteria.minLength;

  return {
    score: computedScore,
    percentage,
    label,
    color,
    barColor,
    textColor,
    borderColor,
    criteria,
    feedback,
    isValid,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  userInputs?: string[];
  showRequirementsList?: boolean;
  compact?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  userInputs = [],
  showRequirementsList = true,
  compact = false,
}) => {
  const result = evaluatePasswordStrength(password, userInputs);

  if (!password && compact) {
    return null;
  }

  const requirements = [
    { label: 'At least 8 characters', met: result.criteria.minLength },
    { label: 'Uppercase & Lowercase (A-Z, a-z)', met: result.criteria.hasUppercase && result.criteria.hasLowercase },
    { label: 'One number (0-9)', met: result.criteria.hasNumber },
    { label: 'Special symbol (!@#$%^&*)', met: result.criteria.hasSpecial },
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

      {/* Contextual Warning / Feedback if flagged */}
      {result.feedback.length > 0 && password && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-300 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {result.feedback.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        </div>
      )}

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
