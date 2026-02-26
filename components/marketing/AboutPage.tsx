import React from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface AboutPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onSignIn }) => {
  return (
    <>
      <SEOHead
        title="About Us"
        description="Alex Lexington is a 4th-generation precious metals dealer and fine jeweler in Atlanta, GA. Since 1976, we've helped families invest, indulge, and secure their wealth."
        path="about"
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.3) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase mb-4">Est. 1976 &middot; Atlanta, Georgia</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            Four Generations<br />
            <span className="italic" style={{ color: '#D4B77A' }}>of Trust</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            What started as a small coin shop in Atlanta has grown into one of the Southeast's most trusted precious metals firms. For nearly fifty years, Alex Lexington has helped families build, protect, and pass on real wealth.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Our Story</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-6">
                From a Coin Shop to a<br />
                <span className="italic" style={{ color: '#D4B77A' }}>Precious Metals Institution</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  In 1976, our family opened a modest coin and bullion shop on Chamblee Dunwoody Road in Atlanta. The mission was simple: offer honest pricing, expert knowledge, and a handshake you could trust.
                </p>
                <p>
                  Four generations later, that mission hasn't changed — but our capabilities have. Alex Lexington now serves clients across the Southeast with precious metals trading, fine jewelry, and secure vault storage, all powered by technology that makes real asset ownership accessible to everyone.
                </p>
                <p>
                  We've watched gold move from $130 an ounce to over $2,800. We've served families through recessions, booms, and generational wealth transfers. Through it all, one principle holds: <em className="text-white">your wealth deserves the same care we'd give our own.</em>
                </p>
              </div>
            </div>
            {/* Timeline */}
            <div className="space-y-6">
              {[
                { year: '1976', title: 'The Beginning', desc: 'Founded as a coin shop in Chamblee, GA. Gold at $130/oz.' },
                { year: '1990s', title: 'Growing Reputation', desc: 'Expanded into bullion trading and wholesale services across the Southeast.' },
                { year: '2010s', title: 'Fine Jewelry', desc: 'Added INDULGE — custom jewelry design and estate pieces alongside metals.' },
                { year: '2024', title: 'Digital Transformation', desc: 'Launched Maroon — bringing portfolio management, live pricing, and vault access online.' },
                { year: '2025', title: 'SECURE Vault Storage', desc: 'As banks exit safe deposit boxes, Alex Lexington opens segregated vault storage to clients nationwide.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gold-500 flex-shrink-0" />
                    {i < 4 && <div className="w-px h-full bg-gold-500/20" />}
                  </div>
                  <div className="pb-4">
                    <span className="text-xs font-bold text-gold-500">{item.year}</span>
                    <h3 className="text-white font-medium mt-0.5">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">What We Do</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Three Pillars of <span className="italic" style={{ color: '#D4B77A' }}>Alex Lexington</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: 'INVEST',
                title: 'Precious Metals Trading',
                desc: 'Buy and sell gold, silver, platinum, and palladium at competitive spot-based pricing. From American Eagles to PAMP bars — 146+ products, live pricing, real-time execution.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                action: () => onNavigate('services-invest'),
              },
              {
                tag: 'INDULGE',
                title: 'Fine Jewelry & Design',
                desc: 'Engagement rings, custom pieces, and estate jewelry crafted by expert jewelers. From initial sketch to finished piece in as few as 5 days. Made in USA.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
                  </svg>
                ),
                action: () => onNavigate('services-indulge'),
              },
              {
                tag: 'SECURE',
                title: 'Vault Storage',
                desc: 'Segregated, insured vault storage for your precious metals. Your metals, your bag, your bin. Digital access through Maroon. Starting at $100/year.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                action: () => onNavigate('services-secure'),
              },
            ].map((pillar, i) => (
              <button
                key={i}
                onClick={pillar.action}
                className="group text-left p-6 sm:p-8 rounded-2xl border border-white/5 hover:border-gold-500/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500">
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500/50 group-hover:text-gold-500 transition-colors">{pillar.tag}</span>
                </div>
                <h3 className="font-serif text-xl text-white mb-2">{pillar.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{pillar.desc}</p>
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

      {/* Why Maroon */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">The Platform</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-6">
            Why <span className="italic" style={{ color: '#D4B77A' }}>Maroon?</span>
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto mb-8">
            Maroon is the digital evolution of everything Alex Lexington has built over four generations. Buy metals at live spot prices. Store them in our segregated vault. Track your portfolio in real time. Sell back whenever you're ready. All from your phone.
          </p>
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-10">
            No blockchain complexity. No crypto speculation. Just straightforward precious metals ownership — backed by a family that's been doing this since 1976.
          </p>
          <button
            onClick={onSignIn}
            className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
          >
            <span style={{ color: '#0A2240' }}>Create Your Free Account</span>
          </button>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Simplicity Wins', desc: 'Anyone should be able to buy gold, have it vaulted securely, and own a real asset. We strip away the complexity.' },
              { title: 'Segregated Always', desc: 'Your metals are never commingled. Every client has their own bag, their own bin, their own custody record.' },
              { title: 'Generational Thinking', desc: 'We build relationships that last decades. Your portfolio is designed to outlive trends, hype cycles, and market noise.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 mb-4">
                  <span className="font-serif font-semibold text-sm">{i + 1}</span>
                </div>
                <h3 className="font-serif text-lg text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Create Free Account</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-3.5 text-sm font-medium text-gold-500 border border-gold-500/30 rounded-xl hover:bg-gold-500/10 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
