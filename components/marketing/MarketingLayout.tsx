import React, { useState } from 'react';
import type { ViewState } from '../../types';

interface MarketingLayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
  currentView: ViewState;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children, onNavigate, onSignIn, currentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const navLinks: { label: string; view: ViewState }[] = [
    { label: 'About', view: 'about' },
    { label: 'How It Works', view: 'how-it-works' },
    { label: 'Pricing', view: 'pricing' },
    { label: 'Contact', view: 'contact' },
  ];

  const serviceLinks: { label: string; view: ViewState; tag: string }[] = [
    { label: 'Precious Metals Trading', view: 'services-invest', tag: 'INVEST' },
    { label: 'Fine Jewelry & Design', view: 'services-indulge', tag: 'INDULGE' },
    { label: 'Vault Storage', view: 'services-secure', tag: 'SECURE' },
  ];

  const isActive = (view: ViewState) => currentView === view;

  return (
    <div className="min-h-screen flex flex-col bg-navy-900 text-white">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 w-full z-50 bg-navy-900/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #BD9A5F, #A8864E)' }}
              >
                <span className="font-serif font-semibold text-sm" style={{ color: '#0A2240' }}>M</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif font-semibold text-sm text-white" style={{ letterSpacing: '0.15em' }}>MAROON</span>
                <span className="text-[8px] font-medium" style={{ letterSpacing: '0.18em', color: '#BD9A5F' }}>BY ALEX LEXINGTON</span>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.slice(0, 1).map(link => (
                <button
                  key={link.view}
                  onClick={() => onNavigate(link.view)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.view) ? 'text-gold-500' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {navLinks.slice(1, 2).map(link => (
                <button
                  key={link.view}
                  onClick={() => onNavigate(link.view)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.view) ? 'text-gold-500' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {/* Services Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onBlur={() => setTimeout(() => setServicesOpen(false), 200)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    ['services-invest', 'services-indulge', 'services-secure'].includes(currentView)
                      ? 'text-gold-500'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Services
                  <svg className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {servicesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-navy-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {serviceLinks.map(link => (
                      <button
                        key={link.view}
                        onClick={() => { onNavigate(link.view); setServicesOpen(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm text-gray-200 group-hover:text-white">{link.label}</span>
                        <span className="text-[10px] font-bold tracking-widest text-gold-500/60 group-hover:text-gold-500">{link.tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {navLinks.slice(2).map(link => (
                <button
                  key={link.view}
                  onClick={() => onNavigate(link.view)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.view) ? 'text-gold-500' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* CTAs + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={onSignIn}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-gold-500 border border-gold-500/30 rounded-lg hover:bg-gold-500/10 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onSignIn}
                className="hidden sm:block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-gold-500/20"
                style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
              >
                <span style={{ color: '#0A2240' }}>Get Started</span>
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-navy-900/98 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <button
                  key={link.view}
                  onClick={() => { onNavigate(link.view); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.view) ? 'text-gold-500 bg-gold-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 pb-1 px-4">
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Services</span>
              </div>
              {serviceLinks.map(link => (
                <button
                  key={link.view}
                  onClick={() => { onNavigate(link.view); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    isActive(link.view) ? 'text-gold-500 bg-gold-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="text-[10px] font-bold tracking-widest text-gold-500/50">{link.tag}</span>
                </button>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <button onClick={() => { onSignIn(); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-medium text-gold-500 border border-gold-500/30 rounded-lg">
                  Sign In
                </button>
                <button
                  onClick={() => { onSignIn(); setMobileMenuOpen(false); }}
                  className="w-full py-3 text-sm font-semibold rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
                >
                  <span style={{ color: '#0A2240' }}>Get Started</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A96E, #BD9A5F, #A8864E)' }}>
                  <span className="font-serif font-semibold text-xs" style={{ color: '#0A2240' }}>M</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-serif font-semibold text-sm text-white" style={{ letterSpacing: '0.15em' }}>MAROON</span>
                  <span className="text-[8px] font-medium" style={{ letterSpacing: '0.18em', color: '#BD9A5F' }}>BY ALEX LEXINGTON</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your wealth, refined. Buy, vault, and trade precious metals with a 4th-generation Atlanta dealer.
              </p>
              <p className="text-xs text-gray-500 mt-3">Est. 1976</p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-xs font-bold tracking-widest text-gold-500/80 uppercase mb-4">Services</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => onNavigate('services-invest')} className="text-sm text-gray-400 hover:text-white transition-colors">Precious Metals Trading</button></li>
                <li><button onClick={() => onNavigate('services-indulge')} className="text-sm text-gray-400 hover:text-white transition-colors">Fine Jewelry & Design</button></li>
                <li><button onClick={() => onNavigate('services-secure')} className="text-sm text-gray-400 hover:text-white transition-colors">Vault Storage</button></li>
                <li><button onClick={() => onNavigate('pricing')} className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold tracking-widest text-gold-500/80 uppercase mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => onNavigate('about')} className="text-sm text-gray-400 hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => onNavigate('how-it-works')} className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => onNavigate('contact')} className="text-sm text-gray-400 hover:text-white transition-colors">Contact</button></li>
                <li><a href="https://alexlexington.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">Main Website</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold tracking-widest text-gold-500/80 uppercase mb-4">Visit Us</h4>
              <address className="not-italic text-sm text-gray-400 leading-relaxed">
                3335 Chamblee Dunwoody Road<br />
                Chamblee, GA 30341
              </address>
              <div className="mt-4 space-y-1.5">
                <a href="tel:+14048158893" className="block text-sm text-gray-400 hover:text-gold-500 transition-colors">(404) 815-8893</a>
                <a href="mailto:info@alexlexington.com" className="block text-sm text-gray-400 hover:text-gold-500 transition-colors">info@alexlexington.com</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Atlanta Gold & Silver DBA Alex Lexington. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
