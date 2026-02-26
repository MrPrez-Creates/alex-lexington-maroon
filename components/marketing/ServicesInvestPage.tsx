import React from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface PageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const ServicesInvestPage: React.FC<PageProps> = ({ onNavigate, onSignIn }) => {
  const metals = [
    {
      symbol: 'Au',
      name: 'Gold',
      color: '#FFD700',
      products: 'American Eagles, Maples, Krugerrands, Buffalos, Bars, Pre-1933 Coins',
      margin: '3\u20133.5%',
      count: '82 products',
    },
    {
      symbol: 'Ag',
      name: 'Silver',
      color: '#C0C0C0',
      products: 'Eagles, Maples, Rounds, Bars, 90% Junk Silver',
      margin: '6\u201310%',
      count: '50 products',
    },
    {
      symbol: 'Pt',
      name: 'Platinum',
      color: '#B4B4BE',
      products: 'Eagles, Maples, Bars',
      margin: 'Competitive',
      count: '9 products',
    },
    {
      symbol: 'Pd',
      name: 'Palladium',
      color: '#D4A574',
      products: 'Maples, Bars',
      margin: 'Competitive',
      count: '4 products',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Browse',
      desc: 'Explore live inventory with spot-based pricing updated in real time. Filter by metal, product type, and weight. Every price is transparent \u2014 spot plus a published margin.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Buy',
      desc: 'When you\u2019re ready, confirm your order. The system locks your price for 20 seconds and executes immediately via FizTrade. No hidden fees, no bait-and-switch.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Hold',
      desc: 'Your metal is held at Dillon Gage or vaulted in Alex Lexington\u2019s segregated storage. Track it in your portfolio. Sell back anytime at live spot pricing.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  const portfolioFeatures = [
    {
      title: 'Real-Time Value',
      desc: 'Portfolio value updates with live spot prices throughout the trading day.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: 'Per-Metal Breakdown',
      desc: 'See troy ounces held for each metal: Au, Ag, Pt, and Pd \u2014 never combined.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      title: 'Cost Basis Tracking',
      desc: 'Every purchase recorded with date, price, and quantity for tax reporting.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Gain / Loss',
      desc: 'Unrealized gains and losses calculated against your cost basis in real time.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Transaction History',
      desc: 'Complete record of every buy, sell, deposit, and withdrawal with FIZ# confirmations.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'Sell-Back Flow',
      desc: 'Sell vault holdings back at live spot pricing. Funds credited to your balance instantly.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <SEOHead
        title="Precious Metals Trading \u2014 INVEST"
        description="Buy and sell gold, silver, platinum, and palladium at competitive spot-based pricing. Live FizTrade pricing, 146+ products, real-time portfolio tracking through Maroon."
        path="services-invest"
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
            INVEST
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            Buy, Hold, and Trade<br />
            <span className="italic" style={{ color: '#D4B77A' }}>Precious Metals</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Live pricing. Real execution. 146+ products across four metals. Powered by FizTrade and backed by a 4th-generation dealer who's been in this market since 1976.
          </p>
        </div>
      </section>

      {/* What We Trade */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Our Catalog</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              What We <span className="italic" style={{ color: '#D4B77A' }}>Trade</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metals.map((metal) => (
              <div
                key={metal.symbol}
                className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-gold-500/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-serif text-xl font-bold"
                    style={{ backgroundColor: `${metal.color}15`, color: metal.color }}
                  >
                    {metal.symbol}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{metal.name}</h3>
                    <span className="text-xs text-gray-500">{metal.count}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{metal.products}</p>
                <div className="pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase">Margin</span>
                  <p className="text-sm text-gold-500 font-medium mt-0.5">{metal.margin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Pricing */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Pricing</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-6">
                Live Spot Pricing,<br />
                <span className="italic" style={{ color: '#D4B77A' }}>Zero Hidden Spreads</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Every price you see on Maroon is derived from live spot data through our FizTrade connection to Dillon Gage, one of the nation's largest precious metals wholesalers.
                </p>
                <p>
                  We publish our margins clearly. Gold bullion carries a 3\u20133.5% premium over spot. Silver runs 6\u201310%. What you see on the screen is what you pay \u2014 no hidden spreads, no surprise fees at checkout.
                </p>
                <p>
                  Prices refresh continuously during market hours. When you're ready to buy, the system locks your price for 20 seconds and executes immediately.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Real-Time Spot Data', desc: 'Prices sourced directly from FizTrade via Dillon Gage' },
                { label: 'Published Margins', desc: 'No hidden spreads \u2014 premium over spot disclosed before you buy' },
                { label: '20-Second Price Lock', desc: 'Your price is guaranteed the moment you confirm' },
                { label: 'Instant Execution', desc: 'LockPrices \u2192 ExecuteTrade fires the moment payment clears' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">{item.label}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Trading Works */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">How It Works</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Three Steps to <span className="italic" style={{ color: '#D4B77A' }}>Real Ownership</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold tracking-[0.15em] text-gold-500/40">{step.number}</span>
                </div>
                <h3 className="font-serif text-xl text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          {/* Connecting line (visual) */}
          <div className="hidden md:flex items-center justify-center mt-8">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Browse</span>
              <svg className="w-4 h-4 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Buy</span>
              <svg className="w-4 h-4 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Hold</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Features */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Your Portfolio</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Track Every <span className="italic" style={{ color: '#D4B77A' }}>Ounce</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Maroon gives you a complete real-time view of your precious metals holdings, cost basis, and performance.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioFeatures.map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-white font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dollar-Cost Averaging */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative p-8 sm:p-12 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div
              className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.4) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">
                  Dollar-Cost Averaging
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gold-500/10 text-gold-500 border border-gold-500/20">
                  Coming Soon
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-white mb-4">
                Automate Your <span className="italic" style={{ color: '#D4B77A' }}>Metal Accumulation</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                Set a dollar amount and a schedule \u2014 weekly, biweekly, or monthly. Maroon automatically purchases metals from your linked bank account at current spot prices. No timing the market. Just steady, disciplined accumulation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Flexible Schedule', desc: 'Weekly, biweekly, or monthly purchases' },
                  { label: 'Any Amount', desc: 'Start with as little as you want' },
                  { label: 'Full Control', desc: 'Pause, change, or cancel anytime' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1 rounded-full bg-gold-500/30 flex-shrink-0" />
                    <div>
                      <h4 className="text-white text-sm font-medium">{item.label}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
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
            Start Investing <span className="italic" style={{ color: '#D4B77A' }}>Today</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Create your free Maroon account to browse live pricing, build your portfolio, and own real precious metals backed by a family you can trust.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Start Investing Today</span>
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-8 py-3.5 text-sm font-medium text-gold-500 border border-gold-500/30 rounded-xl hover:bg-gold-500/10 transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesInvestPage;
