import React, { useEffect } from 'react';
import { Hero, Problem, HowItWorks, FAQ, FinalCTA } from '../components/landing';
import { trackEvent } from '../utils/analytics';

export function LandingPage() {
  useEffect(() => {
    trackEvent('page_view', { page: 'landing', page_title: 'AngelVault - Home' });
  }, []);

  return (
    <main>
      <Hero />
      <Problem />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

export default LandingPage;
