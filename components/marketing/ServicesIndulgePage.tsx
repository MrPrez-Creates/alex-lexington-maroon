import React from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface PageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const ServicesIndulgePage: React.FC<PageProps> = ({ onNavigate, onSignIn }) => {
  const offerings = [
    {
      title: 'Engagement & Bridal',
      desc: 'Custom engagement rings, wedding bands, and anniversary pieces designed around your story. Every stone hand-selected, every setting crafted to last generations.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      title: 'Custom Design',
      desc: 'From concept to finished piece. Share your vision, review AI-powered renderings, select materials and stones, and receive a handcrafted piece made in the USA in as few as 5\u20137 days.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
        </svg>
      ),
    },
    {
      title: 'Estate & Vintage',
      desc: 'Curated pre-owned fine jewelry, certified estate pieces, and unique vintage finds. Each piece authenticated, appraised, and presented with full provenance.',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
  ];

  const designSteps = [
    {
      number: '01',
      title: 'Consultation',
      desc: 'Free design consultation \u2014 in person or virtual. Discuss your vision, budget, preferred metals and stones. No obligation, no pressure.',
      accent: 'Share your vision',
    },
    {
      number: '02',
      title: 'Design',
      desc: 'Our team creates AI-powered renderings of your piece. Select materials, choose stones, refine every detail until it\u2019s exactly right.',
      accent: 'See it before it\u2019s made',
    },
    {
      number: '03',
      title: 'Crafting',
      desc: 'Expert jewelers bring your design to life through Overnight Mountings \u2014 one of America\u2019s premier mounting houses. Made in the USA with meticulous attention to detail.',
      accent: 'Handcrafted in the USA',
    },
    {
      number: '04',
      title: 'Delivery',
      desc: 'Your finished piece arrives in as few as 5\u20137 days. Quality guaranteed. Every piece inspected before it reaches your hands.',
      accent: 'As few as 5 days',
    },
  ];

  return (
    <>
      <SEOHead
        title="Fine Jewelry & Custom Design \u2014 INDULGE"
        description="Fine jewelry and custom design by Alex Lexington. Engagement rings, estate pieces, and bespoke creations crafted in the USA. From sketch to finished piece in as few as 5 days."
        path="services-indulge"
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.3) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <a href="https://alexlexington.com" target="_blank" rel="noopener noreferrer" className="inline-block mb-6">
            <img src="/logos/alex-lexington-white.png" alt="Alex Lexington" className="h-6 sm:h-8 block mx-auto opacity-70 hover:opacity-100 transition-opacity" />
          </a>
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase mb-4">
            INDULGE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            Fine Jewelry, Crafted<br />
            <span className="italic" style={{ color: '#D4B77A' }}>with Purpose</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Four generations of jewelers. Custom design, estate pieces, and engagement rings crafted by hand in the USA. From initial sketch to finished piece in as few as five days.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Our Collections</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              What We <span className="italic" style={{ color: '#D4B77A' }}>Offer</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offerings.map((item, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-gold-500/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500 mb-5">
                  {item.icon}
                </div>
                <h3 className="font-serif text-xl text-white mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Custom Design Process */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">The Process</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              From Vision to <span className="italic" style={{ color: '#D4B77A' }}>Finished Piece</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Every custom piece follows a clear, collaborative process. You stay involved at every step.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {designSteps.map((step) => (
              <div key={step.number} className="relative p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-3xl font-serif font-light text-gold-500/20">{step.number}</span>
                <h3 className="font-serif text-xl text-white mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{step.desc}</p>
                <span className="inline-block text-xs font-medium text-gold-500 bg-gold-500/10 px-3 py-1 rounded-full">
                  {step.accent}
                </span>
              </div>
            ))}
          </div>
          {/* Visual flow connector */}
          <div className="hidden lg:flex items-center justify-center mt-8">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Consultation</span>
              <svg className="w-4 h-4 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Design</span>
              <svg className="w-4 h-4 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Crafting</span>
              <svg className="w-4 h-4 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overnight Mountings Partnership */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Our Partner</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-6">
                Powered by<br />
                <span className="italic" style={{ color: '#D4B77A' }}>Overnight Mountings</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Alex Lexington's INDULGE collection is powered by Overnight Mountings \u2014 one of America's premier jewelry mounting houses. Every custom piece is crafted in the USA by skilled artisans with decades of experience.
                </p>
                <p>
                  This partnership means you get the personal attention and expertise of a 4th-generation jeweler, combined with the manufacturing precision and speed of one of the country's most respected production facilities.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: 'Made in USA',
                  desc: 'Every piece manufactured domestically with traceable sourcing',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  ),
                },
                {
                  title: 'Fast Turnaround',
                  desc: 'Finished pieces in as few as 5\u20137 business days',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: 'Quality Guaranteed',
                  desc: 'Every piece inspected before delivery to our showroom',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                },
                {
                  title: 'Expert Craftsmanship',
                  desc: 'Skilled artisans with decades of fine jewelry experience',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 mb-3">
                    {item.icon}
                  </div>
                  <h4 className="text-white text-sm font-medium mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visit Our Showroom */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative p-8 sm:p-12 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div
              className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.4) 0%, transparent 70%)' }}
            />
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">
                  Visit Us
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-light text-white mt-3 mb-4">
                  Our <span className="italic" style={{ color: '#D4B77A' }}>Showroom</span>
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  See our collections in person at our Chamblee, Georgia showroom. By appointment, so you always receive personal, unhurried attention from our team.
                </p>
                <a
                  href="https://calendly.com/info-54784"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
                >
                  <span style={{ color: '#0A2240' }}>Schedule a Visit</span>
                </a>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: 'Location',
                    value: 'Chamblee, Georgia',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Appointments',
                    value: 'By appointment only',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Service',
                    value: 'Personal, one-on-one attention',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase">{item.label}</span>
                      <p className="text-sm text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-4">
            Discover <span className="italic" style={{ color: '#D4B77A' }}>Something Beautiful</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Whether you're designing an engagement ring, searching for a vintage treasure, or simply exploring what's possible, we'd love to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://alexlexington.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5 inline-block"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Explore Our Collection</span>
            </a>
            <a
              href="https://calendly.com/info-54784"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 text-sm font-medium text-gold-500 border border-gold-500/30 rounded-xl hover:bg-gold-500/10 transition-colors inline-block"
            >
              Schedule a Visit
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesIndulgePage;
