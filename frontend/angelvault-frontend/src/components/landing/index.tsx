// Landing page components - Hero, Problem, HowItWorks, FAQ, etc.
import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, XCircle, Upload, CheckCircle, Eye, FileText, Users, Search, CreditCard, FileSignature, Send, Plus, Minus, Rocket, TrendingUp, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

// Hero Section
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100 opacity-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>NDA-Protected | Admin-Vetted | SAFE Notes</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-900 leading-tight mb-6">
              Where Serious Founders Meet{' '}
              <span className="bg-gradient-to-r from-primary-400 to-primary-700 bg-clip-text text-transparent">Serious Angels</span>
            </h1>
            <p className="text-xl text-navy-600 mb-4">
              A curated marketplace for pre-seed investments. Vetted startups. Qualified investors. Streamlined term sheets.
            </p>
            <p className="text-lg text-navy-500 mb-8">
              No tire-kickers. No time-wasters. Just committed founders and investors who understand that capital deserves diligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup?type=developer">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>I'm Raising Capital</Button>
              </Link>
              <Link to="/signup?type=investor">
                <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>I'm Investing</Button>
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: '$2.5M+', label: 'Capital Deployed' },
                { value: '150+', label: 'Vetted Startups' },
                { value: '40%', label: 'Rejection Rate' },
              ].map((stat, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-700 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-sm text-navy-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="hidden lg:block">
            <div className="relative">
              <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <Globe className="w-32 h-32 text-primary-300" />
              </div>
              <motion.div className="absolute left-0 top-10 w-64 bg-white rounded-2xl shadow-xl p-6" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold">F</div>
                  <div><div className="font-semibold text-navy-900">Startup Founder</div><div className="text-sm text-gray-500">Raising $150k</div></div>
                </div>
              </motion.div>
              <motion.div className="absolute right-0 top-40 w-64 bg-navy-900 rounded-2xl shadow-xl p-6" animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-navy-900 font-bold">I</div>
                  <div><div className="font-semibold text-white">Angel Investor</div><div className="text-sm text-gray-400">4 views remaining</div></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Problem Section
export function Problem() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 lg:py-28 bg-gradient-to-b from-navy-900 to-navy-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            The Traditional Angel Process Is <span className="text-red-400">Broken</span>
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
              <h3 className="text-xl font-semibold">Founders' Pain</h3>
            </div>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 mt-0.5" /><span>Endless pitching to investors who ghost</span></li>
              <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 mt-0.5" /><span>Giving away IP before knowing if investors are serious</span></li>
              <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 mt-0.5" /><span>Months of back-and-forth for a $50k check</span></li>
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
              <h3 className="text-xl font-semibold">Investors' Pain</h3>
            </div>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 mt-0.5" /><span>Wading through unprepared founders</span></li>
              <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 mt-0.5" /><span>No way to filter signal from noise</span></li>
              <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 mt-0.5" /><span>Complex negotiation processes</span></li>
            </ul>
          </motion.div>
        </div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-center mt-16 text-xl">
          AngelVault fixes this with one principle: <span className="font-bold text-primary-400">commitment before engagement.</span>
        </motion.p>
      </div>
    </section>
  );
}

