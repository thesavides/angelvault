import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileText, Lock, CheckSquare, Shield } from 'lucide-react';

const trustIndicators = [
  {
    icon: FileText,
    title: 'Regulatory Expertise',
    description: 'Built by former Managing Director of a DNB-supervised payments entity. We understand compliance.',
  },
  {
    icon: Lock,
    title: 'NDA Protection',
    description: 'Every project requires signed NDA before viewing sensitive materials. Enforced, not optional.',
  },
  {
    icon: CheckSquare,
    title: 'Admin Vetting',
    description: 'Every startup is reviewed for completeness, clarity, and appropriate stage before going live.',
  },
  {
    icon: Shield,
    title: 'POPIA Compliant',
    description: 'Your data is protected under South African data protection laws. Secure infrastructure. Encrypted storage.',
  },
];

export function Trust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section bg-gray-50">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-4">
            Trust & Credibility
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built on a foundation of regulatory expertise and commitment to protecting all parties.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustIndicators.map((indicator, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                <indicator.icon className="w-6 h-6 text-gold-dark" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                {indicator.title}
              </h3>
              <p className="text-gray-600 text-sm">{indicator.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Trust;
