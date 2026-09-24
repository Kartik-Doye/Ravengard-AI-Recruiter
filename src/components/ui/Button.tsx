import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "type"> {
  variant?: 'solid' | 'primary' | 'ghost' | 'secondary' | 'outline';
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      href,
      onClick,
      variant = 'solid',
      className = '',
      type = 'button',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const base = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer';

    const styles: Record<string, string> = {
      solid: 'bg-white text-slate-950 hover:bg-slate-100 shadow-sm active:bg-slate-200',
      primary: 'bg-white text-slate-950 hover:bg-slate-100 shadow-sm active:bg-slate-200',
      ghost: 'border border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80 hover:text-white hover:border-slate-600 backdrop-blur-sm shadow-sm',
      secondary: 'border border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80 hover:text-white hover:border-slate-600 backdrop-blur-sm shadow-sm',
      outline: 'border border-slate-700/80 bg-slate-900/40 text-slate-200 hover:bg-slate-800/80 hover:text-white hover:border-slate-600 backdrop-blur-sm shadow-sm',
    };

    const variantClass = styles[variant] || styles.solid;

    const motionProps = {
      whileHover: !disabled && !isLoading ? { y: -2, scale: 1.01 } : {},
      whileTap: !disabled && !isLoading ? { scale: 0.98 } : {},
      transition: { duration: 0.18, ease: 'easeOut' as any },
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const disabledClass = disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
    
    const content = (
      <>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0 mr-2" />}
        {!isLoading && leftIcon && <span className="shrink-0 mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0 ml-2">{rightIcon}</span>}
      </>
    );

    if (href) {
      return (
        <motion.div {...motionProps} className={`${widthClass} ${disabledClass} ${className}`}>
          <Link ref={ref as React.Ref<HTMLAnchorElement>} to={href} className={`${base} ${variantClass} w-full`} onClick={onClick as any}>
            {content}
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        onClick={onClick as any}
        disabled={disabled || isLoading}
        {...motionProps}
        {...props}
        className={`${base} ${variantClass} ${widthClass} ${disabledClass} ${className}`}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