// How It Works Section
export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="how-it-works" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">A streamlined process that respects everyone's time.</p>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">Raising Capital</div>
            <h3 className="font-display text-2xl font-bold text-navy-900 mb-8">For Founders</h3>
            <div className="space-y-6">
              {[
                { icon: Upload, title: 'Submit Your Startup', desc: 'Upload pitch deck, financials, and product demos' },
                { icon: CheckCircle, title: 'Admin Vetting', desc: 'Our team reviews every submission' },
                { icon: Eye, title: 'Go Live', desc: 'Appear in marketplace for serious investors' },
                { icon: Users, title: 'Execute SAFE Notes', desc: 'Accept offers and close deals' },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-primary-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1"><step.icon className="w-5 h-5 text-primary-600" /><h4 className="font-semibold text-navy-900">{step.title}</h4></div>
                    <p className="text-gray-600 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/signup?type=developer" className="block mt-8"><Button fullWidth rightIcon={<ArrowRight className="w-5 h-5" />}>List Your Startup</Button></Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="bg-navy-900 rounded-3xl p-8 shadow-lg">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-6">Deploying Capital</div>
            <h3 className="font-display text-2xl font-bold text-white mb-8">For Investors</h3>
            <div className="space-y-6">
              {[
                { icon: Search, title: 'Browse Opportunities', desc: 'Filter vetted startups by category and stage' },
                { icon: CreditCard, title: 'Pay to View ($500/4)', desc: 'Commitment filter ensures serious investors' },
                { icon: FileSignature, title: 'Sign NDA, Review', desc: 'Access full materials with IP protection' },
                { icon: Users, title: 'Submit Offers', desc: 'Execute SAFE notes on platform' },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 text-navy-900 text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1"><step.icon className="w-5 h-5 text-primary-400" /><h4 className="font-semibold text-white">{step.title}</h4></div>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/signup?type=investor" className="block mt-8"><Button variant="accent" fullWidth rightIcon={<ArrowRight className="w-5 h-5" />}>Browse Opportunities</Button></Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// FAQ Section
export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openFounder, setOpenFounder] = useState<number | null>(null);
  const [openInvestor, setOpenInvestor] = useState<number | null>(null);

  const founderFAQs = [
    { q: 'How much does it cost to list?', a: 'Nothing upfront. 2% success fee if you raise capital.' },
    { q: 'How long does vetting take?', a: '3-5 business days.' },
    { q: 'What if investors steal my idea?', a: 'Every investor signs an NDA before viewing sensitive materials.' },
  ];

  const investorFAQs = [
    { q: 'What happens after I pay $500?', a: 'You can select 4 projects to unlock with full access.' },
    { q: 'Can I buy more views?', a: 'Yes. Each $500 unlocks 4 additional projects.' },
    { q: 'How are startups vetted?', a: 'Admin team reviews for complete documentation and realistic financials. ~40% rejection rate.' },
  ];

  return (
    <section ref={ref} id="faq" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900">Frequently Asked Questions</h2>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-display text-xl font-bold text-navy-900 mb-6">For Founders</h3>
            <div className="bg-gray-50 rounded-2xl px-6">
              {founderFAQs.map((faq, i) => (
                <div key={i} className="border-b border-gray-200 last:border-0">
                  <button onClick={() => setOpenFounder(openFounder === i ? null : i)} className="w-full py-5 flex items-center justify-between text-left">
                    <span className="font-medium text-navy-900 pr-4">{faq.q}</span>
                    {openFounder === i ? <Minus className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-gray-400" />}
                  </button>
                  {openFounder === i && <p className="pb-5 text-gray-600">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-navy-900 mb-6">For Investors</h3>
            <div className="bg-gray-50 rounded-2xl px-6">
              {investorFAQs.map((faq, i) => (
                <div key={i} className="border-b border-gray-200 last:border-0">
                  <button onClick={() => setOpenInvestor(openInvestor === i ? null : i)} className="w-full py-5 flex items-center justify-between text-left">
                    <span className="font-medium text-navy-900 pr-4">{faq.q}</span>
                    {openInvestor === i ? <Minus className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-gray-400" />}
                  </button>
                  {openInvestor === i && <p className="pb-5 text-gray-600">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA Section
export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 lg:py-28 bg-gradient-to-b from-navy-900 to-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="lg:pr-12 lg:border-r border-white/10">
            <Rocket className="w-12 h-12 text-primary-400 mb-4" />
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">Raising Pre-Seed Capital?</h3>
            <p className="text-gray-400 text-lg mb-8">Stop chasing ghosts. Start conversations with investors who've already committed.</p>
            <Link to="/signup?type=developer"><Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>Submit Your Startup</Button></Link>
            <p className="text-sm text-gray-500 mt-4">No upfront costs. Success fee only.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="lg:pl-12">
            <TrendingUp className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">Deploying Capital?</h3>
            <p className="text-gray-400 text-lg mb-8">Skip the noise. Review vetted opportunities from serious founders.</p>
            <Link to="/signup?type=investor"><Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>Browse Opportunities</Button></Link>
            <p className="text-sm text-gray-500 mt-4">$500 unlocks 4 detailed evaluations.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default { Hero, Problem, HowItWorks, FAQ, FinalCTA };
