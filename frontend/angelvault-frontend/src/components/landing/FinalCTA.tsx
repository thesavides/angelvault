import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';

export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section bg-gradient-dark relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-0">
          {/* For Founders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:pr-12 lg:border-r border-white/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
              Raising Pre-Seed or Angel Capital?
            </h3>
            <p className="text-gray-400 text-lg mb-8">
              Stop chasing ghosts. Start conversations with investors who've already committed.
            </p>
            <Link to="/signup?type=developer">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Submit Your Startup
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              No upfront costs. Success fee only.
            </p>
          </motion.div>

          {/* For Investors */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:pl-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gold" />
              </div>
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
              Deploying Capital into African Startups?
            </h3>
            <p className="text-gray-400 text-lg mb-8">
              Skip the noise. Review vetted opportunities from serious founders.
            </p>
            <Link to="/signup?type=investor">
              <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Browse Opportunities
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              $500 unlocks 4 detailed evaluations.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
