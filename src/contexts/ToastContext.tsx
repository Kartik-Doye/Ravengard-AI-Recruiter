import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { transitions } from '../theme/motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onRemove }: { toast: ToastMessage, onRemove: () => void, key?: React.Key }) {
  let bgClass = "bg-[var(--color-bg-1)] border-white/10";
  let icon = <Info className="w-5 h-5 text-white/50" />;
  
  if (toast.type === 'success') {
    bgClass = "bg-[var(--color-bg-1)] border-[var(--color-success)]/30";
    icon = <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />;
  } else if (toast.type === 'error') {
    bgClass = "bg-[var(--color-bg-1)] border-[var(--color-error)]/30";
    icon = <AlertCircle className="w-5 h-5 text-[var(--color-error)]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={transitions.modalScale}
      className={`glass-panel px-4 py-3 rounded-lg flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border min-w-[300px] max-w-md ${bgClass}`}
    >
      <div className="shrink-0">{icon}</div>
      <p className="flex-1 text-sm text-white/90 font-medium tracking-wide">{toast.message}</p>
      <button 
        onClick={onRemove}
        className="text-white/40 hover:text-white transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
