import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    let variantClasses = '';
    
    switch (variant) {
      case 'primary':
        variantClasses = 'bg-[var(--color-primary)] text-white hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-[var(--color-primary)]/50';
        break;
      case 'secondary':
        variantClasses = 'bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)]';
        break;
      case 'tertiary':
        variantClasses = 'bg-transparent text-white/70 hover:text-white hover:bg-white/5 border border-transparent';
        break;
      case 'destructive':
        variantClasses = 'bg-[var(--color-error)]/20 text-[var(--color-error)] hover:bg-[var(--color-error)]/30 border border-[var(--color-error)]/30 shadow-[0_4px_15px_rgba(239,68,68,0.15)]';
        break;
    }

    let sizeClasses = '';
    switch (size) {
      case 'sm':
        sizeClasses = 'px-3 py-1.5 text-xs';
        break;
      case 'md':
        sizeClasses = 'px-5 py-2.5 text-sm';
        break;
      case 'lg':
        sizeClasses = 'px-8 py-3.5 text-base';
        break;
      case 'icon':
        sizeClasses = 'p-2.5';
        break;
    }

    const widthClass = fullWidth ? 'w-full flex justify-center' : 'inline-flex';
    const disabledClass = disabled || isLoading ? 'opacity-50 cursor-not-allowed saturate-50 pointer-events-none' : '';

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        className={`relative items-center gap-2 rounded-lg font-medium tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-0)] ${widthClass} ${variantClasses} ${sizeClasses} ${disabledClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        
        {children && <span className={size === 'icon' ? 'sr-only' : 'truncate'}>{children}</span>}
        
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
