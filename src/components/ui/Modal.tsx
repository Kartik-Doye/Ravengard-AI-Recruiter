import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { transitions, variants } from '../../theme/motion';
import { Card, CardBody } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  preventClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', preventClose = false }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !preventClose) {
          onClose();
        }
        
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      // Auto-focus first element slightly after mount
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose, preventClose]);

  let sizeClass = 'max-w-md';
  switch (size) {
    case 'sm': sizeClass = 'max-w-sm'; break;
    case 'md': sizeClass = 'max-w-md'; break;
    case 'lg': sizeClass = 'max-w-lg'; break;
    case 'xl': sizeClass = 'max-w-2xl'; break;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.smoothFade}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => !preventClose && onClose()}
            aria-hidden="true"
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              tabIndex={-1}
              variants={variants.modalScaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transitions.modalScale}
              className={`w-full ${sizeClass} pointer-events-auto outline-none`}
            >
              <Card className="overflow-hidden border-[var(--color-primary)]/20 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] opacity-50" />
                
                <CardBody className="p-6">
                  {title && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 id="modal-title" className="text-xl font-medium tracking-wide text-white">{title}</h3>
                      {!preventClose && (
                        <button 
                          onClick={onClose}
                          className="text-white/50 hover:text-white transition-colors p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                          aria-label="Close dialog"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="text-white/80 font-light leading-relaxed">
                    {children}
                  </div>
                  
                  {footer && (
                    <div className="mt-8 flex justify-end gap-3">
                      {footer}
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
