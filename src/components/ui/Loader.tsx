import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots';
  className?: string;
  center?: boolean;
}

export function Loader({ size = 'md', variant = 'spinner', className = '', center = false }: LoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  
  let sizeClasses = "w-6 h-6";
  if (size === 'sm') sizeClasses = "w-4 h-4";
  if (size === 'lg') sizeClasses = "w-8 h-8";

  const wrapperClasses = center ? "flex items-center justify-center w-full h-full p-4" : "";

  const renderSpinner = () => (
    <motion.div
      className={`${sizeClasses} border-2 border-white/20 border-t-[var(--color-primary)] rounded-full ${className}`}
      animate={shouldReduceMotion ? {} : { rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </motion.div>
  );

  const renderDots = () => {
    const dotClasses = size === 'sm' ? "w-1.5 h-1.5" : size === 'lg' ? "w-3 h-3" : "w-2 h-2";
    return (
      <div className={`flex gap-1.5 ${className}`} role="status" aria-label="Loading">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${dotClasses} rounded-full bg-[var(--color-primary)]`}
            animate={shouldReduceMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  };

  const content = variant === 'spinner' ? renderSpinner() : renderDots();

  if (center) {
    return <div className={wrapperClasses}>{content}</div>;
  }

  return content;
}
