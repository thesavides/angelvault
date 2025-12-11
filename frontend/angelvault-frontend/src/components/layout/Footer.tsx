import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter } from 'lucide-react';

const footerLinks = {
  company: [
    { label: 'About AngelVault', href: '/about' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'SAFE Note Framework', href: '/safe-notes' },
    { label: 'Contact Us', href: '/contact' },
  ],
  founders: [
    { label: 'Submit Startup', href: '/signup?type=developer' },
    { label: 'Founder FAQ', href: '/#faq' },
    { label: 'Success Stories', href: '/success-stories' },
    { label: 'Resources', href: '/resources' },
  ],
  investors: [
    { label: 'Browse Opportunities', href: '/projects' },
    { label: 'Investor FAQ', href: '/#faq' },
    { label: 'Due Diligence Guide', href: '/due-diligence' },
    { label: 'Investment Process', href: '/#how-it-works' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'NDA Template', href: '/nda-template' },
    { label: 'SAFE Note Template', href: '/safe-template' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-400">
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                AngelVault
              </span>
            </Link>
            <p className="text-sm mb-6">
              A curated marketplace connecting pre-seed startups with angel investors.
            </p>
            <div className="flex gap-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@angelvault.io"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Founders */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Founders</h4>
            <ul className="space-y-3">
              {footerLinks.founders.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Investors */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Investors</h4>
            <ul className="space-y-3">
              {footerLinks.investors.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} Ukuva Consulting | AngelVault
            </p>
            <p className="text-sm flex items-center gap-2">
              <span>Built in Amsterdam 🇳🇱</span>
              <span>|</span>
              <span>Serving Africa 🌍</span>
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-4 max-w-4xl">
            Disclaimers: AngelVault is a marketplace platform connecting startups and investors. 
            We do not provide investment advice, legal advice, or guarantee investment outcomes. 
            All investments carry risk. Investors should conduct their own due diligence. 
            SAFE notes are legally binding contracts—consult with legal counsel before executing.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
