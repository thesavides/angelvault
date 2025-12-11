import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary-700/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="container-wide relative z-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold-dark text-sm font-medium mb-6"
            >
              <Shield className="w-4 h-4" />
              <span>NDA-Protected | Admin-Vetted | SAFE Notes</span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-900 leading-tight mb-6">
              Where Serious Founders Meet{' '}
              <span className="gradient-text">Serious Angels</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-navy-600 mb-4">
              A curated marketplace for pre-seed investments. Vetted startups. Qualified investors. Streamlined term sheets.
            </p>

            {/* Supporting copy */}
            <p className="text-lg text-navy-500 mb-8">
              No tire-kickers. No time-wasters. Just committed founders and investors who understand that capital deserves diligence, and great ideas deserve serious capital.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup?type=developer">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  I'm Raising Capital
                </Button>
              </Link>
              <Link to="/signup?type=investor">
                <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  I'm Investing
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: '$2.5M+', label: 'Capital Deployed' },
                { value: '150+', label: 'Vetted Startups' },
                { value: '40%', label: 'Rejection Rate' },
              ].map((stat, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="text-2xl lg:text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-navy-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main illustration container */}
            <div className="relative">
              {/* Founder card */}
              <motion.div
                className="absolute left-0 top-10 w-64 bg-white rounded-2xl shadow-xl p-6 z-10"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                    F
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900">Startup Founder</div>
                    <div className="text-sm text-gray-500">Raising $150k</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-gradient-primary rounded-full w-3/4" />
                  </div>
                  <div className="text-xs text-gray-500">75% funded</div>
                </div>
              </motion.div>

              {/* Investor card */}
              <motion.div
                className="absolute right-0 top-40 w-64 bg-navy-900 rounded-2xl shadow-xl p-6 z-10"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-navy-900 font-bold">
                    I
                  </div>
                  <div>
                    <div className="font-semibold text-white">Angel Investor</div>
                    <div className="text-sm text-gray-400">4 views remaining</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">NDA Signed</span>
                </div>
              </motion.div>

              {/* Connection line/handshake visual */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-primary opacity-20"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* SAFE note indicator */}
              <motion.div
                className="absolute left-1/2 bottom-20 -translate-x-1/2 bg-white rounded-xl shadow-lg px-6 py-3 flex items-center gap-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <Zap className="w-5 h-5 text-gold" />
                <span className="font-medium text-navy-900">SAFE Note Ready</span>
              </motion.div>

              {/* Background decorative element */}
              <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <Globe className="w-32 h-32 text-primary-300" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-navy-300 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-navy-400"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
