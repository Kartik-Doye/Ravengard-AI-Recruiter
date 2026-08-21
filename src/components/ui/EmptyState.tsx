import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Inbox } from 'lucide-react';
import { Card, CardBody } from './Card';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon = <Inbox className="w-12 h-12 text-white/20" />, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <Card variant="base" padding="lg" className={`w-full text-center ${className}`}>
      <CardBody className="flex flex-col items-center justify-center py-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 bg-white/5 p-6 rounded-full"
          aria-hidden="true"
        >
          {icon}
        </motion.div>
        
        <h3 className="text-xl font-medium tracking-wide text-white mb-3">
          {title}
        </h3>
        
        <p className="text-white/50 max-w-sm mb-8 leading-relaxed">
          {description}
        </p>
        
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
