import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, ButtonProps } from './Button';

export interface BackButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'variant'> {
  label?: string;
  onClick: () => void;
}

export function BackButton({ label = 'Back', onClick, className = '', ...props }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<ArrowLeft className="w-4 h-4" />}
      onClick={onClick}
      className={`text-white/50 hover:text-white font-mono uppercase tracking-widest text-xs ${className}`}
      {...props}
    >
      {label}
    </Button>
  );
}
