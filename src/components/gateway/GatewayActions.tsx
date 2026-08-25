import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { SmoothLoader } from '../ui/SmoothLoader';

export function GatewayActions() {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-10 md:p-16 rounded-[2.5rem] flex flex-col items-center border border-white/10"
        >
          <div className="w-24 h-24 relative mb-12 flex items-center justify-center">
            <SmoothLoader />
          </div>

          <h2 className="text-2xl font-medium mb-8 text-white">System is ready.</h2>
          
          <div className="w-full space-y-4">
            <Button
              variant="solid"
              fullWidth
              className="py-5"
              onClick={() => navigate('/interview')}
              rightIcon={<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            >
              Initialize Engine
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              className="py-5"
              onClick={() => navigate('/assessment-guide')}
            >
              Read the Guide First
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
