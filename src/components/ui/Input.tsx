import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      leftIcon,
      rightIcon,
      className = '',
      type = 'text',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || Math.random().toString(36).substring(2, 9);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    
    const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

    let stateClasses = 'border-slate-800 focus:border-white/40 focus:ring-white/20';
    if (error) {
      stateClasses = 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20';
    } else if (success) {
      stateClasses = 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20';
    }

    const plClass = leftIcon ? 'pl-10' : 'pl-4';
    const prClass = rightIcon || isPassword || error || success ? 'pr-10' : 'pr-4';

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={inputId} className="text-xs font-mono tracking-wider text-slate-300 uppercase">
          {label}
        </label>
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            type={currentType}
            disabled={disabled}
            className={`w-full bg-slate-900/60 text-slate-50 placeholder:text-slate-500 rounded-xl border focus:ring-1 outline-none transition-all py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${stateClasses} ${plClass} ${prClass}`}
            {...props}
          />

          <div className="absolute right-3 flex items-center justify-center gap-1">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/40 hover:text-white focus:outline-none p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            
            {error && !isPassword && <AlertCircle className="w-4 h-4 text-[var(--color-error)] pointer-events-none" />}
            {success && !isPassword && !error && <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] pointer-events-none" />}
            
            {rightIcon && !isPassword && !error && !success && (
              <div className="text-white/40 pointer-events-none">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {error && (
          <motion.span 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[var(--color-error)] tracking-wide mt-1"
          >
            {error}
          </motion.span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
