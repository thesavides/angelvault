import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-400 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="font-display font-bold text-xl text-white">AngelVault</span>
            </Link>
            <p className="text-sm mb-6">A curated marketplace connecting pre-seed startups with angel investors.</p>
            <div className="flex gap-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:hello@angelvault.io" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm hover:text-white transition-colors">About</Link></li>
              <li><a href="/#how-it-works" className="text-sm hover:text-white transition-colors">How It Works</a></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Founders</h4>
            <ul className="space-y-3">
              <li><Link to="/signup?type=developer" className="text-sm hover:text-white transition-colors">Submit Startup</Link></li>
              <li><a href="/#faq" className="text-sm hover:text-white transition-colors">FAQ</a></li>
              <li><Link to="/resources" className="text-sm hover:text-white transition-colors">Resources</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Investors</h4>
            <ul className="space-y-3">
              <li><Link to="/projects" className="text-sm hover:text-white transition-colors">Browse Opportunities</Link></li>
              <li><a href="/#faq" className="text-sm hover:text-white transition-colors">FAQ</a></li>
              <li><Link to="/signup?type=investor" className="text-sm hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© {new Date().getFullYear()} Ukuva Consulting | AngelVault</p>
            <p className="text-sm">Built in Amsterdam 🇳🇱 | Serving Africa 🌍</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
