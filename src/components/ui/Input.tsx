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

    let stateClasses = 'border-white/10 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]';
    if (error) {
      stateClasses = 'border-[var(--color-error)]/50 focus:border-[var(--color-error)] focus:ring-[var(--color-error)]';
    } else if (success) {
      stateClasses = 'border-[var(--color-success)]/50 focus:border-[var(--color-success)] focus:ring-[var(--color-success)]';
    }

    const plClass = leftIcon ? 'pl-10' : 'pl-4';
    const prClass = rightIcon || isPassword || error || success ? 'pr-10' : 'pr-4';

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={inputId} className="text-xs font-mono tracking-widest text-white/70 uppercase">
          {label}
        </label>
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-white/40 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            type={currentType}
            disabled={disabled}
            className={`w-full bg-black/40 text-white rounded-md border focus:ring-1 outline-none transition-all py-2.5 text-sm shadow-inner disabled:opacity-50 disabled:cursor-not-allowed ${stateClasses} ${plClass} ${prClass}`}
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
