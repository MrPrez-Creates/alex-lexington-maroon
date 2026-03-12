import React, { useState, useEffect, useCallback } from 'react';
import TradeSignalCard, { TradeCallRecord } from './TradeSignalCard';
import { getTradeCalls } from '../services/apiClient';

// ============================================================================
// TYPES
// ============================================================================

interface PlaybookSectionProps {
  darkMode: boolean;
  customerData: any;
}

interface WatchCategory {
  id: string;
  label: string;
  tickers: string[];
  icon: string; // emoji
}

// ============================================================================
// WATCH CATEGORIES — Client-side ticker→category mapping
// ============================================================================

const WATCH_CATEGORIES: WatchCategory[] = [
  {
    id: 'precious_metals',
    label: 'Precious Metals',
    tickers: ['GLD', 'SLV', 'IAU', 'PHYS', 'PSLV', 'SGOL', 'SIVR', 'AAAU', 'GLTR', 'PPLT'],
    icon: '🥇',
  },
  {
    id: 'mining',
    label: 'Mining & Miners',
    tickers: ['GDX', 'GDXJ', 'NEM', 'GOLD', 'AEM', 'KGC', 'WPM', 'FNV', 'RGLD', 'AG', 'HL', 'PAAS', 'SLV', 'SIL', 'SILJ'],
    icon: '⛏️',
  },
  {
    id: 'sp500',
    label: 'S&P 500 & Indices',
    tickers: ['SPY', 'QQQ', 'IWM', 'DIA', 'VOO', 'VTI', 'SPXL', 'TQQQ', 'SQQQ', 'UVXY', 'VIX'],
    icon: '📊',
  },
  {
    id: 'energy',
    label: 'Oil & Energy',
    tickers: ['USO', 'XOM', 'XLE', 'OXY', 'CVX', 'COP', 'SLB', 'HAL', 'DVN', 'EOG', 'UCO', 'BNO'],
    icon: '🛢️',
  },
];

const getCategory = (ticker: string): string => {
  const upper = ticker.toUpperCase();
  for (const cat of WATCH_CATEGORIES) {
    if (cat.tickers.includes(upper)) return cat.id;
  }
  return 'other';
};

// ============================================================================
// COMPONENT
// ============================================================================

const PlaybookSection: React.FC<PlaybookSectionProps> = ({ darkMode }) => {
  const [openCalls, setOpenCalls] = useState<TradeCallRecord[]>([]);
  const [recentCalls, setRecentCalls] = useState<TradeCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['precious_metals', 'mining', 'sp500', 'energy', 'other']));

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch open positions and recent closed in parallel
      const [openResult, allResult] = await Promise.all([
        getTradeCalls({ status: 'OPEN', limit: 50 }).catch(() => ({ calls: [] })),
        getTradeCalls({ limit: 10 }).catch(() => ({ calls: [] })),
      ]);

      setOpenCalls(openResult.calls || []);
      // Filter recent to only show non-open calls for the "Recent Closed" section
      const closed = (allResult.calls || []).filter(
        (c: TradeCallRecord) => c.status !== 'OPEN'
      );
      setRecentCalls(closed);
    } catch {
      setOpenCalls([]);
      setRecentCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Group open calls by category
  const groupedCalls: Record<string, TradeCallRecord[]> = {};
  for (const call of openCalls) {
    const catId = getCategory(call.ticker);
    if (!groupedCalls[catId]) groupedCalls[catId] = [];
    groupedCalls[catId].push(call);
  }

  // Build ordered categories: defined categories first, then "other" if it has items
  const orderedCategories = [
    ...WATCH_CATEGORIES.filter((cat) => groupedCalls[cat.id]?.length > 0),
  ];
  if (groupedCalls['other']?.length > 0) {
    orderedCategories.push({
      id: 'other',
      label: 'Other',
      tickers: [],
      icon: '📌',
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: darkMode ? 'rgba(12, 26, 46, 0.6)' : 'rgba(255, 255, 255, 0.9)',
              border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div className="h-5 w-32 bg-gray-200 dark:bg-navy-700 rounded mb-3" />
            <div className="h-20 bg-gray-200 dark:bg-navy-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      {/* Section Header */}
      <div>
        <h2
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7B3E] mb-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Active Signals
        </h2>
        <p
          className="text-sm text-gray-500 dark:text-gray-400"
          style={{ fontFamily: "'Libre Baskerville', serif" }}
        >
          {openCalls.length > 0
            ? `${openCalls.length} open position${openCalls.length !== 1 ? 's' : ''} across ${orderedCategories.length} categor${orderedCategories.length !== 1 ? 'ies' : 'y'}`
            : 'No active signals. Positions will appear here when opened.'}
        </p>
      </div>

      {/* Category Sections */}
      {openCalls.length > 0 ? (
        orderedCategories.map((cat) => {
          const calls = groupedCalls[cat.id] || [];
          const isExpanded = expandedCategories.has(cat.id);

          return (
            <div key={cat.id}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between py-3 px-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{cat.icon}</span>
                  <span
                    className="text-sm font-semibold text-navy-900 dark:text-white uppercase tracking-wide"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {cat.label}
                  </span>
                  <span
                    className="text-[10px] font-bold text-[#9A7B3E] bg-[#9A7B3E]/10 px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {calls.length}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Cards */}
              {isExpanded && (
                <div className="space-y-3 pl-1">
                  {calls.map((call) => (
                    <TradeSignalCard key={call.call_id} call={call} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        /* Empty state */
        <div className="text-center py-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative"
            style={{ backgroundColor: darkMode ? 'rgba(12, 26, 46, 0.8)' : 'rgba(154, 123, 62, 0.08)' }}
          >
            <svg className="w-7 h-7 text-[#9A7B3E]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p
            className="text-gray-400 dark:text-gray-500 text-sm mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px' }}
          >
            No active positions
          </p>
          <p
            className="text-gray-300 dark:text-gray-600 text-xs"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Trade signals will appear here as Maverick opens positions.
          </p>
        </div>
      )}

      {/* Divider */}
      {recentCalls.length > 0 && (
        <>
          <div className="w-full h-px bg-gray-200 dark:bg-navy-700 my-4" />

          {/* Recent Closed */}
          <div>
            <h2
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Recently Closed
            </h2>
            <div className="space-y-2">
              {recentCalls.map((call) => (
                <TradeSignalCard key={call.call_id} call={call} compact />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlaybookSection;
