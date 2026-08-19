import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from '../../theme/motion';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion();
  const baseClasses = "bg-white/5 relative overflow-hidden";
  
  let variantClasses = "";
  if (variant === 'text') {
    variantClasses = "rounded h-4 w-full";
  } else if (variant === 'circular') {
    variantClasses = "rounded-full";
  } else if (variant === 'rectangular') {
    variantClasses = "rounded-md";
  }

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`} 
      style={style}
    >
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ translateX: ["-100%", "200%"] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear",
            repeatDelay: 0.2
          }}
        />
      )}
    </div>
  );
}
