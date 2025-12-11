import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { XCircle, Clock, Ghost, FileQuestion, Filter, Copy, MessageSquareOff, Scale } from 'lucide-react';

const founderPains = [
  {
    icon: Ghost,
    text: "Endless pitching to investors who ghost after 'I'll think about it'",
  },
  {
    icon: FileQuestion,
    text: 'Giving away IP before knowing if investors are serious',
  },
  {
    icon: Clock,
    text: 'Months of back-and-forth for a $50k check',
  },
  {
    icon: Scale,
    text: 'Navigating term sheets without legal support',
  },
];

const investorPains = [
  {
    icon: Filter,
    text: 'Wading through unprepared founders with half-baked ideas',
  },
  {
    icon: MessageSquareOff,
    text: 'No way to filter signal from noise',
  },
  {
    icon: Copy,
    text: 'Seeing the same pitch deck in three different formats',
  },
  {
    icon: Clock,
    text: 'Complex negotiation processes that drag on',
  },
];

export function Problem() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section-dark relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-wide relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            The Traditional Angel Process Is{' '}
            <span className="text-red-400">Broken</span>
          </h2>
        </motion.div>

        {/* Two column layout */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Founders' Pain */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Founders' Pain</h3>
            </div>
            <ul className="space-y-4">
              {founderPains.map((pain, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <pain.icon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{pain.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Investors' Pain */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Investors' Pain</h3>
            </div>
            <ul className="space-y-4">
              {investorPains.map((pain, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <pain.icon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{pain.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-xl lg:text-2xl text-white">
            AngelVault fixes this with one principle:{' '}
            <span className="font-bold text-primary-400">commitment before engagement.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default Problem;
