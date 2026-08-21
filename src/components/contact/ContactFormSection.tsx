import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../ui/Button';

export function ContactFormSection() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus('submitting');
    // Simulate network delay
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (custom: number) => ({
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, delay: custom * 0.1, ease: 'easeOut' }
    })
  };

  if (status === 'success') {
    return (
      <div className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          className="glass-panel max-w-lg mx-auto p-12 rounded-3xl border border-white/10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <h3 className="text-3xl font-display font-medium mb-4 text-white">Message Received</h3>
          <p className="text-white/60 mb-8 leading-relaxed">Thank you for reaching out. Our team will review your inquiry and connect with you shortly.</p>
          <Button 
            variant="secondary"
            onClick={() => setStatus('idle')}
            className="px-6 py-3"
          >
            Send another message
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.form
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="space-y-6 glass-panel p-8 md:p-10 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            <motion.div variants={inputVariants} custom={1} className="space-y-2">
              <UiverseInputGroup>
                <input
                  id="name"
                  required
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder=" "
                />
                <label htmlFor="name">Name</label>
                <span className="bottom-line"></span>
              </UiverseInputGroup>
            </motion.div>
            <motion.div variants={inputVariants} custom={2} className="space-y-2">
              <UiverseInputGroup>
                <input
                  id="email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                />
                <label htmlFor="email">Email</label>
                <span className="bottom-line"></span>
              </UiverseInputGroup>
            </motion.div>
          </div>
          
          <motion.div variants={inputVariants} custom={3} className="space-y-2 relative z-10">
            <UiverseInputGroup>
              <input
                id="subject"
                required
                type="text"
                value={formData.subject}
                onChange={handleChange}
                placeholder=" "
              />
              <label htmlFor="subject">Subject</label>
              <span className="bottom-line"></span>
            </UiverseInputGroup>
          </motion.div>

          <motion.div variants={inputVariants} custom={4} className="space-y-2 relative z-10">
            <UiverseInputGroup>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder=" "
                className="resize-none"
              />
              <label htmlFor="message">Message</label>
              <span className="bottom-line"></span>
            </UiverseInputGroup>
          </motion.div>

          <motion.div variants={inputVariants} custom={5} className="pt-4 relative z-10">
            <Button
              type="submit"
              variant="primary"
              isLoading={status === 'submitting'}
              rightIcon={!status ? <ChevronRight className="w-4 h-4" /> : null}
              fullWidth
              className="py-4 text-base"
            >
              {status === 'submitting' ? 'Transmitting...' : 'Send Message'}
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </section>
  );
}

const UiverseInputGroup = styled.div`
  position: relative;
  width: 100%;

  input, textarea {
    width: 100%;
    padding: 1.5rem 1rem 0.5rem 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: white;
    outline: none;
    transition: all 0.3s ease;

    &:focus {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  label {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
    pointer-events: none;
    font-size: 0.9rem;
  }

  textarea ~ label {
    top: 1.5rem;
  }

  input:focus ~ label,
  input:not(:placeholder-shown) ~ label,
  textarea:focus ~ label,
  textarea:not(:placeholder-shown) ~ label {
    top: 0.5rem;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .bottom-line {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: white;
    transition: width 0.3s ease;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }

  input:focus ~ .bottom-line,
  textarea:focus ~ .bottom-line {
    width: 100%;
  }
`;
