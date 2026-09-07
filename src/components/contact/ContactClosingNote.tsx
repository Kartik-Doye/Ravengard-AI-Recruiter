import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, MessageSquare } from 'lucide-react';

export function ContactClosingNote() {
  return (
    <section className="py-24 px-6 border-t border-white/5 bg-[var(--color-bg-1)]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center p-8 glass-panel rounded-3xl"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Mail className="w-5 h-5 text-white/70" />
          </div>
          <h3 className="text-lg font-medium mb-2">Email</h3>
          <p className="text-sm text-white/50">
            <a href="mailto:doyekartik03@gmail.com" className="hover:text-white transition-colors">doyekartik03@gmail.com</a>
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center text-center p-8 glass-panel rounded-3xl"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <MapPin className="w-5 h-5 text-white/70" />
          </div>
          <h3 className="text-lg font-medium mb-2">Location</h3>
          <p className="text-sm text-white/50">Maharashtra, India</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center text-center p-8 glass-panel rounded-3xl"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <MessageSquare className="w-5 h-5 text-white/70" />
          </div>
          <h3 className="text-lg font-medium mb-2">Connect</h3>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <a href="https://www.linkedin.com/in/kartik-doye-164722258/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="https://github.com/Kartik-Doye" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
