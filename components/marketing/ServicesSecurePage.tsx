import React from 'react';
import SEOHead from './SEOHead';
import type { ViewState } from '../../types';

interface ServicesSecurePageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

const ServicesSecurePage: React.FC<ServicesSecurePageProps> = ({ onNavigate, onSignIn }) => {
  return (
    <>
      <SEOHead
        title="Vault Storage — SECURE"
        description="Segregated precious metals vault storage by Alex Lexington. Your metals, your bag, your bin. Starting at $100/year. Digital access through the Maroon app."
        path="services-secure"
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(189,154,95,0.3) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <a href="https://alexlexington.com" target="_blank" rel="noopener noreferrer" className="inline-block mb-6">
            <img src="/logos/alex-lexington-white.png" alt="Alex Lexington" className="h-5 sm:h-7 mx-auto opacity-70 hover:opacity-100 transition-opacity" />
          </a>
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase mb-4">SECURE &middot; Vault Storage</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            Your Metals,<br />
            <span className="italic" style={{ color: '#D4B77A' }}>Your Vault</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Banks are closing safe deposit boxes across America. Alex Lexington fills the gap with purpose-built precious metals storage — segregated, insured, and accessible through the Maroon app. Starting at $100/year.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">The Problem</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-6">
                Banks Are <span className="italic" style={{ color: '#D4B77A' }}>Walking Away</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Major banks across the country are shutting down their safe deposit box programs. Customers are being given 60 days to remove their valuables — with nowhere to go.
                </p>
                <p>
                  Even when banks offered boxes, they were never designed for precious metals. No insurance on contents. No digital inventory. No metals expertise. No real-time value tracking. Just a steel drawer in a basement.
                </p>
                <p>
                  <em className="text-white">Alex Lexington was built for exactly this moment.</em> Nearly fifty years in precious metals, combined with modern custody infrastructure, creates a vault storage experience that banks never offered — and now never will.
                </p>
              </div>
            </div>
            {/* Problem Points */}
            <div className="space-y-4">
              {[
                { problem: 'Banks exiting safe deposit boxes', detail: 'JPMorgan, Wells Fargo, and regional banks closing box programs with as little as 60 days notice.' },
                { problem: 'No insurance on bank boxes', detail: 'FDIC does not cover safe deposit box contents. If your metals are lost or damaged, you have no recourse.' },
                { problem: 'No digital access', detail: 'Bank hours only. No inventory tracking, no value monitoring, no way to manage holdings remotely.' },
                { problem: 'No precious metals expertise', detail: 'Bank employees cannot help you evaluate, authenticate, or advise on metals storage.' },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{item.problem}</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How SECURE Works */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">How It Works</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Four Steps to <span className="italic" style={{ color: '#D4B77A' }}>Secure Storage</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                step: 1,
                title: 'Open Your Account',
                desc: 'One-time $50 initiation fee. Select the storage tier that matches your holdings. Your vault account is active immediately — ready to receive metals.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                ),
              },
              {
                step: 2,
                title: 'Deposit Your Metals',
                desc: 'Buy through Maroon and metals go straight to your vault. Or ship existing metals to us — $25 processing fee for externally shipped items, waived for AL purchases.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ),
              },
              {
                step: 3,
                title: 'Segregated Storage',
                desc: 'Your metals go into your own bag, in your own bin. Never commingled with other clients. Each holding tracked individually by product, weight, and location.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
              {
                step: 4,
                title: 'Digital Access',
                desc: 'Track every holding in the Maroon app. See bin locations, real-time market values, per-metal ozt breakdowns. Request withdrawals or sell back anytime.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-gold-500/20 hover:bg-white/[0.04] transition-all duration-300"
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

      {/* Always Segregated — Big Callout */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative p-8 sm:p-12 rounded-2xl border border-gold-500/20 overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(189,154,95,0.4) 0%, transparent 60%)' }} />
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gold-500/10 text-gold-500 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Our Promise</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-4">
                Always Segregated. <span className="italic" style={{ color: '#D4B77A' }}>Never Commingled.</span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6">
                Every client has their own bag. Every bag has its own bin. Your metals are never pooled, shared, or combined with anyone else's holdings. This is non-negotiable.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                {[
                  { label: 'Your Metals', detail: 'Individually identified and tracked from deposit to withdrawal' },
                  { label: 'Your Bag', detail: 'Sealed, labeled, and assigned exclusively to your account' },
                  { label: 'Your Bin', detail: 'Physical vault location visible in your Maroon portfolio' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <h4 className="font-serif text-lg text-white mb-1">{item.label}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storage Tiers */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Storage Tiers</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Choose Your <span className="italic" style={{ color: '#D4B77A' }}>Tier</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Five tiers based on the value of metals stored. Your tier auto-progresses as your holdings grow. Annual billing by default — no surprises.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { tier: 1, price: 100, monthly: '~$8.33' },
              { tier: 2, price: 250, monthly: '~$20.83' },
              { tier: 3, price: 500, monthly: '~$41.67' },
              { tier: 4, price: 1000, monthly: '~$83.33' },
              { tier: 5, price: 1800, monthly: '~$150.00' },
            ].map((item) => (
              <div
                key={item.tier}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-gold-500/20 hover:bg-white/[0.04] transition-all duration-300 text-center"
              >
                <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500/50 uppercase">Tier {item.tier}</span>
                <div className="mt-3 mb-1">
                  <span className="font-serif text-3xl font-light text-white">${item.price.toLocaleString()}</span>
                </div>
                <span className="text-xs text-gray-500">per year</span>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-gray-400">{item.monthly}/mo if monthly</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-400">
              <span className="text-white font-medium">$50 one-time initiation fee</span> at account opening.
            </p>
            <p className="text-sm text-gray-400">
              Annual billing default. Monthly billing available at a slight premium. Tier auto-progresses as your stored value increases.
            </p>
          </div>
        </div>
      </section>

      {/* What You Can Store */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Eligible Metals</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              What You Can <span className="italic" style={{ color: '#D4B77A' }}>Store</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                metal: 'Gold',
                symbol: 'Au',
                color: '#BD9A5F',
                items: ['American Gold Eagles', 'Canadian Maples', 'Krugerrands', 'Britannias', 'Philharmonics', 'PAMP & Credit Suisse bars', 'Pre-1933 US Gold', 'Generic gold bullion'],
              },
              {
                metal: 'Silver',
                symbol: 'Ag',
                color: '#C0C0C0',
                items: ['American Silver Eagles', 'Canadian Silver Maples', 'Silver rounds & bars', '90% silver coinage', 'PAMP & Engelhard bars', 'Generic silver bullion'],
              },
              {
                metal: 'Platinum',
                symbol: 'Pt',
                color: '#E5E4E2',
                items: ['American Platinum Eagles', 'Canadian Platinum Maples', 'Platinum bars', 'Generic platinum bullion'],
              },
              {
                metal: 'Palladium',
                symbol: 'Pd',
                color: '#CED0DD',
                items: ['Canadian Palladium Maples', 'Palladium bars', 'Generic palladium bullion'],
              },
            ].map((metal, i) => (
              <div key={i} className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                    <span className="font-serif text-lg font-semibold" style={{ color: metal.color }}>{metal.symbol}</span>
                  </div>
                  <h3 className="font-serif text-xl text-white">{metal.metal}</h3>
                </div>
                <ul className="space-y-2">
                  {metal.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                      <svg className="w-3.5 h-3.5 text-gold-500/50 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            Coins, bars, and rounds accepted. Contact us for specialty items or large collections.
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Physical Security</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3 mb-6">
                Atlanta Vault <span className="italic" style={{ color: '#D4B77A' }}>Facility</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Your metals are held in our secure vault facility in Atlanta, Georgia — the same city where Alex Lexington has operated since 1976. Professional custody, modern security, and decades of precious metals expertise under one roof.
                </p>
                <p>
                  For large holdings or overflow capacity, we partner with Dillon Gage and CNT Depository — among the largest and most respected precious metals depositories in the United States.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Physical Vault', desc: 'Purpose-built precious metals storage in Atlanta, GA' },
                { title: 'Professional Custody', desc: 'Insurance-grade custody records on every holding' },
                { title: 'Dillon Gage / CNT', desc: 'Overflow custody through the nation\'s top depositories' },
                { title: 'Individual Tracking', desc: 'Every item logged by product, weight, purity, and bin' },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 mb-3">
                    <span className="font-serif font-semibold text-sm">{i + 1}</span>
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Digital Portfolio */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold-500 uppercase">Maroon App</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-3">
              Your Vault, <span className="italic" style={{ color: '#D4B77A' }}>in Your Pocket</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Everything you need to manage your vault holdings — accessible 24/7 through the Maroon app.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Per-Metal Breakdown',
                desc: 'See troy ounces held for each metal individually — Au, Ag, Pt, Pd. Never combined, always clear.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                ),
              },
              {
                title: 'Real-Time Market Value',
                desc: 'Live spot prices applied to your holdings. Watch your portfolio value update throughout the trading day.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                ),
              },
              {
                title: 'Transaction History',
                desc: 'Complete record of deposits, purchases, sell-backs, and withdrawals. Your full audit trail in one place.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                title: 'Withdrawal Requests',
                desc: 'Request a withdrawal from your vault anytime. Ship metals to your address or pick up in Atlanta.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
              },
              {
                title: 'Bin Location Visibility',
                desc: 'See exactly where your metals are stored. Bin location displayed in your portfolio for full transparency.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
              },
              {
                title: 'Sell Back Anytime',
                desc: 'Sell vault holdings back to Alex Lexington at competitive spot-based pricing. Proceeds credited to your wallet instantly.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            Open Your <span className="italic" style={{ color: '#D4B77A' }}>Vault Account</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Segregated vault storage starting at $100/year. Your metals, your bag, your bin. Accessible 24/7 through the Maroon app.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #BD9A5F 0%, #D4B77A 100%)' }}
            >
              <span style={{ color: '#0A2240' }}>Open Your Vault Account</span>
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

export default ServicesSecurePage;
