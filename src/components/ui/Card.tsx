import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      hover = true,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -4, scale: 1.005 } : undefined}
        transition={{ duration: 0.2, ease: "easeOut" as any }}
        className={`rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl shadow-xl text-slate-50 ${className}`}
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
  return <div className={`mt-6 pt-6 border-t border-slate-800/80 flex items-center ${className}`}>{children}</div>;
}
