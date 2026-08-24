import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from './Skeleton';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function OptimizedImage({ src, alt, className, fallbackSrc = '/placeholder.webp', ...props }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // In a real app, you might map this to a CDN URL builder if src is a raw ID.
  const finalSrc = hasError ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <Skeleton className="w-full h-full rounded-none" variant="rectangular" />
          </motion.div>
        )}
      </AnimatePresence>
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
        {...props}
      />
    </div>
  );
}
