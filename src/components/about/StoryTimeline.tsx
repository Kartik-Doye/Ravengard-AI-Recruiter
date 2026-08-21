import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function StoryTimeline() {
  const entries = [
    {
      year: "The Problem",
      label: "Interviews are broken",
      description: "Traditional interviews are plagued by bias, subjective grading, and a lack of standardized telemetry, leading to poor hiring signals."
    },
    {
      year: "The Vision",
      label: "Deterministic Evaluation",
      description: "We set out to build an engine that evaluates problem-solving depth over memorization, anchored by a strict state-machine."
    },
    {
      year: "The Execution",
      label: "Ravengard AI",
      description: "A platform with zero-tolerance anti-cheat, dynamic LLM drill-downs, and structured output formatting for transparent scoring."
    }
  ];

  return (
    <section className="py-32 px-6 relative bg-[var(--color-bg-1)] border-y border-white/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-medium">The Evolution.</h2>
        </motion.div>

        <div className="space-y-0 relative">
          {entries.map((entry, idx) => (
            <TimelineNode 
              key={idx} 
              entry={entry} 
              isLast={idx === entries.length - 1} 
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const TimelineNode: React.FC<{ entry: any; isLast: boolean; index: number }> = ({ entry, isLast, index }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "center center"]
  });

  // Animate the line connecting nodes
  const lineScale = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const nodeOpacity = useTransform(scrollYProgress, [0.5, 1], [0.2, 1]);
  const nodeScale = useTransform(scrollYProgress, [0.5, 1], [0.8, 1]);

  return (
    <div ref={ref} className="flex flex-col md:flex-row gap-8 md:gap-16 relative">
      {/* Left Axis: Year/Label */}
      <div className="md:w-1/4 pt-2">
        <motion.span 
          style={{ opacity: nodeOpacity }}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50 block sticky top-32"
        >
          {entry.year}
        </motion.span>
      </div>

      {/* Right Axis: Content & Line */}
      <div className="md:w-3/4 pb-20 relative">
        {/* The Track (Background) */}
        {!isLast && (
          <div className="absolute left-[-2rem] md:left-[-2rem] top-8 bottom-0 w-[1px] bg-white/5 hidden md:block" />
        )}
        
        {/* The Fill (Active scroll state) */}
        {!isLast && (
          <motion.div 
            style={{ height: lineScale }}
            className="absolute left-[-2rem] md:left-[-2rem] top-8 w-[1px] bg-gradient-to-b from-white/40 to-transparent hidden md:block origin-top" 
          />
        )}
        
        {/* The Node */}
        <motion.div 
          style={{ scale: nodeScale, opacity: nodeOpacity }}
          className="absolute -left-[2.25rem] md:-left-[2.25rem] top-2 w-3 h-3 rounded-full border-2 border-[var(--color-bg-1)] bg-white hidden md:block shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h3 className="text-3xl font-display font-medium mb-6">{entry.label}</h3>
          <p className="text-white/60 leading-relaxed text-lg sm:text-xl font-light">
            {entry.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
