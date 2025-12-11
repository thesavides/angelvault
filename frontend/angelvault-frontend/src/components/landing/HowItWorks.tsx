import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  CheckCircle, 
  Eye, 
  FileText, 
  Handshake,
  Search,
  CreditCard,
  FileSignature,
  Send,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';

const founderSteps = [
  {
    number: '01',
    icon: Upload,
    title: 'Submit Your Startup',
    description: 'Upload your pitch deck, financial projections, product demos, and key metrics. Tell your story once, properly.',
    details: [
      'Executive summary (1-page)',
      'Pitch deck (max 15 slides)',
      'Financial model',
      'Product screenshots/demo video',
      'Investment terms & minimum check size',
    ],
  },
  {
    number: '02',
    icon: CheckCircle,
    title: 'Admin Vetting',
    description: "Our team reviews every submission for completeness, clarity, and market fit. We're protecting both sides of the marketplace.",
    details: [
      'Clear value proposition',
      'Defined market opportunity',
      'Realistic financial projections',
      'Appropriate stage for angel investment',
    ],
  },
  {
    number: '03',
    icon: Eye,
    title: 'Go Live to Investors',
    description: "Once approved, your project appears in our marketplace. Investors who pay to view are serious—they've already committed $500 to evaluate opportunities.",
    details: [],
  },
  {
    number: '04',
    icon: FileText,
    title: 'Review Offers',
    description: 'Receive angel investment offers with clear terms. Compare multiple offers. Ask questions. Negotiate directly on platform.',
    details: [],
  },
  {
    number: '05',
    icon: Handshake,
    title: 'Execute SAFE Notes',
    description: 'Accept an offer and execute a standardized SAFE note through our platform. Legal framework handled. Capital flows.',
    details: [],
  },
];

const investorSteps = [
  {
    number: '01',
    icon: Search,
    title: 'Browse Curated Opportunities',
    description: 'Filter by category, funding stage, minimum investment, and sector. Every listing has been admin-vetted.',
    details: [
      'FinTech & Payments',
      'SaaS & Enterprise Software',
      'Consumer Tech & Marketplaces',
      'HealthTech & Wellness',
      'Other emerging sectors',
    ],
  },
  {
    number: '02',
    icon: CreditCard,
    title: 'Pay to View',
    description: "$500 unlocks detailed access to 4 complete project listings. This isn't a revenue model—it's a commitment filter. Only serious investors proceed.",
    details: [
      'Full pitch deck',
      'Financial projections & unit economics',
      'Product demos & screenshots',
      'Founder background',
      'Investment terms & cap table',
    ],
  },
  {
    number: '03',
    icon: FileSignature,
    title: 'Sign NDAs, Review Materials',
    description: 'Each project requires NDA signature before viewing sensitive information. We protect founder IP while enabling proper due diligence.',
    details: [],
  },
  {
    number: '04',
    icon: Send,
    title: 'Submit Offers',
    description: 'Found a strong opportunity? Submit an investment offer with your proposed terms. Founders can accept, counter, or discuss.',
    details: [],
  },
  {
    number: '05',
    icon: Handshake,
    title: 'Execute SAFE Notes',
    description: 'Once terms are agreed, execute a standardized SAFE note through the platform. Post-money, valuation cap, discount—all handled digitally.',
    details: [],
  },
];

interface StepCardProps {
  step: typeof founderSteps[0];
  index: number;
  isInView: boolean;
  side: 'left' | 'right';
}

function StepCard({ step, index, isInView, side }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      className="relative"
    >
      {/* Step number */}
      <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gradient-primary text-white text-sm font-bold flex items-center justify-center">
        {index + 1}
      </div>
      
      <div className="pl-8">
        <div className="flex items-center gap-3 mb-2">
          <step.icon className="w-5 h-5 text-primary-600" />
          <h4 className="font-semibold text-lg text-navy-900">{step.title}</h4>
        </div>
        <p className="text-gray-600 mb-3">{step.description}</p>
        {step.details.length > 0 && (
          <ul className="space-y-1">
            {step.details.map((detail, i) => (
              <li key={i} className="text-sm text-gray-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section bg-gray-50">
      <div className="container-wide">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-4">
            Built for Efficiency, Protected by Process
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A streamlined process that respects everyone's time while ensuring serious commitment from both sides.
          </p>
        </motion.div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* For Founders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 lg:p-10 shadow-lg"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              Raising Capital
            </div>

            <h3 className="font-display text-2xl font-bold text-navy-900 mb-8">
              For Founders
            </h3>

            {/* Steps */}
            <div className="space-y-6">
              {founderSteps.map((step, index) => (
                <StepCard
                  key={index}
                  step={step}
                  index={index}
                  isInView={isInView}
                  side="left"
                />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link to="/signup?type=developer">
                <Button fullWidth rightIcon={<ArrowRight className="w-5 h-5" />}>
                  List Your Startup
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* For Investors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-navy-900 rounded-3xl p-8 lg:p-10 shadow-lg"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gold/20 text-gold text-sm font-medium mb-6">
              Deploying Capital
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-8">
              For Investors
            </h3>

            {/* Steps */}
            <div className="space-y-6">
              {investorSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  {/* Step number */}
                  <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gold text-navy-900 text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  
                  <div className="pl-8">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-5 h-5 text-primary-400" />
                      <h4 className="font-semibold text-lg text-white">{step.title}</h4>
                    </div>
                    <p className="text-gray-400 mb-3">{step.description}</p>
                    {step.details.length > 0 && (
                      <ul className="space-y-1">
                        {step.details.map((detail, i) => (
                          <li key={i} className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link to="/signup?type=investor">
                <Button variant="accent" fullWidth rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Browse Opportunities
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
