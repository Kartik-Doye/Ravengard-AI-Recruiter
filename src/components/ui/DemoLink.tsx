import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

export interface DemoLinkProps extends Omit<LinkProps, 'to'> {
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'mobile' | 'custom';
  children?: React.ReactNode;
  className?: string;
}

/**
 * Standardized reusable DemoLink component in src/components/ui/DemoLink.tsx
 * Routes to '/contact' by default and standardizes CTA presentation across the application.
 */
export function DemoLink({
  to = '/contact',
  variant = 'primary',
  children = 'Book a Demo',
  className = '',
  ...props
}: DemoLinkProps) {
  let baseStyles = '';

  switch (variant) {
    case 'primary':
      baseStyles = 'inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors shadow-sm';
      break;
    case 'outline':
    case 'secondary':
      baseStyles = 'inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm';
      break;
    case 'mobile':
      baseStyles = 'block rounded-2xl bg-white px-5 py-4 text-base font-semibold text-center text-zinc-950 hover:bg-zinc-100 transition-colors';
      break;
    case 'custom':
    default:
      baseStyles = '';
      break;
  }

  const combinedClassName = className ? `${baseStyles} ${className}`.trim() : baseStyles;

  return (
    <Link to={to} className={combinedClassName} {...props}>
      {children}
    </Link>
  );
}

export default DemoLink;
