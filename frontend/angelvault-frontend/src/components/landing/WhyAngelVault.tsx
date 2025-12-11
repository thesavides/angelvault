import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ShieldCheck, Zap, Globe } from 'lucide-react';

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Commitment Signals',
    description: "Investors pay to view. Founders undergo vetting. NDAs protect IP. Everyone proves they're serious before engagement begins.",
    result: 'The result: No ghosting. No time-wasters. Just productive conversations between committed parties.',
  },
  {
    icon: Zap,
    title: 'Speed Meets Diligence',
    description: 'Traditional angel rounds take 4-6 months. AngelVault streamlines from first view to term sheet in weeks, not quarters.',
    result: 'The difference: All materials in one place. Standardized SAFE notes. Clear investment parameters. No coordination overhead.',
  },
  {
    icon: Globe,
    title: 'African Market, Global Standards',
    description: 'Built by operators who understand African startup ecosystems while applying international regulatory frameworks.',
    result: 'The credibility: Founded by former DNB-supervised entity director. SAFE notes based on proven frameworks. POPIA-compliant infrastructure.',
  },
];

export function WhyAngelVault() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section bg-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-4">
            Why <span className="gradient-text">AngelVault</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300" />
              <div className="relative p-8 rounded-2xl border border-gray-100 hover:border-primary-200 transition-colors duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 mb-4">{benefit.description}</p>
                <p className="text-sm text-primary-700 font-medium">{benefit.result}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyAngelVault;
