import React, { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  size?: 'compact' | 'regular';
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'regular', icon, className = '' }: BadgeProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap transition-colors border";
  
  const sizeClasses = size === 'compact' 
    ? "text-[10px] px-2 py-0.5 min-w-[20px]" 
    : "text-xs px-2.5 py-1 min-w-[24px]";

  let variantClasses = "";
  switch (variant) {
    case 'neutral':
      variantClasses = "bg-white/10 text-white/90 border-white/10";
      break;
    case 'success':
      variantClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case 'warning':
      variantClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case 'error':
      variantClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
      break;
    case 'info':
      variantClasses = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      break;
  }

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {icon && <span className="mr-1.5 -ml-0.5 flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
