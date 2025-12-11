import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

const founderFAQs = [
  {
    question: 'How much does it cost to list my startup?',
    answer: 'Nothing upfront. If you successfully raise capital through AngelVault, we charge 2% of the amount raised. No raise = no cost.',
  },
  {
    question: 'How long does admin vetting take?',
    answer: '3-5 business days. We review for completeness and quality, not gatekeeping.',
  },
  {
    question: 'What if investors steal my idea?',
    answer: 'Every investor signs an NDA before viewing sensitive materials. While no legal document eliminates risk entirely, NDAs provide recourse and deter casual IP theft.',
  },
  {
    question: 'Can I list if I\'m pre-revenue?',
    answer: 'Yes, if you have a working prototype or clear path to MVP. Pure concept-stage ideas are typically not ready for angel investment.',
  },
  {
    question: 'Do you take equity in my company?',
    answer: "No. We charge a success fee if you raise capital, but we don't take equity stakes.",
  },
];

const investorFAQs = [
  {
    question: 'What happens after I pay the $500 viewing fee?',
    answer: 'You can select 4 projects to unlock. Each unlocked project gives you full access to pitch materials, financials, and direct founder contact.',
  },
  {
    question: 'Can I pay to view more projects?',
    answer: "Yes. Each $500 fee unlocks 4 additional projects. There's no limit.",
  },
  {
    question: "What if I don't like any of the 4 I selected?",
    answer: 'The viewing fee is non-refundable—this is intentional. It encourages careful selection and ensures founders only hear from serious investors.',
  },
  {
    question: 'How are startups vetted?',
    answer: 'Admin team reviews every submission for: complete documentation, realistic financials, clear value proposition, and appropriate stage for angel investment. We reject ~40% of submissions.',
  },
  {
    question: 'What investment sizes are typical?',
    answer: "$25k to $200k per investor. Total round sizes range from $100k to $1M depending on the startup's stage and needs.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-navy-900 pr-4">{question}</span>
        <span className="flex-shrink-0">
          {isOpen ? (
            <Minus className="w-5 h-5 text-primary-600" />
          ) : (
            <Plus className="w-5 h-5 text-gray-400" />
          )}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openFounder, setOpenFounder] = useState<number | null>(null);
  const [openInvestor, setOpenInvestor] = useState<number | null>(null);

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
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Founder FAQs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm">
                F
              </span>
              For Founders
            </h3>
            <div className="bg-gray-50 rounded-2xl px-6">
              {founderFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFounder === index}
                  onClick={() => setOpenFounder(openFounder === index ? null : index)}
                />
              ))}
            </div>
          </motion.div>

          {/* Investor FAQs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="font-display text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gold/20 text-gold-dark flex items-center justify-center text-sm">
                I
              </span>
              For Investors
            </h3>
            <div className="bg-gray-50 rounded-2xl px-6">
              {investorFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openInvestor === index}
                  onClick={() => setOpenInvestor(openInvestor === index ? null : index)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
