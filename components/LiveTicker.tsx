import React, { useMemo } from 'react';
import { SpotPrices } from '../types';
import { getLatestPriceChanges } from '../services/marketData';

interface LiveTickerProps {
  prices: SpotPrices;
}

interface TickerItem {
  label: string;
  price: number;
  change: string;
  trend: 'up' | 'down';
}

export default function LiveTicker({ prices }: LiveTickerProps) {

  const tickerData = useMemo(() => {
    if (!prices) return [];

    const changes = getLatestPriceChanges();

    return Object.entries(prices).map(([key, value]) => {
      const changeData = changes[key.toLowerCase()];

      return {
        label: key.toUpperCase(),
        price: value,
        change: changeData?.change ?? '0.00%',
        trend: changeData?.trend ?? 'up',
      } as TickerItem;
    });
  }, [prices]);

  if (tickerData.length === 0) return null;

  // Duplicate data to create a seamless infinite scroll effect
  const displayData = [...tickerData, ...tickerData, ...tickerData, ...tickerData, ...tickerData, ...tickerData];

  return (
    <div className="w-full overflow-hidden bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-t border-gray-100 dark:border-white/5 h-10 flex items-center relative z-10">
      {/* Gradient Masks for smooth fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-navy-900 to-transparent z-20 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-navy-900 to-transparent z-20 pointer-events-none"></div>

      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-25%); }
          }
          .ticker-track {
            display: flex;
            width: max-content;
            animation: scroll 40s linear infinite;
          }
          .ticker-track:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      <div className="ticker-track">
        {displayData.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2 px-6 border-r border-gray-100 dark:border-white/5 last:border-0">
            <span className={`w-1.5 h-1.5 rounded-full ${item.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></span>

            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-widest">
              {item.label}
            </span>

            <span className="text-sm font-bold text-navy-900 dark:text-white font-mono">
              ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>

            <span className={`text-xs font-semibold flex items-center ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              <span className="mr-0.5 text-[8px]">{item.trend === 'up' ? '▲' : '▼'}</span>
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
