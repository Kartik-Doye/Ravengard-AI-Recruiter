import React, { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: 'base' | 'interactive' | 'elevated' | 'summary';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      variant = 'base',
      padding = 'md',
      onClick,
      ...props
    },
    ref
  ) => {
    let variantClasses = '';
    switch (variant) {
      case 'base':
        variantClasses = 'glass-panel border-white/5';
        break;
      case 'interactive':
        variantClasses = 'glass-panel border-white/5 hover:border-[var(--color-primary)]/30 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] cursor-pointer transition-all duration-300';
        break;
      case 'elevated':
        variantClasses = 'glass-panel border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)]';
        break;
      case 'summary':
        variantClasses = 'bg-black/40 border border-white/5 shadow-inner';
        break;
    }

    let paddingClasses = '';
    switch (padding) {
      case 'none': paddingClasses = 'p-0'; break;
      case 'sm': paddingClasses = 'p-4'; break;
      case 'md': paddingClasses = 'p-6 sm:p-8'; break;
      case 'lg': paddingClasses = 'p-8 sm:p-12'; break;
    }

    const interactiveProps = onClick || variant === 'interactive' ? {
      whileHover: { y: -2 },
      whileTap: { scale: 0.98 },
      onClick
    } : {};

    return (
      <motion.div
        ref={ref}
        className={`rounded-xl ${variantClasses} ${paddingClasses} ${className}`}
        {...interactiveProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex-1 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`mt-6 pt-6 border-t border-white/5 flex items-center ${className}`}>{children}</div>;
}
