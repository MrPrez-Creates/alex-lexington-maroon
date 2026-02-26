import React from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface HowItWorksPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate, onSignIn }) => {
  return (
    <>
      <SEOHead
        title="How It Works"
        description="Learn how Maroon by Alex Lexington works — create an account, fund your wallet, buy precious metals at live spot prices, store in our segregated vault, and track your portfolio."
        path="how-it-works"
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.3) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase mb-4">Simple &middot; Transparent &middot; Secure</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            Own Precious Metals<br />
            <span className="italic" style={{ color: '#D4B77A' }}>in Minutes</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Maroon makes precious metals ownership straightforward. No broker calls, no confusing paperwork, no hidden fees. Create an account, fund your wallet, and start building your portfolio with live spot pricing from FizTrade.
          </p>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">The Process</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Five Steps to <span className="italic" style={{ color: '#D4B77A' }}>Real Ownership</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: 'Create Your Account',
                desc: 'Sign up free in under two minutes. You\'ll receive your personal AL-XXXXXX account number instantly — used for wire transfers, vault access, and portfolio tracking.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                step: 2,
                title: 'Fund Your Wallet',
                desc: 'Wire transfer for same-day availability or link your bank account via Plaid for ACH funding. Your wallet balance is ready to spend the moment funds clear.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
              },
              {
                step: 3,
                title: 'Browse & Buy',
                desc: 'Live spot prices from FizTrade, updated every 5 minutes. 146+ products across gold, silver, platinum, and palladium — from American Eagles to PAMP bars.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                ),
              },
              {
                step: 4,
                title: 'Vault or Ship',
                desc: 'Choose segregated vault storage in our Atlanta facility — your metals, your bag, your bin. Or have them shipped directly to your door. Your choice on every order.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
              {
                step: 5,
                title: 'Track & Trade',
                desc: 'Real-time portfolio with per-metal breakdown — Au, Ag, Pt, Pd. Watch your holdings grow. Sell back anytime at competitive spot-based pricing, credited directly to your wallet.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`group p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-gold-500/20 hover:bg-white/[0.04] transition-all duration-300 ${item.step === 5 ? 'md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto lg:max-w-none' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500">
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500/50 uppercase">Step</span>
                    <span className="font-serif text-2xl font-light" style={{ color: '#D4B77A' }}>{item.step}</span>
                  </div>
                </div>
                <h3 className="font-serif text-xl text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Payment Methods</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Pay <span className="italic" style={{ color: '#D4B77A' }}>Your Way</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Multiple payment options designed for orders of every size. From a single coin to a six-figure portfolio build.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Wallet Balance',
                fee: '0% fee',
                feeColor: '#4ade80',
                desc: 'Pre-fund your wallet and buy instantly. No processing fees. Your balance, your timing. The fastest way to purchase.',
                best: 'Best for: Repeat buyers & large orders',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6" />
                  </svg>
                ),
              },
              {
                title: 'Credit Card',
                fee: '3.5% processing fee',
                feeColor: '#BD9A5F',
                desc: 'Powered by Stripe. Secure, instant card payment with embedded checkout. Fee passed through transparently — no hidden charges.',
                best: 'Best for: Smaller orders under $5K',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                ),
              },
              {
                title: 'Wire Transfer',
                fee: '0% fee',
                feeColor: '#4ade80',
                desc: 'Send a wire to fund your wallet same-day. Include your AL account number in the memo for automatic matching. No processing fees.',
                best: 'Best for: Large orders $5K+',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                ),
              },
              {
                title: 'ACH Bank Transfer',
                fee: '0% fee',
                feeColor: '#4ade80',
                desc: 'Link your bank account through Plaid for direct ACH transfers. Verified identity, seamless funding. Clears in 3-5 business days.',
                best: 'Best for: Recurring purchases & DCA',
                badge: 'Coming Soon',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
              },
            ].map((method, i) => (
              <div key={i} className="relative p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                {'badge' in method && method.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {method.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500 mb-4">
                  {method.icon}
                </div>
                <h3 className="font-serif text-xl text-white mb-1">{method.title}</h3>
                <span className="inline-block text-xs font-semibold mb-3" style={{ color: method.feeColor }}>{method.fee}</span>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{method.desc}</p>
                <p className="text-xs text-gray-500 italic">{method.best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Trust & Security</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Built on <span className="italic" style={{ color: '#D4B77A' }}>Trust</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Every layer of Maroon is designed with security and compliance at its core. Your metals and your data are protected.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Identity Verification',
                desc: 'Plaid-powered identity verification ensures every account is backed by a verified individual. Know your customer, always.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: 'Segregated Storage',
                desc: 'Your metals are never commingled with other clients. Your bag, your bin, your custody record. Individual tracking on every holding.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
              {
                title: 'Real-Time Access',
                desc: 'View your portfolio 24/7. Per-metal breakdown, live market values, transaction history, and withdrawal requests — all in your pocket.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                ),
              },
              {
                title: 'Professional Custody',
                desc: 'Metals held at Alex Lexington in Atlanta and IDS of Delaware — one of the nation\'s premier precious metals depositories. Insurance-grade custody.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold-500/10 text-gold-500 mb-4">
                  {item.icon}
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
            Start Building Your <span className="italic" style={{ color: '#D4B77A' }}>Portfolio</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Create your free account in under two minutes. No minimum purchase, no hidden fees, no long-term commitments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Start Building Your Portfolio</span>
            </button>
            <button
              onClick={() => onNavigate('pricing')}
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

export default HowItWorksPage;
