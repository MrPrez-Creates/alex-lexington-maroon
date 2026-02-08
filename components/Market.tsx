
import React, { useState, useEffect, useMemo } from 'react';
import { SpotPrices, MetalType, BullionItem, PriceAlert } from '../types';
import { METAL_COLORS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchChartHistory, HistoricalDataPoint } from '../services/marketData';
import { fetchMarketNews, NewsItem } from '../services/newsService';

interface MarketProps {
  prices: SpotPrices;
  assets: BullionItem[];
  onTrade: (action: 'buy' | 'sell', metal: string) => void;
  alerts: PriceAlert[];
  onAddAlert: (alert: PriceAlert) => void;
  onRemoveAlert: (id: string) => void;
  selectedMetal: string | null;
  onSelectMetal: (metal: string | null) => void;
}

const TIME_RANGES = ['1W', '1M', '3M', '1Y', 'ALL'];

const getMarketStats = (price: number, metal: string) => {
    const seed = Math.floor(price * 100); 
    const spread = metal === 'silver' ? 0.20 : 2.50; 
    const dailyVolPercent = 0.012; 

    // Generate consistent mock data based on price seed
    const yearHigh = price * 1.18;
    const yearLow = price * 0.88;
    
    return {
        open: price * (1 - (0.005 * (seed % 2 === 0 ? 1 : -1))),
        high: price * (1 + (dailyVolPercent * 0.7)),
        low: price * (1 - (dailyVolPercent * 0.3)),
        bid: price - spread,
        ask: price + spread,
        volume: Math.floor(price * 10 + 5000),
        volume24h: Math.floor(price * 250),
        yearHigh: yearHigh,
        yearLow: yearLow,
        sentiment: 0.70 + ((seed % 20) / 100) // ~70-90% buy
    };
};

