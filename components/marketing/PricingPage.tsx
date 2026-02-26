import React, { useState } from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface PricingPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, onSignIn }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const vaultTiers = [
    { price: 100, label: '$100', period: '/year', description: 'For starting collections', features: ['Segregated storage', 'Digital vault access', 'Annual billing'] },
    { price: 250, label: '$250', period: '/year', description: 'Growing portfolios', features: ['Segregated storage', 'Digital vault access', 'Annual billing'] },
    { price: 500, label: '$500', period: '/year', description: 'Established investors', popular: true, features: ['Segregated storage', 'Digital vault access', 'Annual billing'] },
    { price: 1000, label: '$1,000', period: '/year', description: 'Serious collectors', features: ['Segregated storage', 'Digital vault access', 'Annual billing'] },
    { price: 1800, label: '$1,800', period: '/year', description: 'Premium holdings', features: ['Segregated storage', 'Digital vault access', 'Annual billing'] },
  ];

  const tradingMargins = [
    { metal: 'Gold', margin: '3 \u2013 3.5%', note: 'Over spot' },
    { metal: 'Silver', margin: '6 \u2013 10%', note: 'Over spot' },
    { metal: 'Platinum', margin: 'Contact', note: 'For pricing' },
    { metal: 'Palladium', margin: 'Contact', note: 'For pricing' },
  ];

  const paymentMethods = [
    {
      title: 'Wire Transfer',
      fee: 'No fee',
      speed: 'Same-day settlement',
      note: 'Recommended for orders over $5,000',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'Credit Card',
      fee: '3.5% processing fee',
      speed: 'Instant',
      note: 'Best for smaller purchases',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'Wallet Balance',
      fee: 'No fee',
      speed: 'Fastest checkout',
      note: 'Pre-funded account balance',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
        </svg>
      ),
    },
    {
      title: 'ACH',
      fee: 'No fee',
      speed: '3\u20135 day settlement',
      note: 'Linked bank account',
      comingSoon: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      question: 'Is there a minimum purchase?',
      answer: 'No minimum for trading. Vault storage minimum is Tier 1 ($100/year).',
    },
    {
      question: 'How is the 3.5% credit card fee calculated?',
      answer: 'Applied to the total order amount (or deposit amount for deposit orders).',
    },
    {
      question: 'Can I change vault tiers?',
      answer: 'Tiers auto-adjust as your stored value increases. You only pay for what you store.',
    },
    {
      question: 'Are there withdrawal fees?',
      answer: 'No fees to withdraw your metals from vault storage.',
    },
    {
      question: 'How does the deposit + wire option work?',
      answer: 'Pay 10% deposit by card (+ 3.5% fee on deposit), then wire remaining 90% within 48 hours.',
    },
  ];

  return (
    <>
      <SEOHead
        title="Pricing"
        description="Transparent pricing for precious metals trading and vault storage at Alex Lexington. No hidden fees. Gold margins 3-3.5%, silver 6-10%. Vault storage from $100/year."
        path="pricing"
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.3) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase mb-4">Transparent Pricing</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            No Hidden Fees.<br />
            <span className="italic" style={{ color: '#D4B77A' }}>No Surprises.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transparent pricing is how we've earned trust for four generations. What you see is what you pay — from trading margins to vault storage.
          </p>
        </div>
      </section>

      {/* Vault Storage Tiers */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Secure Vault Storage</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Segregated Storage <span className="italic" style={{ color: '#D4B77A' }}>Tiers</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Your metals, your bag, your bin. Every tier includes segregated storage and digital portfolio access through Maroon.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {vaultTiers.map((tier, i) => (
              <div
                key={i}
                className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
                  tier.popular
                    ? 'border-gold-500/40 bg-gold-500/[0.06] shadow-lg shadow-gold-500/5'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-[10px] font-bold tracking-[0.15em] uppercase rounded-full" style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)', color: '#0A2240' }}>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <p className="font-serif text-3xl font-light text-white">{tier.label}</p>
                  <p className="text-sm text-gray-400 mt-1">{tier.period}</p>
                  <div className="w-8 h-px bg-gold-500/30 mx-auto my-4" />
                  <p className="text-sm text-gray-300 font-medium">{tier.description}</p>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((feature, fi) => (
                      <li key={fi} className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-400">
              <svg className="w-5 h-5 text-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                <span className="text-gray-300 font-medium">$50 one-time initiation fee.</span>{' '}
                $25 processing fee for externally shipped metal (waived when purchased through Alex Lexington). Tiers auto-progress as portfolio value increases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Margins */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Trading</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Competitive <span className="italic" style={{ color: '#D4B77A' }}>Margins</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              All prices based on live FizTrade spot pricing. What you see is what you pay.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tradingMargins.map((item, i) => (
              <div key={i} className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-white">{item.metal}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{item.note}</p>
                </div>
                <div className="text-right">
                  <span className={`font-serif text-2xl font-light ${item.margin === 'Contact' ? 'text-gray-300 text-lg' : 'text-white'}`}>
                    {item.margin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Payments</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Payment <span className="italic" style={{ color: '#D4B77A' }}>Methods</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method, i) => (
              <div key={i} className="relative p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                {method.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase text-gold-500 border border-gold-500/30 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500 mb-5">
                  {method.icon}
                </div>
                <h3 className="font-serif text-lg text-white mb-1">{method.title}</h3>
                <p className="text-sm font-medium text-gold-500 mb-3">{method.fee}</p>
                <div className="space-y-1.5 text-sm text-gray-400">
                  <p>{method.speed}</p>
                  <p>{method.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Questions</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Frequently <span className="italic" style={{ color: '#D4B77A' }}>Asked</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left group"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gold-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                    <div className="w-full h-px bg-white/5 mb-4" />
                    <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
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
          <p className="text-gray-400 mb-8">Create your free account and start building your precious metals portfolio today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Get Started &mdash; Free Account</span>
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

export default PricingPage;
