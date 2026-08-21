import React from 'react';
import { motion } from 'motion/react';

export default function AssessmentGuide() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-display mb-8">Assessment Guide.</h1>
        <p className="text-white/50 text-lg leading-relaxed mb-6">
          Every candidate is scored across three normalized dimensions: Technical Depth, Communication, and Reasoning. Our JSON-structured rubrics ensure that feedback is deterministic and reproducible.
        </p>
      </motion.div>
    </div>
  );
}
