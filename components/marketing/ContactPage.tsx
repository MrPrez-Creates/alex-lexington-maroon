import React from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface ContactPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, onSignIn }) => {
  const contactCards = [
    {
      title: 'Visit Us',
      primary: '3335 Chamblee Dunwoody Road',
      secondary: 'Chamblee, GA 30341',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      title: 'Call Us',
      primary: '(404) 815-8893',
      secondary: 'Monday \u2013 Friday, 9am \u2013 5pm EST',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
    },
    {
      title: 'Email Us',
      primary: 'info@alexlexington.com',
      secondary: 'Response within 24 hours',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
  ];

  const serviceLinks = [
    {
      title: 'Buy Precious Metals',
      desc: 'Gold, silver, platinum, and palladium at live spot-based pricing.',
      tag: 'INVEST',
      view: 'services-invest' as ViewState,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: 'Custom Jewelry',
      desc: 'Engagement rings, custom designs, and estate pieces by expert jewelers.',
      tag: 'INDULGE',
      view: 'services-indulge' as ViewState,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
        </svg>
      ),
    },
    {
      title: 'Vault Storage',
      desc: 'Segregated, insured storage for your precious metals. From $100/year.',
      tag: 'SECURE',
      view: 'services-secure' as ViewState,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Get in touch with Alex Lexington. Visit our Atlanta showroom at 3335 Chamblee Dunwoody Road, Chamblee GA 30341. Call, email, or schedule a consultation."
        path="contact"
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.3) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase mb-4">Get in Touch</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            We're Here to <span className="italic" style={{ color: '#D4B77A' }}>Help</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Whether you're buying your first gold coin or vaulting a substantial portfolio, we're ready to assist.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactCards.map((card, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500 mx-auto mb-5">
                  {card.icon}
                </div>
                <h3 className="font-serif text-lg text-white mb-3">{card.title}</h3>
                <p className="text-gray-300 font-medium">{card.primary}</p>
                <p className="text-sm text-gray-400 mt-1">{card.secondary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Existing Clients */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-10 rounded-2xl border border-gold-500/20 bg-gold-500/[0.04] text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500 mx-auto mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl text-white mb-3">Already Have an Account?</h3>
            <p className="text-gray-300 leading-relaxed max-w-lg mx-auto mb-6">
              Sign in to Maroon for portfolio access, vault management, and support.
            </p>
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* Services Quick Links */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Explore</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Not Sure Where to <span className="italic" style={{ color: '#D4B77A' }}>Start?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceLinks.map((service, i) => (
              <button
                key={i}
                onClick={() => onNavigate(service.view)}
                className="group text-left p-6 sm:p-8 rounded-2xl border border-white/5 hover:border-gold-500/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500">
                    {service.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500/50 group-hover:text-gold-500 transition-colors">{service.tag}</span>
                </div>
                <h3 className="font-serif text-xl text-white mb-2">{service.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{service.desc}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-4">
            Ready to <span className="italic" style={{ color: '#D4B77A' }}>get started?</span>
          </h2>
          <p className="text-gray-400 mb-8">Join families across the Southeast who trust Alex Lexington with their precious metals.</p>
          <button
            onClick={onSignIn}
            className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
          >
            <span style={{ color: '#0A2240' }}>Create Your Free Account</span>
          </button>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
