import React from 'react';
import { Hero } from '../components/landing/Hero';
import { Problem } from '../components/landing/Problem';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhyAngelVault } from '../components/landing/WhyAngelVault';
import { Trust } from '../components/landing/Trust';
import { FAQ } from '../components/landing/FAQ';
import { FinalCTA } from '../components/landing/FinalCTA';

export function LandingPage() {
  return (
    <main>
      <Hero />
      <Problem />
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <WhyAngelVault />
      <Trust />
      <section id="faq">
        <FAQ />
      </section>
      <FinalCTA />
    </main>
  );
}

export default LandingPage;
