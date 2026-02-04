
import React, { useEffect, useState, useMemo } from 'react';
import LiveTicker from './LiveTicker';
import { SpotPrices } from '../types';
import { MOCK_SPOT_PRICES } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LandingPageProps {
  onEnterApp: () => void;
  onActivateAI?: () => void;
  user?: any;
  prices?: SpotPrices;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onActivateAI, user, prices }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMarketPreview, setShowMarketPreview] = useState(false);
  const [previewMetal, setPreviewMetal] = useState<'gold' | 'silver'>('gold');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Generate random particles once
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      duration: `${Math.random() * 10 + 15}s`,
      delay: `${Math.random() * 10}s`,
      opacity: Math.random() * 0.5 + 0.1
    }));
  }, []);

  // Mock data for the preview chart - appealing upward trend
  const previewChartData = useMemo(() => {
    const data = [];
    let value = previewMetal === 'gold' ? 2400 : 28; // Start around gold/silver price
    const volatility = previewMetal === 'gold' ? 40 : 0.5;
    for (let i = 0; i < 30; i++) {
        const change = (Math.random() * volatility) - (volatility * 0.35); // Net positive bias
        value += change;
        data.push({ name: `Day ${i+1}`, value });
    }
    return data;
  }, [previewMetal]);

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans overflow-x-hidden selection:bg-gold-500 selection:text-navy-900">
      
      {/* Navigation - Glassmorphic */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-navy-900/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 transform rotate-45 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:rotate-0 transition-transform duration-500">
              <span className="font-serif font-bold text-navy-900 text-xl transform -rotate-45 group-hover:rotate-0 transition-transform duration-500">M</span>
            </div>
            <div>
              <span className="block font-serif font-bold text-xl tracking-widest leading-none text-white">MAROON</span>
              <span className="block text-[9px] text-gold-500 tracking-[0.3em] leading-none mt-1 opacity-80">BY ALEX LEXINGTON</span>
            </div>
          </div>
          <button 
            onClick={onEnterApp}
            className="hidden md:block bg-transparent hover:bg-gold-500/10 text-gold-500 border border-gold-500/50 text-xs font-bold py-3 px-8 rounded-sm tracking-[0.2em] transition-all uppercase hover:border-gold-500 hover:text-white"
          >
            {user ? 'Enter Dashboard' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* 1. Cinematic Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 lg:pt-20 overflow-hidden pb-16">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-navy-900" />
            
            {/* Animated Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-gold-500/10 rounded-full blur-[100px] animate-blob mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none" />
            <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] bg-purple-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen pointer-events-none" />

            {/* Mouse Spotlight */}
            <div 
              className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
              style={{ 
                background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.08), transparent 40%)` 
              }}
            />

            {/* Drifting Gold Dust Particles */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {particles.map((p) => (
                <div 
                  key={p.id}
                  className="absolute rounded-full bg-gold-400"
                  style={{
                    left: p.left,
                    top: '100%',
                    width: p.width,
                    height: p.height,
                    opacity: p.opacity,
                    animation: `drift-up ${p.duration} linear infinite`,
                    animationDelay: p.delay
                  }}
                />
              ))}
            </div>

            {/* Grid Overlay with Scroll Parallax */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)', 
                    backgroundSize: '80px 80px',
                    transform: `translateY(${scrollY * 0.2}px)`
                }}>
            </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-12 gap-12 items-center">
            {/* Text Content */}
            <div className="lg:col-span-7 text-left order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6 animate-fade-in-up backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-500">Private Beta</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium leading-[0.9] mb-6 text-white animate-fade-in-up delay-100 drop-shadow-2xl">
                    Wealth, <br/>
                    <span className="text-gradient-gold italic">Refined.</span>
                </h1>
                
                <p className="text-base md:text-lg text-gray-400 font-light max-w-xl leading-relaxed mb-10 animate-fade-in-up delay-200 border-l border-gold-500/30 pl-6 backdrop-blur-sm bg-navy-900/10">
                    The security of physical allocation. The liquidity of digital assets. 
                    Maroon is the definitive bridge between your legacy and the future of finance.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
                    <button 
                        onClick={onEnterApp}
                        className="group relative px-8 py-4 bg-gold-500 text-navy-900 font-bold tracking-widest uppercase text-xs md:text-sm overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300"
                    >
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300">{user ? 'Open Dashboard' : 'Sign In'}</span>
                        <div className="absolute inset-0 bg-navy-800 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                    </button>
                    
                    <button 
                        onClick={() => setShowMarketPreview(true)}
                        className="px-8 py-4 border border-white/10 text-white font-bold tracking-widest uppercase text-xs md:text-sm hover:bg-white/5 transition-colors backdrop-blur-sm"
                    >
                        View Markets
                    </button>
                </div>
            </div>

            {/* Hero Visual - Holographic Card */}
            {/* Visible on all screens, stacked below text on mobile */}
            <div className="lg:col-span-5 relative animate-float delay-500 order-2 mt-8 lg:mt-0 flex justify-center lg:block">
                <div className="holo-card rounded-2xl p-6 md:p-8 transform rotate-0 lg:rotate-[-5deg] lg:hover:rotate-0 transition-all duration-700 ease-out backdrop-blur-xl w-full max-w-[320px] md:max-w-md lg:max-w-full scale-95 md:scale-100">
                    <div className="flex justify-between items-start mb-8 md:mb-12">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gold-500/30 flex items-center justify-center">
                            <span className="font-serif font-bold text-gold-500 text-lg md:text-xl">M</span>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-gold-500 mb-1">Total Balance</div>
                            <div className="text-2xl md:text-3xl font-mono font-bold text-white">$124,592.40</div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4 mb-8 md:mb-12">
                         <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-gold-500 rounded-sm"></div>
                                <div>
                                    <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">Gold Allocation</div>
                                    <div className="text-xs md:text-sm font-bold text-white">32.50 oz</div>
                                </div>
                            </div>
                            <div className="text-green-400 text-xs font-mono">+2.4%</div>
                         </div>
                         <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-gray-400 rounded-sm"></div>
                                <div>
                                    <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">Silver Allocation</div>
                                    <div className="text-xs md:text-sm font-bold text-white">450.00 oz</div>
                                </div>
                            </div>
                            <div className="text-green-400 text-xs font-mono">+1.8%</div>
                         </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/10 pt-6">
                        <div className="text-[10px] text-gray-500 font-mono">
                            VAULT ID: 8829-X <br/>
                            LOCATION: NEW YORK
                        </div>
                        <div className="w-16 h-8 bg-gold-500/20 rounded blur-xl absolute bottom-6 right-6"></div>
                        <div className="text-gold-500 text-[10px] font-bold tracking-widest uppercase">Verified</div>
                    </div>
                </div>
                
                {/* Decorative Elements around card */}
                <div className="absolute -top-6 -right-6 lg:-top-10 lg:-right-10 w-20 h-20 md:w-24 md:h-24 border-t border-r border-gold-500/20 rounded-tr-3xl animate-pulse-slow"></div>
                <div className="absolute -bottom-6 -left-6 lg:-bottom-10 lg:-left-10 w-20 h-20 md:w-24 md:h-24 border-b border-l border-gold-500/20 rounded-bl-3xl animate-pulse-slow delay-700"></div>
            </div>
        </div>

        {/* Live Ticker Anchored Bottom */}
        <div className="absolute bottom-0 w-full z-20 border-t border-white/10 bg-navy-900/50 backdrop-blur-md">
            <LiveTicker prices={prices || MOCK_SPOT_PRICES} />
        </div>
      </section>

      {/* --- MARKET PREVIEW MODAL --- */}
      {showMarketPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/95 backdrop-blur-xl animate-fade-in p-4">
              <div className="w-full max-w-5xl bg-navy-900 border border-gold-500/20 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-[80vh] max-h-[600px]">
                  
                  {/* Close Button */}
                  <button 
                      onClick={() => setShowMarketPreview(false)}
                      className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white p-2 bg-black/20 rounded-full backdrop-blur-sm"
                  >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  {/* Left: Chart Visualization */}
                  <div className="flex-1 p-8 bg-gradient-to-b from-navy-800 to-navy-900 relative flex flex-col">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 via-transparent to-gold-500 opacity-50"></div>
                      
                      <div className="flex justify-between items-end mb-8 relative z-10">
                          <div>
                              <div className="flex gap-2 mb-4">
                                <button 
                                    onClick={() => setPreviewMetal('gold')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${previewMetal === 'gold' ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                >
                                    Gold
                                </button>
                                <button 
                                    onClick={() => setPreviewMetal('silver')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${previewMetal === 'silver' ? 'bg-gray-300 text-navy-900' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                >
                                    Silver
                                </button>
                              </div>
                              <div className="text-3xl font-serif text-white capitalize">{previewMetal} / USD</div>
                          </div>
                          <div className="text-right">
                              <div className="text-2xl font-mono text-white font-bold">
                                  ${(prices?.[previewMetal] || (previewMetal === 'gold' ? 4617 : 88)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </div>
                              <div className="text-green-500 text-xs font-bold">+1.24%</div>
                          </div>
                      </div>

                      <div className="flex-1 w-full relative min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={previewChartData}>
                                  <defs>
                                      <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={previewMetal === 'gold' ? '#D4AF37' : '#C0C0C0'} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={previewMetal === 'gold' ? '#D4AF37' : '#C0C0C0'} stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.3} />
                                  <XAxis dataKey="name" hide />
                                  <YAxis domain={['auto', 'auto']} hide />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: '#0A2240', borderColor: '#153b63', color: '#fff', fontSize: '12px' }}
                                      itemStyle={{ color: previewMetal === 'gold' ? '#D4AF37' : '#C0C0C0' }}
                                      formatter={(val: number) => [`$${val.toFixed(2)}`, 'Price']}
                                  />
                                  <Area 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke={previewMetal === 'gold' ? '#D4AF37' : '#C0C0C0'} 
                                      strokeWidth={2}
                                      fill="url(#previewGrad)"
                                  />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>

                      <div className="mt-6 flex justify-between text-[10px] text-gray-500 font-mono border-t border-white/5 pt-4">
                          <span>30 DAY PERFORMANCE VIEW</span>
                          <span>UPDATED: LIVE</span>
                      </div>
                  </div>

                  {/* Right: Trade Action Sidebar */}
                  <div className="w-full md:w-80 p-8 bg-navy-950 flex flex-col border-l border-white/5 relative">
                      <div className="mb-auto">
                          <h3 className="text-lg font-bold text-white mb-2">Trade {previewMetal.charAt(0).toUpperCase() + previewMetal.slice(1)}</h3>
                          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                              Execute trades instantly with allocated storage or request physical delivery.
                          </p>
                          
                          <div className="space-y-3">
                              <button 
                                  onClick={onEnterApp}
                                  className="w-full py-4 bg-green-500 hover:bg-green-400 text-navy-900 font-bold rounded-xl transition-all shadow-lg flex items-center justify-between px-6 group"
                              >
                                  <span>Buy</span>
                                  <span className="text-xs font-mono bg-navy-900/10 px-2 py-1 rounded group-hover:bg-navy-900/20">
                                      ${(prices?.[previewMetal] || (previewMetal === 'gold' ? 4617 : 88)).toLocaleString()}
                                  </span>
                              </button>
                              <button 
                                  onClick={onEnterApp}
                                  className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-between px-6 group"
                              >
                                  <span>Sell</span>
                                  <span className="text-xs font-mono bg-black/10 px-2 py-1 rounded group-hover:bg-black/20">
                                      ${((prices?.[previewMetal] || (previewMetal === 'gold' ? 4617 : 88)) * 0.98).toLocaleString()}
                                  </span>
                              </button>
                          </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/10 text-center">
                          <p className="text-xs text-gray-500 mb-4">
                              Real-time trading requires a verified account.
                          </p>
                          <button 
                              onClick={onEnterApp}
                              className="text-gold-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                              Create Profile
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 1.5 App Preview Section */}
      <section className="relative z-20 py-16 md:py-24 px-4 bg-navy-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
              <span className="text-gold-500 text-[10px] font-bold tracking-[0.3em] uppercase block mb-3">Interface</span>
              <h3 className="text-2xl md:text-3xl font-serif text-white">Command Center</h3>
          </div>
          <div className="relative rounded-2xl bg-navy-900 border border-gold-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transform hover:scale-[1.01] transition-transform duration-700">
             {/* Window Controls */}
             <div className="bg-navy-950 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                <div className="ml-4 bg-navy-800 rounded px-3 py-1 text-[10px] text-gray-500 font-mono w-48 md:w-64 text-center border border-white/5 hidden sm:block">maroon.app/dashboard</div>
             </div>
             
             {/* App Interface Mockup */}
             <div className="p-4 md:p-8 bg-navy-900 grid lg:grid-cols-3 gap-8">
                {/* Left Col: Stats & Chart */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="flex justify-between items-end">
                      <div>
                         <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest mb-1">Total Portfolio Value</div>
                         <div className="text-2xl md:text-5xl font-serif text-white tracking-tight">$124,592.40</div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] md:text-xs font-bold border border-green-500/20">+2.4% Today</div>
                   </div>
                   
                   {/* Mock Chart Area */}
                   <div className="h-32 md:h-48 bg-navy-800 rounded-xl border border-white/5 relative overflow-hidden group shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-t from-gold-500/5 to-transparent opacity-50"></div>
                      <svg className="w-full h-full text-gold-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                         <path d="M0 80 Q 20 70, 40 40 T 100 20 V 100 H 0 Z" fill="url(#grad)" opacity="0.2" />
                         <path d="M0 80 Q 20 70, 40 40 T 100 20" fill="none" stroke="currentColor" strokeWidth="1" />
                         <defs>
                            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                               <stop offset="0%" stopColor="currentColor" />
                               <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                         </defs>
                      </svg>
                   </div>
                </div>

                {/* Right Col: Asset List */}
                <div className="space-y-4 hidden lg:block">
                   <div className="text-sm font-bold text-white mb-2">Recent Assets</div>
                   {[
                      { name: 'American Gold Eagle', type: 'Gold', qty: '5x', val: '$12,450' },
                      { name: 'PAMP Suisse Bar', type: 'Gold', qty: '1x', val: '$2,340' },
                      { name: 'Silver Maple Leaf', type: 'Silver', qty: '100x', val: '$3,200' },
                   ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-navy-800 border border-white/5 hover:border-gold-500/30 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-navy-900 shadow-inner ${item.type === 'Gold' ? 'bg-gold-500' : item.type === 'Silver' ? 'bg-gray-300' : 'bg-gray-200'}`}>
                               {item.type[0]}
                            </div>
                            <div>
                               <div className="text-xs font-bold text-white">{item.name}</div>
                               <div className="text-[10px] text-gray-400">{item.qty} • {item.type}</div>
                            </div>
                         </div>
                         <div className="text-xs font-bold text-white font-mono">{item.val}</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. Prestige Features Grid */}
      <section className="py-20 md:py-32 bg-navy-900 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 md:mb-24">
                <span className="text-gold-500 text-xs font-bold tracking-[0.3em] uppercase mb-4 block">The Platform</span>
                <h2 className="text-3xl md:text-6xl font-serif text-white mb-8">Engineered for the<br/><span className="italic text-gray-500">Uncompromising.</span></h2>
                <div className="w-px h-16 md:h-24 bg-gradient-to-b from-gold-500 to-transparent mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        title: "100% Allocated",
                        desc: "Direct title to specific bars and coins. Your assets are physically segregated, auditable, and yours alone.",
                        icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    },
                    {
                        title: "Instant Liquidity",
                        desc: "Liquidate your positions 24/7 at locked-in spot prices. Funds settle instantly to your balance.",
                        icon: "M13 10V3L4 14h7v7l9-11h-7z"
                    },
                    {
                        title: "Physical Redemption",
                        desc: "Convert your digital portfolio into physical metal delivered securely to your door via armored transport.",
                        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    }
                ].map((feature, idx) => (
                    <div key={idx} className="group p-8 md:p-10 border border-white/5 hover:border-gold-500/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-none relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-0.5 h-0 bg-gold-500 group-hover:h-full transition-all duration-700 ease-in-out"></div>
                        <div className="w-12 h-12 mb-8 text-gold-500/80 group-hover:text-gold-500 transition-colors">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={feature.icon} /></svg>
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-4">{feature.title}</h3>
                        <p className="text-gray-400 font-light leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 3. NEW: AI Concierge Section */}
      <section className="py-20 md:py-32 bg-navy-950 relative border-t border-white/5 overflow-hidden">
         {/* Background Effect */}
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none"></div>
         
         <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
            {/* Visual: Chat Interface */}
            <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 to-transparent blur-3xl opacity-20 transform -rotate-12"></div>
                
                {/* Simulated Interface */}
                <div className="bg-navy-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm max-w-md mx-auto lg:mx-0">
                    <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/20">
                           <span className="font-serif font-bold text-navy-900">M</span>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Maroon AI</div>
                            <div className="text-[10px] text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                ONLINE
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {/* User Message */}
                        <div className="flex justify-end">
                            <div className="bg-navy-800 border border-white/5 rounded-2xl rounded-tr-sm px-5 py-3 text-sm text-gray-300 max-w-[85%]">
                                How is my gold performing YTD compared to the S&P 500?
                            </div>
                        </div>
                        
                        {/* Maroon Response */}
                        <div className="flex justify-start">
                            <div className="bg-gradient-to-br from-gold-500/10 to-navy-800 border border-gold-500/20 rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-white max-w-[90%] shadow-lg">
                                <p className="mb-3 leading-relaxed">
                                    Your gold holdings are up <span className="text-gold-500 font-bold">14.2% YTD</span>, outperforming the S&P 500 by 3.8%.
                                </p>
                                <div className="h-24 bg-navy-900/50 rounded-lg border border-white/5 p-3 mb-2 relative overflow-hidden">
                                     {/* Fake Chart Line */}
                                     <svg className="w-full h-full text-gold-500" viewBox="0 0 100 40" preserveAspectRatio="none">
                                        <path d="M0 35 Q 20 30, 40 20 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                                        <path d="M0 35 Q 20 30, 40 20 T 100 5 V 40 H 0 Z" fill="url(#gradient)" opacity="0.2" />
                                        <defs>
                                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="currentColor" />
                                                <stop offset="100%" stopColor="transparent" />
                                            </linearGradient>
                                        </defs>
                                     </svg>
                                </div>
                                <p className="text-xs text-gray-400 italic">
                                    Would you like to increase your allocation while spot price is favorable?
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-8 relative">
                        <div className="h-12 bg-navy-950 rounded-full border border-white/10 flex items-center px-4 justify-between">
                            <div className="w-24 h-2 bg-gray-700/50 rounded-full"></div>
                            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Text Side */}
            <div className="order-1 lg:order-2">
                <span className="text-gold-500 text-xs font-bold tracking-[0.3em] uppercase mb-4 block">Maroon AI</span>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">Your Private <br/>Bullion Concierge.</h2>
                <div className="w-20 h-1 bg-gold-500 mb-8"></div>
                <p className="text-base md:text-lg text-gray-400 font-light leading-relaxed mb-8">
                    Maroon AI isn't just a chatbot. It is a sophisticated financial intelligence engine capable of auditing your vault, analyzing global market trends, and executing trades via natural language.
                </p>
                
                <ul className="space-y-4 mb-10">
                    {[
                        "Instant Portfolio Audits",
                        "Real-time Market Sentiment Analysis",
                        "Voice-Activated Trading",
                        "24/7 Wealth Intelligence"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-gold-500 rounded-full"></div>
                            <span className="text-white font-medium tracking-wide">{item}</span>
                        </li>
                    ))}
                </ul>

                <button 
                    onClick={onActivateAI || onEnterApp}
                    className="group flex items-center gap-3 text-gold-500 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors"
                >
                    <span>{user ? 'Activate Concierge' : 'Login to Activate'}</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
            </div>
         </div>
      </section>

      {/* 4. The Visual Vault */}
      <section className="py-20 md:py-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-navy-800"></div>
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
         
         <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
             <div>
                 <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Physical ownership.<br/>Digital command.</h2>
                 <p className="text-gray-400 text-lg font-light mb-8 leading-relaxed">
                     Unlike ETFs, Maroon gives you direct ownership of specific serial-numbered bars. 
                     View your vault audit in real-time.
                 </p>
                 
                 <ul className="space-y-6">
                     {[
                         "Class 3 UL Rated Vault Storage",
                         "Fully Insured by Lloyd's of London",
                         "Quarterly Third-Party Audits"
                     ].map((item, i) => (
                         <li key={i} className="flex items-center gap-4 text-white">
                             <div className="w-8 h-px bg-gold-500"></div>
                             <span className="tracking-wide uppercase text-sm font-bold">{item}</span>
                         </li>
                     ))}
                 </ul>
             </div>

             <div className="relative flex justify-center items-center">
                 {/* Holographic Vault Visualization */}
                 <div className="relative w-64 h-64 md:w-80 md:h-80">
                     {/* Glow Background */}
                     <div className="absolute inset-0 bg-gold-500/10 blur-[80px] rounded-full animate-pulse-slow"></div>

                     {/* Outer Ring (Static/Slow) */}
                     <div className="absolute inset-0 rounded-full border border-gold-500/10 border-dashed animate-spin-slow"></div>
                     
                     {/* Middle Rings (Counter Rotating) */}
                     <div className="absolute inset-8 rounded-full border border-white/5 animate-reverse-spin"></div>
                     <div className="absolute inset-8 rounded-full border-t border-b border-transparent border-l-gold-500/30 border-r-gold-500/30 animate-reverse-spin"></div>
                     
                     {/* Inner Ring (Fast) */}
                     <div className="absolute inset-16 rounded-full border border-white/5 border-dashed animate-[spin_8s_linear_infinite]"></div>

                     {/* Core Hologram */}
                     <div className="absolute inset-24 rounded-full bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.1)] group">
                          {/* Scanning Laser */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent animate-scan blur-[2px]"></div>
                          
                          <div className="text-center relative z-10">
                              <div className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold-200 to-gold-600 drop-shadow-sm">Au</div>
                              <div className="text-[10px] text-gold-500 tracking-[0.3em] uppercase mt-2 font-mono">196.967</div>
                              <div className="text-[8px] text-gray-500 tracking-widest mt-1">99.99% PURE</div>
                          </div>
                     </div>
                     
                     {/* Orbiting Particles */}
                     <div className="absolute inset-0 animate-spin-slow">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-gold-500 rounded-full shadow-[0_0_15px_#D4AF37]"></div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 py-20 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="w-12 h-12 bg-gold-500 mx-auto transform rotate-45 flex items-center justify-center mb-8 shadow-lg shadow-gold-500/20">
                <span className="font-serif font-bold text-navy-900 text-xl transform -rotate-45">M</span>
            </div>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                Precious metals involve risk and are not suitable for all investors. 
                Maroon is a service by Alex Lexington.
            </p>
            <div className="flex justify-center gap-8 text-xs font-bold text-gray-400 tracking-widest uppercase">
                <a href="#" className="hover:text-gold-500 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gold-500 transition-colors">Terms</a>
                <a href="#" className="hover:text-gold-500 transition-colors">Contact</a>
            </div>
            <div className="mt-12 text-[10px] text-gray-600">
                © {new Date().getFullYear()} ALEX LEXINGTON. ALL RIGHTS RESERVED.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