const Market: React.FC<MarketProps> = ({ prices, assets, onTrade, alerts, onAddAlert, onRemoveAlert, selectedMetal, onSelectMetal }) => {
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; metal: string } | null>(null);
  const [alertPrice, setAlertPrice] = useState('');

  const [sparklineData, setSparklineData] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [detailChartData, setDetailChartData] = useState<HistoricalDataPoint[]>([]);
  const [detailTimeRange, setDetailTimeRange] = useState('1M');
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [trends, setTrends] = useState<Record<string, { trend: 'up' | 'down', change: number }>>({});
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  const commodities = [
    { id: MetalType.GOLD, name: 'Gold', symbol: 'AU' },
    { id: MetalType.SILVER, name: 'Silver', symbol: 'AG' },
    { id: MetalType.PLATINUM, name: 'Platinum', symbol: 'PT' },
    { id: MetalType.PALLADIUM, name: 'Palladium', symbol: 'PD' },
  ];

  // Load Sparklines for List View (1M View)
  useEffect(() => {
    const loadMarketData = async () => {
        const metals = [MetalType.GOLD, MetalType.SILVER, MetalType.PLATINUM, MetalType.PALLADIUM];
        for (const metal of metals) {
            try {
                // Requested: 1M chart for mini view
                const history = await fetchChartHistory(metal, '1M');
                if (history && history.length > 0) {
                    setSparklineData(prev => ({ ...prev, [metal]: history }));
                    const start = history[0].value;
                    const end = history[history.length - 1].value;
                    const changePercent = start !== 0 ? ((end - start) / start) * 100 : 0;
                    setTrends(prev => ({
                        ...prev,
                        [metal]: {
                            trend: changePercent >= 0 ? 'up' : 'down',
                            change: changePercent
                        }
                    }));
                }
            } catch (e) {
                console.error(`Failed to load history for ${metal}`, e);
            }
        }
    };
    loadMarketData();
  }, []);

  // Load Detail Chart
  useEffect(() => {
    if (!selectedMetal) return;
    
    const loadDetailChart = async () => {
        setIsLoadingChart(true);
        try {
            const history = await fetchChartHistory(selectedMetal, detailTimeRange);
            setDetailChartData(history);
        } catch (e) {
            console.error("Failed to load detail chart", e);
        } finally {
            setIsLoadingChart(false);
        }
    };
    loadDetailChart();
  }, [selectedMetal, detailTimeRange]);

  // Load News
  useEffect(() => {
    const loadNews = async () => {
      try {
        const news = await fetchMarketNews();
        setNewsItems(news);
      } catch (e) {
        console.error("Failed to fetch news", e);
      } finally {
        setIsNewsLoading(false);
      }
    };
    loadNews();
  }, []);

  const handleAlertSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (alertModal && alertPrice) {
          const metal = alertModal.metal;
          const currentPrice = prices[metal] || 0;
          const target = parseFloat(alertPrice);
          const condition = target > currentPrice ? 'above' : 'below';
          onAddAlert({
              id: Date.now().toString(),
              metal,
              targetPrice: target,
              condition
          });
          setAlertModal(null);
          setAlertPrice('');
      }
  };

  // --- DETAIL VIEW ---
  if (selectedMetal) {
      const metalInfo = commodities.find(c => c.id === selectedMetal);
      const currentPrice = prices[selectedMetal] || 0;
      
      // Specific Gold Color from design (Yellow/Orange) vs standard palette
      const chartColor = selectedMetal === 'gold' ? '#FBBF24' : (METAL_COLORS[selectedMetal] || '#D4AF37'); 
      const marketStats = getMarketStats(currentPrice, selectedMetal);

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-fade-in pb-32 bg-navy-900 min-h-screen fixed inset-0 z-40 overflow-y-auto">
            {/* Added fixed inset above to act as a full page modal over the navigation */}
            
            {/* Header Area */}
            <div className="px-4 py-4 flex items-center justify-between sticky top-0 bg-navy-900/95 backdrop-blur-md z-10 border-b border-white/5">
                <button 
                    onClick={() => onSelectMetal(null)}
                    className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-white capitalize">{metalInfo?.name}</h1>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{metalInfo?.symbol} / USD</span>
                </div>
                <div className="flex gap-4 text-gray-400">
                    <button className="hover:text-white" onClick={() => setAlertModal({isOpen: true, metal: selectedMetal})}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Big Price Display (Right Aligned) */}
                <div className="text-center py-4">
                    <h2 className="text-5xl font-bold text-white font-mono tracking-tight">${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                    <span className={`text-sm font-bold ${marketStats.open < currentPrice ? 'text-green-500' : 'text-red-500'}`}>
                        {marketStats.open < currentPrice ? '+' : ''}{(currentPrice - marketStats.open).toFixed(2)} Today
                    </span>
                </div>

                {/* CHART SECTION */}
                <div className="relative h-72 w-full bg-navy-800/30 rounded-2xl border border-white/5 overflow-hidden shadow-inner">
                    {isLoadingChart ? (
                        <div className="flex h-full items-center justify-center text-gray-500 text-xs">Loading Data...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={detailChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDetail" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                                <YAxis 
                                    orientation="right" 
                                    domain={['auto', 'auto']} 
                                    tick={{fontSize: 9, fill: '#6B7280'}} 
                                    tickFormatter={(val) => `${Math.round(val)}`} 
                                    width={35}
                                    axisLine={false}
                                    tickLine={false}
                                    hide={false}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0A2240', borderColor: '#153b63', color: '#fff', fontSize: '10px', borderRadius: '8px' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                    formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 'Price']}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={chartColor} 
                                    strokeWidth={2.5}
                                    fillOpacity={1} 
                                    fill="url(#colorDetail)"
                                    animationDuration={800}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Timeframe Selectors */}
                <div className="flex justify-between px-2 bg-navy-800/50 p-1 rounded-xl">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range}
                            onClick={() => setDetailTimeRange(range)}
                            className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all flex-1 ${
                                detailTimeRange === range 
                                ? 'bg-white/10 text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                {/* MARKET STATS GRID */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Market Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="OPEN" value={marketStats.open} isCurrency />
                        <StatCard label="HIGH" value={marketStats.high} isCurrency />
                        <StatCard label="LOW" value={marketStats.low} isCurrency />
                        <StatCard label="VOLUME (24H)" value={marketStats.volume24h} />
                        <StatCard label="BID" value={marketStats.bid} isCurrency color="text-gray-300" />
                        <StatCard label="ASK" value={marketStats.ask} isCurrency color="text-red-400" />
                        <StatCard label="52W HIGH" value={marketStats.yearHigh} isCurrency />
                        <StatCard label="52W LOW" value={marketStats.yearLow} isCurrency />
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTIONS (STICKY) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-navy-900 border-t border-white/5 z-[60] pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <button 
                        onClick={() => onTrade('buy', selectedMetal)}
                        className="flex-[2] bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-lg py-4 rounded-xl shadow-lg shadow-gold-500/20 transition-transform active:scale-[0.98]"
                    >
                        Buy {metalInfo?.name}
                    </button>
                    <button 
                        onClick={() => onTrade('sell', selectedMetal)}
                        className="flex-1 bg-navy-800 border border-white/10 text-white font-bold text-lg py-4 rounded-xl hover:bg-navy-700 transition-colors active:scale-[0.98]"
                    >
                        Sell
                    </button>
                </div>
            </div>
            
            {renderAlertModal()}
        </div>
      );
  }

  // --- LIST VIEW ---
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-navy-900 dark:text-white mb-4">Live Markets</h1>
        <div className="grid grid-cols-1 gap-3">
            {commodities.map((metal) => {
                const price = prices[metal.id] || 0;
                const trend = trends[metal.id] || { trend: 'up', change: 0 };
                const isUp = trend.trend === 'up';
                const chartData = sparklineData[metal.id] || [];
                const color = METAL_COLORS[metal.id];

                return (
                    <div 
                        key={metal.id} 
                        onClick={() => onSelectMetal(metal.id)}
                        className="bg-white dark:bg-navy-800 rounded-xl p-3 border border-gray-100 dark:border-navy-700 flex items-center justify-between group cursor-pointer hover:border-gold-500/50 transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                             <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm" 
                                style={{ backgroundColor: color, color: '#0a2440' }}
                             >
                                {metal.symbol}
                             </div>
                             <div>
                                 <h3 className="font-bold text-navy-900 dark:text-white text-sm">{metal.name}</h3>
                                 <div className={`text-[10px] font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {isUp ? '▲' : '▼'} {Math.abs(trend.change).toFixed(2)}%
                                 </div>
                             </div>
                        </div>

                        {/* Compact Sparkline */}
                        <div className="flex-1 h-8 mx-4 max-w-[120px] opacity-80">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id={`grad-${metal.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke={isUp ? '#10B981' : '#EF4444'} 
                                        strokeWidth={1.5} 
                                        fill={`url(#grad-${metal.id})`}
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-bold font-mono text-navy-900 dark:text-white tracking-wide">
                                ${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Alex Lexington Media Feed */}
      <div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4 mt-2">Alex Lexington Network</h2>
        <div className="space-y-3">
            {isNewsLoading ? (
                <div className="text-center py-8 text-gray-500 text-xs">Loading feed...</div>
            ) : (
                newsItems.map((news) => {
                    const typeBadge = news.type === 'podcast'
                        ? { label: 'Podcast', bg: 'bg-green-600', icon: '🎙️' }
                        : news.type === 'youtube'
                        ? { label: 'Video', bg: 'bg-red-600', icon: '▶' }
                        : { label: 'Blog', bg: 'bg-gold-500 text-navy-900', icon: '📝' };

                    return (
                        <a
                            key={news.id}
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white dark:bg-navy-800 rounded-xl overflow-hidden border border-gray-100 dark:border-navy-700 shadow-sm hover:border-gold-500/30 transition-colors group"
                        >
                            <div className="flex">
                                {/* Thumbnail for YouTube and Blog with images */}
                                {news.imageUrl && (
                                    <div className="w-24 h-24 flex-shrink-0 bg-navy-900 relative overflow-hidden">
                                        <img
                                            src={news.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        {news.type === 'youtube' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                                                    <span className="text-white text-xs ml-0.5">▶</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex-1 p-3 min-w-0">
                                    <div className="flex justify-between items-start mb-1.5 gap-2">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${news.type === 'podcast' ? 'bg-green-600 text-white' : news.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-gold-500 text-navy-900'}`}>
                                            {typeBadge.icon} {typeBadge.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                                            {new Date(news.publishedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1 leading-snug group-hover:text-gold-500 transition-colors line-clamp-2">
                                        {news.title}
                                    </h3>
                                    {news.summary && (
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                            {news.summary}
                                        </p>
                                    )}
                                    {news.type === 'podcast' && news.duration && (
                                        <span className="text-[10px] text-green-500 font-medium mt-1 inline-block">
                                            🎧 {news.duration}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </a>
                    );
                })
            )}
        </div>
      </div>
      
      {renderAlertModal()}
    </div>
  );

  function renderAlertModal() {
      if (!alertModal) return null;
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
              <div className="w-full max-w-sm bg-white dark:bg-navy-800 rounded-xl p-6 shadow-2xl border border-gray-100 dark:border-navy-700">
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Set Price Alert for {alertModal.metal}</h3>
                  <form onSubmit={handleAlertSubmit}>
                      <div className="mb-6">
                          <label className="block text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-2">Target Price ($)</label>
                          <input 
                              type="number" 
                              value={alertPrice}
                              onChange={(e) => setAlertPrice(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white"
                              placeholder={prices[alertModal.metal]?.toString()}
                              autoFocus
                          />
                      </div>
                      <div className="flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setAlertModal(null)}
                              className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="flex-1 py-3 bg-gold-500 text-white font-bold rounded-lg hover:bg-gold-600 transition-colors shadow-lg shadow-gold-500/20"
                          >
                              Set Alert
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      );
  }
};

const StatCard = ({ label, value, isCurrency, color }: { label: string, value: number, isCurrency?: boolean, color?: string }) => (
    <div className="bg-navy-800 p-4 rounded-xl border border-white/5 shadow-sm">
        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">{label}</div>
        <div className={`text-sm font-mono font-medium text-white ${color || ''}`}>
            {isCurrency ? '$' : ''}{value.toLocaleString(undefined, { minimumFractionDigits: isCurrency ? 2 : 0, maximumFractionDigits: isCurrency ? 3 : 0 })}
        </div>
    </div>
);

export default Market;
