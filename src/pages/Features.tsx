import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Shield, Search } from 'lucide-react';

export default function Features() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-display mb-16">The Engine.</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: "Deep Parsing", desc: "Asynchronous resume vectorization maps your skills to our rubrics." },
            { icon: Shield, title: "Zero-Tolerance", desc: "O(1) strike counters and visibility tracking ensure complete integrity." },
            { icon: Cpu, title: "Dynamic Rounds", desc: "LLM-driven technical drill-downs based on real-time candidate responses." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }}
              className="glass-panel p-8 rounded-2xl hover:scale-[1.02] transition-transform duration-300"
            >
              <feature.icon className="w-8 h-8 text-white/40 mb-6" />
              <h3 className="font-display text-xl mb-3">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
