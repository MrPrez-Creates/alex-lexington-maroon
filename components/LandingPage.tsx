
import React, { useEffect, useState, useMemo } from 'react';
import LiveTicker from './LiveTicker';
import { SpotPrices, MetalType, BullionItem } from '../types';
import { MOCK_SPOT_PRICES } from '../constants';
import { fetchMarketNews, fetchMediaLinks, NewsItem, MediaLinks } from '../services/newsService';

interface LandingPageProps {
  onEnterApp: () => void;
  onActivateAI?: () => void;
  user?: any;
  prices?: SpotPrices;
  inventory?: BullionItem[];
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onActivateAI, user, prices, inventory }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mediaItems, setMediaItems] = useState<NewsItem[]>([]);
  const [mediaLinks, setMediaLinks] = useState<MediaLinks | null>(null);
  const [mediaLoading, setMediaLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real Alex Lexington Network media feed
  useEffect(() => {
    let cancelled = false;
    const loadMedia = async () => {
      try {
        const [items, links] = await Promise.all([
          fetchMarketNews(undefined, 6),
          fetchMediaLinks(),
        ]);
        if (!cancelled) {
          setMediaItems(items);
          setMediaLinks(links);
        }
      } catch (e) {
        console.warn('Failed to load media feed:', e);
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    };
    loadMedia();
    return () => { cancelled = true; };
  }, []);

  const livePrices = prices || MOCK_SPOT_PRICES;

  // Format price helper
  const fmt = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Portfolio data: use REAL inventory when user is logged in, demo otherwise
  const portfolioData = useMemo(() => {
    if (user && inventory && inventory.length > 0) {
      // Aggregate real holdings by metal type
      const metals: Record<string, { oz: number; val: number }> = {};
      inventory.forEach(item => {
        const mt = item.metalType?.toLowerCase() || 'gold';
        if (!metals[mt]) metals[mt] = { oz: 0, val: 0 };
        const totalOz = item.weightAmount * item.quantity;
        metals[mt].oz += totalOz;
        metals[mt].val += totalOz * (livePrices[mt] || 0);
      });
      return {
        isReal: true,
        holdings: [
          metals.gold ? { sym: 'Au', name: 'Gold', metal: MetalType.GOLD, oz: metals.gold.oz, val: metals.gold.val, color: '#FFD700', bgColor: 'rgba(255,215,0,0.12)' } : null,
          metals.silver ? { sym: 'Ag', name: 'Silver', metal: MetalType.SILVER, oz: metals.silver.oz, val: metals.silver.val, color: '#C0C0C0', bgColor: 'rgba(192,192,192,0.12)' } : null,
          metals.platinum ? { sym: 'Pt', name: 'Platinum', metal: MetalType.PLATINUM, oz: metals.platinum.oz, val: metals.platinum.val, color: '#B4B4BE', bgColor: 'rgba(180,180,190,0.12)' } : null,
          metals.palladium ? { sym: 'Pd', name: 'Palladium', metal: MetalType.PALLADIUM, oz: metals.palladium.oz, val: metals.palladium.val, color: '#D4A574', bgColor: 'rgba(212,165,116,0.12)' } : null,
        ].filter(Boolean) as { sym: string; name: string; metal: MetalType; oz: number; val: number; color: string; bgColor: string }[],
      };
    }
    // Demo data for non-logged-in visitors
    const goldOz = 12.4;
    const silverOz = 310;
    const platOz = 3.23;
    return {
      isReal: false,
      holdings: [
        { sym: 'Au', name: 'Gold', metal: MetalType.GOLD, oz: goldOz, val: goldOz * (livePrices[MetalType.GOLD] || 0), color: '#FFD700', bgColor: 'rgba(255,215,0,0.12)' },
        { sym: 'Ag', name: 'Silver', metal: MetalType.SILVER, oz: silverOz, val: silverOz * (livePrices[MetalType.SILVER] || 0), color: '#C0C0C0', bgColor: 'rgba(192,192,192,0.12)' },
        { sym: 'Pt', name: 'Platinum', metal: MetalType.PLATINUM, oz: platOz, val: platOz * (livePrices[MetalType.PLATINUM] || 0), color: '#B4B4BE', bgColor: 'rgba(180,180,190,0.12)' },
      ],
    };
  }, [user, inventory, livePrices]);

  const totalVal = portfolioData.holdings.reduce((sum, h) => sum + h.val, 0);

  // Build Maverick demo chat using real data when available
  const maverickQuestion = useMemo(() => {
    if (user && portfolioData.isReal && portfolioData.holdings.length > 0) {
      const primary = portfolioData.holdings[0];
      return {
        question: `What is my ${primary.name.toLowerCase()} worth right now?`,
        answer: `Your ${primary.oz.toFixed(2)} oz of ${primary.name.toLowerCase()} is currently worth`,
        value: primary.val,
        spotLabel: `at today's spot price of $${fmt(livePrices[primary.metal] || 0)}/oz.`,
      };
    }
    const goldVal = 12.4 * (livePrices[MetalType.GOLD] || 0);
    return {
      question: 'What is my gold worth right now?',
      answer: 'Your 12.4 oz of gold is currently worth',
      value: goldVal,
      spotLabel: `at today's spot price of $${fmt(livePrices[MetalType.GOLD] || 0)}/oz.`,
    };
  }, [user, portfolioData, livePrices]);

  // Media type badge colors
  const mediaTypeStyle = (type: string) => {
    switch (type) {
      case 'blog': return { bg: 'rgba(189,154,95,0.15)', color: '#BD9A5F', label: 'Blog' };
      case 'podcast': return { bg: 'rgba(76,175,80,0.15)', color: '#4CAF50', label: 'Podcast' };
      case 'youtube': return { bg: 'rgba(255,0,0,0.12)', color: '#FF4444', label: 'YouTube' };
      default: return { bg: 'rgba(189,154,95,0.15)', color: '#BD9A5F', label: 'Article' };
    }
  };

  // Time-ago formatter
  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden selection:text-navy-900"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: '#0A2240',
        color: '#FFFFFF',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ═══ LIVE TICKER ═══ */}
      <div
        className="sticky top-0 z-[100] border-b"
        style={{ background: '#0D2A4D', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <LiveTicker prices={livePrices} />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav
        className="flex justify-between items-center relative z-10"
        style={{ padding: '20px clamp(24px, 4vw, 48px)' }}
      >
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={onEnterApp}>
          <div
            className="flex items-center justify-center"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C9A96E, #BD9A5F, #A8864E)',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '20px',
              fontWeight: 600,
              color: '#0A2240',
            }}
          >
            M
          </div>
          <div className="flex flex-col">
            <span
              className="block text-white"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '20px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Maroon
            </span>
            <span
              className="block"
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: '#BD9A5F',
                textTransform: 'uppercase',
                marginTop: '-2px',
              }}
            >
              By Alex Lexington
            </span>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={onEnterApp}
            className="hidden sm:block transition-all duration-300"
            style={{
              background: 'transparent',
              border: '1px solid rgba(189,154,95,0.25)',
              color: '#D4B77A',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            onClick={onEnterApp}
            className="transition-all duration-300 hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg, #BD9A5F, #A8864E)',
              border: 'none',
              color: '#0A2240',
              padding: '10px 28px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
          >
            {user ? 'Enter Dashboard' : 'Get Started'}
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden text-center" style={{ padding: '80px clamp(24px, 4vw, 48px) 60px' }}>
        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-40%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(ellipse at center, rgba(189,154,95,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-[1] max-w-[720px] mx-auto">
          <div
            className="mb-6"
            style={{
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#BD9A5F',
              fontWeight: 500,
            }}
          >
            Precious Metals Portfolio Management
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(42px, 5.5vw, 64px)',
              fontWeight: 300,
              lineHeight: 1.1,
              marginBottom: '24px',
              letterSpacing: '-0.01em',
            }}
          >
            Your Wealth,<br />
            <em style={{ fontStyle: 'italic', color: '#D4B77A' }}>Refined.</em>
          </h1>
          <p
            className="mx-auto"
            style={{
              fontSize: '17px',
              lineHeight: 1.7,
              color: '#D9D8D6',
              maxWidth: '540px',
              marginBottom: '40px',
              fontWeight: 400,
            }}
          >
            Track your precious metals portfolio in real time, store securely in our vault,
            and build wealth automatically — all from one place. Powered by four generations of trust.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onEnterApp}
              className="transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #BD9A5F, #A8864E)',
                border: 'none',
                color: '#0A2240',
                padding: '14px 40px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                cursor: 'pointer',
              }}
            >
              Open Your Account
            </button>
            <a
              href="#features"
              className="transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(189,154,95,0.25)',
                color: '#D4B77A',
                padding: '14px 40px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <div className="flex justify-center flex-wrap" style={{ gap: '48px', padding: '40px clamp(24px, 4vw, 48px)' }}>
        {[
          { value: '1976', label: 'Established' },
          { value: '4th Gen', label: 'Family Owned' },
          { value: 'Atlanta', label: 'Headquartered' },
          { value: 'Insured', label: 'Vault Storage' },
        ].map((item, i, arr) => (
          <React.Fragment key={i}>
            <div className="text-center">
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '28px',
                  fontWeight: 400,
                  color: '#BD9A5F',
                  marginBottom: '4px',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#A9A89F',
                }}
              >
                {item.label}
              </div>
            </div>
            {i < arr.length - 1 && (
              <div
                className="self-center hidden sm:block"
                style={{
                  width: '1px',
                  height: '48px',
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Section Divider */}
      <div
        className="mx-auto"
        style={{
          width: '60px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #BD9A5F, transparent)',
        }}
      />

      {/* ═══ FEATURES ═══ */}
      <section
        id="features"
        className="mx-auto"
        style={{ padding: '80px clamp(24px, 4vw, 48px)', maxWidth: '1200px' }}
      >
        <div className="text-center" style={{ marginBottom: '64px' }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(32px, 4vw, 44px)',
              fontWeight: 300,
              marginBottom: '16px',
            }}
          >
            Everything You Need to<br />Invest in Precious Metals
          </h2>
          <p className="mx-auto" style={{ color: '#A9A89F', fontSize: '16px', maxWidth: '480px', lineHeight: 1.6 }}>
            A complete platform purpose-built for the modern metals investor.
          </p>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {[
            {
              icon: '📊',
              title: 'Live Portfolio Tracking',
              desc: 'See your gold, silver, platinum, and palladium holdings valued in real time against live spot prices. Track performance, allocation, and total value at a glance.',
              tag: 'Available Now',
              tagStyle: 'live',
            },
            {
              icon: '🏦',
              title: 'Secure Vault Storage',
              desc: 'Store your metals in our insured, audited vault facility. Tiered pricing based on holdings value. No more worrying about home security — we handle it.',
              tag: 'Spring 2026',
              tagStyle: 'coming',
            },
            {
              icon: '🔄',
              title: 'Auto-Invest (DCA)',
              desc: "Set it and forget it. Automatically purchase gold or silver on a schedule — weekly, bi-weekly, or monthly. Build your position consistently with dollar-cost averaging.",
              tag: 'Coming Soon',
              tagStyle: 'coming',
            },
            {
              icon: '🔔',
              title: 'Price Alerts',
              desc: 'Set custom alerts for any metal at any price point. Get notified instantly when the market hits your target — so you never miss an opportunity to buy or sell.',
              tag: 'Coming Soon',
              tagStyle: 'coming',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="relative overflow-hidden transition-all duration-400 group"
              style={{
                background: 'rgba(13,42,77,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: 'clamp(28px, 3vw, 40px) clamp(24px, 2.5vw, 36px)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="mb-6 flex items-center justify-center"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  fontSize: '24px',
                  background: 'rgba(189,154,95,0.15)',
                  border: '1px solid rgba(189,154,95,0.12)',
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '24px',
                  fontWeight: 400,
                  marginBottom: '12px',
                  letterSpacing: '0.01em',
                }}
              >
                {feature.title}
              </h3>
              <p style={{ color: '#A9A89F', fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
                {feature.desc}
              </p>
              <span
                className="inline-block"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '5px 14px',
                  borderRadius: '100px',
                  fontWeight: 600,
                  ...(feature.tagStyle === 'live'
                    ? { background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }
                    : { background: 'rgba(189,154,95,0.15)', color: '#BD9A5F' }),
                }}
              >
                {feature.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section Divider */}
      <div
        className="mx-auto"
        style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #BD9A5F, transparent)' }}
      />

      {/* ═══ SPOTLIGHT — Portfolio Preview ═══ */}
      <section className="mx-auto" style={{ padding: '80px clamp(24px, 4vw, 48px)', maxWidth: '1200px' }}>
        <div className="grid items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px' }}>
          {/* Text Side */}
          <div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(32px, 4vw, 42px)',
                fontWeight: 300,
                marginBottom: '20px',
                lineHeight: 1.15,
              }}
            >
              Your Metals.<br />
              <em style={{ fontStyle: 'italic', color: '#D4B77A' }}>One Dashboard.</em>
            </h2>
            <p style={{ color: '#D9D8D6', fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
              Whether you hold one ounce of gold or a diversified metals portfolio,
              Maroon gives you instant clarity on what you own, what it's worth,
              and how it's performing.
            </p>
            <div className="flex flex-col" style={{ gap: '16px', marginBottom: '36px' }}>
              {[
                'Real-time valuation against live spot prices',
                'Complete order history and transaction records',
                'Vault vs. home storage breakdown',
                'Performance tracking with gain/loss over time',
              ].map((feat, i) => (
                <div key={i} className="flex items-start" style={{ gap: '14px' }}>
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#BD9A5F',
                      marginTop: '7px',
                    }}
                  />
                  <span style={{ color: '#D9D8D6', fontSize: '15px', lineHeight: 1.5 }}>{feat}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onEnterApp}
              className="transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #BD9A5F, #A8864E)',
                border: 'none',
                color: '#0A2240',
                padding: '14px 40px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                cursor: 'pointer',
              }}
            >
              {user ? 'View Your Portfolio' : 'Sign In to Your Portfolio'}
            </button>
          </div>

          {/* Portfolio Preview Card — LIVE DATA */}
          <div
            className="relative overflow-hidden"
            style={{
              background: '#0D2A4D',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            {/* Radial glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '-100px',
                right: '-100px',
                width: '250px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(189,154,95,0.06), transparent 70%)',
              }}
            />
            <div className="flex justify-between items-start relative" style={{ marginBottom: '28px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#A9A89F', marginBottom: '4px' }}>
                  {portfolioData.isReal ? 'Your Portfolio Value' : 'Sample Portfolio Value'}
                </div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '36px',
                    fontWeight: 400,
                  }}
                >
                  ${fmt(totalVal)}
                </div>
                <div
                  className="inline-flex items-center"
                  style={{
                    gap: '4px',
                    fontSize: '13px',
                    color: '#4CAF50',
                    background: 'rgba(76,175,80,0.15)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    marginTop: '8px',
                  }}
                >
                  ▲ Live Spot
                </div>
              </div>
              {!portfolioData.isReal && (
                <div
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#A9A89F',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}
                >
                  Demo
                </div>
              )}
            </div>

            <div className="flex flex-col" style={{ gap: '12px' }}>
              {portfolioData.holdings.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between transition-all duration-300"
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 700,
                        background: h.bgColor,
                        color: h.color,
                      }}
                    >
                      {h.sym}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: '12px', color: '#A9A89F' }}>{h.oz.toFixed(h.oz < 10 ? 2 : 1)} oz</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>${fmt(h.val)}</div>
                    <div style={{ fontSize: '12px', color: '#4CAF50' }}>
                      ${fmt(livePrices[h.metal] || 0)}/oz
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div
        className="mx-auto"
        style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #BD9A5F, transparent)' }}
      />

      {/* ═══ ALEX LEXINGTON NETWORK — Real Media Feed ═══ */}
      <section className="mx-auto" style={{ padding: '80px clamp(24px, 4vw, 48px)', maxWidth: '1200px' }}>
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <div
            className="mb-4"
            style={{
              color: '#BD9A5F',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Stay Connected
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(32px, 4vw, 42px)',
              fontWeight: 300,
              marginBottom: '16px',
            }}
          >
            Alex Lexington Network
          </h2>
          <p className="mx-auto" style={{ color: '#A9A89F', fontSize: '16px', maxWidth: '520px', lineHeight: 1.6 }}>
            Market insights, precious metals education, and behind-the-scenes from our blog, podcast, and YouTube channel.
          </p>
        </div>

        {/* Media Grid */}
        {mediaLoading ? (
          <div className="flex justify-center items-center" style={{ height: '200px' }}>
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(189,154,95,0.15)' }} />
              <div style={{ fontSize: '14px', color: '#A9A89F' }}>Loading media feed...</div>
            </div>
          </div>
        ) : mediaItems.length > 0 ? (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {mediaItems.slice(0, 6).map((item) => {
              const badge = mediaTypeStyle(item.type);
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden transition-all duration-300"
                  style={{
                    background: 'rgba(13,42,77,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '0',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Thumbnail */}
                  {(() => {
                    const thumbnailSrc = item.type === 'youtube' && item.videoId
                      ? `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
                      : item.imageUrl || null;

                    if (thumbnailSrc) {
                      return (
                        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          <img
                            src={thumbnailSrc}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{ display: 'block' }}
                          />
                          {/* Play overlay for YouTube */}
                          {item.type === 'youtube' && (
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ background: 'rgba(0,0,0,0.3)' }}
                            >
                              <div
                                className="flex items-center justify-center rounded-full"
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  background: 'rgba(255,0,0,0.9)',
                                }}
                              >
                                <svg className="w-5 h-5 ml-1" fill="white" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                          {/* Podcast overlay icon */}
                          {item.type === 'podcast' && (
                            <div
                              className="absolute bottom-3 left-3 flex items-center justify-center rounded-full"
                              style={{
                                width: '36px',
                                height: '36px',
                                background: 'rgba(30,215,96,0.9)',
                              }}
                            >
                              <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Fallback placeholder for items with no image
                    return (
                      <div
                        className="relative overflow-hidden flex items-center justify-center"
                        style={{
                          aspectRatio: '16/9',
                          background: 'linear-gradient(135deg, rgba(189,154,95,0.08), rgba(13,42,77,0.8))',
                        }}
                      >
                        <div className="text-center" style={{ color: 'rgba(189,154,95,0.4)' }}>
                          {item.type === 'podcast' ? (
                            <svg className="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          ) : (
                            <svg className="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          )}
                          <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {item.type === 'podcast' ? 'Podcast' : 'Article'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ padding: 'clamp(20px, 2vw, 28px)' }}>
                    {/* Type badge + date */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '3px 10px',
                          borderRadius: '100px',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#A9A89F' }}>
                        {timeAgo(item.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="group-hover:text-[#D4B77A] transition-colors duration-300"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '20px',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        marginBottom: item.summary ? '10px' : '0',
                        color: '#FFFFFF',
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                      <p
                        style={{
                          fontSize: '13.5px',
                          color: '#A9A89F',
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.summary}
                      </p>
                    )}

                    {/* Duration for podcasts */}
                    {item.type === 'podcast' && item.duration && (
                      <div className="flex items-center mt-3" style={{ gap: '6px', color: '#4CAF50', fontSize: '12px' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.duration}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        ) : null}

        {/* Social Links */}
        <div className="flex justify-center flex-wrap mt-12" style={{ gap: '16px' }}>
          {[
            { label: 'Spotify', url: mediaLinks?.spotify || 'https://open.spotify.com/show/263hqyQ6uyijeNtrOgTmS7', icon: '🎙️' },
            { label: 'YouTube', url: mediaLinks?.youtube || 'https://www.youtube.com/@alexlexingtonnetwork', icon: '📺' },
            { label: 'Instagram', url: mediaLinks?.instagram || 'https://www.instagram.com/alex.lexington.precious.metals/', icon: '📸' },
            { label: 'TikTok', url: mediaLinks?.tiktok || 'https://www.tiktok.com/@alex_lexington_network', icon: '🎵' },
            { label: 'Blog', url: 'https://alexlexington.com/blogs/news', icon: '📝' },
          ].map((social, i) => (
            <a
              key={i}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(189,154,95,0.2)',
                borderRadius: '10px',
                padding: '10px 20px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                color: '#D4B77A',
                letterSpacing: '0.02em',
              }}
            >
              <span>{social.icon}</span>
              <span>{social.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Section Divider */}
      <div
        className="mx-auto"
        style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #BD9A5F, transparent)' }}
      />

      {/* ═══ AI CONCIERGE SECTION ═══ */}
      <section className="relative overflow-hidden border-t" style={{ padding: '80px clamp(24px, 4vw, 48px)', borderColor: 'rgba(255,255,255,0.05)', background: '#081C36' }}>
        <div className="absolute top-0 right-0 pointer-events-none" style={{ width: '50vw', height: '50vw', background: 'rgba(189,154,95,0.05)', borderRadius: '50%', filter: 'blur(100px)' }} />

        <div className="mx-auto grid items-center relative z-10" style={{ maxWidth: '1200px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px' }}>
          {/* Simulated Chat Interface */}
          <div className="relative mx-auto lg:mx-0" style={{ maxWidth: '400px', width: '100%' }}>
            <div
              className="overflow-hidden shadow-2xl relative"
              style={{
                background: '#0A2240',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '24px',
              }}
            >
              {/* Chat Header */}
              <div className="flex items-center border-b pb-4 mb-6" style={{ gap: '12px', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: '#BD9A5F', boxShadow: '0 4px 15px rgba(189,154,95,0.2)' }}
                >
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: '#0A2240' }}>M</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Maverick AI</div>
                  <div className="text-[10px] flex items-center" style={{ color: '#4CAF50', gap: '4px' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4CAF50' }} />
                    ONLINE
                  </div>
                </div>
              </div>

              {/* Messages — driven by real or demo data */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* User */}
                <div className="flex justify-end">
                  <div
                    className="text-sm"
                    style={{
                      background: '#0D2A4D',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '16px 4px 16px 16px',
                      padding: '12px 16px',
                      color: '#D9D8D6',
                      maxWidth: '85%',
                    }}
                  >
                    {maverickQuestion.question}
                  </div>
                </div>
                {/* AI Response */}
                <div className="flex justify-start">
                  <div
                    className="text-sm shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(189,154,95,0.1), #0D2A4D)',
                      border: '1px solid rgba(189,154,95,0.2)',
                      borderRadius: '4px 16px 16px 16px',
                      padding: '14px 16px',
                      color: '#FFFFFF',
                      maxWidth: '90%',
                    }}
                  >
                    <p className="mb-2 leading-relaxed">
                      {maverickQuestion.answer}{' '}
                      <span style={{ color: '#BD9A5F', fontWeight: 700 }}>${fmt(maverickQuestion.value)}</span>{' '}
                      {maverickQuestion.spotLabel}
                    </p>
                    <p className="text-xs italic" style={{ color: '#A9A89F' }}>
                      Would you like me to set a price alert or check your full portfolio?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="mt-6 relative">
                <div
                  className="h-12 rounded-full flex items-center px-4 justify-between"
                  style={{ background: '#081C36', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="rounded-full" style={{ width: '96px', height: '8px', background: 'rgba(255,255,255,0.05)' }} />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(189,154,95,0.2)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#BD9A5F" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Side */}
          <div>
            <div
              className="mb-4"
              style={{
                color: '#BD9A5F',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              Maverick AI
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(32px, 4vw, 42px)',
                fontWeight: 300,
                marginBottom: '20px',
                lineHeight: 1.15,
              }}
            >
              Your Private<br />Bullion Concierge.
            </h2>
            <div style={{ width: '80px', height: '4px', background: '#BD9A5F', marginBottom: '32px', borderRadius: '2px' }} />
            <p style={{ fontSize: '16px', color: '#A9A89F', lineHeight: 1.7, marginBottom: '32px' }}>
              Maverick AI is a sophisticated financial intelligence engine capable of auditing your vault,
              analyzing global market trends, and providing instant coin and bullion valuations — all through natural conversation.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
              {[
                'Instant Portfolio Audits',
                'Real-time Market Sentiment Analysis',
                'Coin & Bullion Melt Value Calculator',
                '24/7 Wealth Intelligence',
              ].map((item, i) => (
                <li key={i} className="flex items-center" style={{ gap: '12px' }}>
                  <div className="flex-shrink-0" style={{ width: '6px', height: '6px', background: '#BD9A5F', borderRadius: '50%' }} />
                  <span style={{ color: '#FFFFFF', fontWeight: 500, letterSpacing: '0.02em' }}>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onActivateAI || onEnterApp}
              className="flex items-center group transition-colors duration-300"
              style={{
                gap: '12px',
                color: '#BD9A5F',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontSize: '13px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>{user ? 'Activate Concierge' : 'Login to Activate'}</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="mx-auto" style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #BD9A5F, transparent)' }} />

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="mx-auto text-center" style={{ padding: '80px clamp(24px, 4vw, 48px)', maxWidth: '900px' }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(32px, 4vw, 42px)',
            fontWeight: 300,
            marginBottom: '56px',
          }}
        >
          Getting Started Is Simple
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          {[
            {
              num: '01',
              title: 'Create Your Account',
              desc: "Set up your Maroon profile with Alex Lexington. We'll assign you a permanent account number for all future transactions.",
            },
            {
              num: '02',
              title: 'Buy or Transfer Metals',
              desc: 'Purchase gold, silver, or platinum at competitive wholesale pricing — or transfer existing holdings into your portfolio.',
            },
            {
              num: '03',
              title: 'Track & Grow',
              desc: 'Monitor your portfolio in real time, set up auto-invest, and store securely in our vault. Your wealth, your way.',
            },
          ].map((step, i) => (
            <div key={i}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '48px',
                  fontWeight: 300,
                  color: 'rgba(189,154,95,0.3)',
                  marginBottom: '16px',
                  lineHeight: 1,
                }}
              >
                {step.num}
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '22px',
                  fontWeight: 400,
                  marginBottom: '10px',
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#A9A89F', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="text-center relative" style={{ padding: '100px clamp(24px, 4vw, 48px)' }}>
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '400px',
            background: 'linear-gradient(180deg, transparent, rgba(13,42,77,0.5))',
          }}
        />
        <div className="relative z-[1] mx-auto" style={{ maxWidth: '560px' }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(32px, 4vw, 44px)',
              fontWeight: 300,
              marginBottom: '16px',
              lineHeight: 1.15,
            }}
          >
            Ready to Take Control<br />of Your Portfolio?
          </h2>
          <p style={{ color: '#A9A89F', fontSize: '16px', lineHeight: 1.6, marginBottom: '36px' }}>
            Join the families and individuals who trust Alex Lexington to
            safeguard and grow their precious metals investments.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onEnterApp}
              className="transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #BD9A5F, #A8864E)',
                border: 'none',
                color: '#0A2240',
                padding: '14px 40px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                cursor: 'pointer',
              }}
            >
              Open Your Account
            </button>
            <a
              href="tel:+14048158893"
              className="transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(189,154,95,0.25)',
                color: '#D4B77A',
                padding: '14px 40px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Call Us: (404) 815-8893
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="flex justify-between items-center flex-wrap"
        style={{
          padding: '40px clamp(24px, 4vw, 48px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          gap: '16px',
        }}
      >
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#A9A89F' }}>
          <strong style={{ color: '#BD9A5F', fontWeight: 400 }}>Alex Lexington</strong> — Precious Metals & Fine Jewelry
        </div>
        <div className="flex" style={{ gap: '32px' }}>
          {[
            { label: 'Privacy', href: '#' },
            { label: 'Terms', href: '#' },
            { label: 'Contact', href: '#' },
            { label: 'AlexLexington.com', href: 'https://alexlexington.com' },
          ].map((link, i) => (
            <a
              key={i}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="transition-colors duration-300 hover:text-[#D4B77A]"
              style={{
                fontSize: '13px',
                color: '#A9A89F',
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#A9A89F',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Est. 1976 &bull; Atlanta, Georgia
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
