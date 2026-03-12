import React, { useState, useEffect, useCallback } from 'react';
import TradeSignalCard, { TradeCallRecord } from './TradeSignalCard';
import { getTradeCallStats, getTradeCalls } from '../services/apiClient';

// ============================================================================
// TYPES
// ============================================================================

interface ScorecardSectionProps {
  darkMode: boolean;
}

interface StatsData {
  total_calls: number;
  open_positions: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_win_percent: number;
  avg_loss_percent: number;
  current_streak: { type: 'WIN' | 'LOSS' | null; count: number };
  best_call: { date: string; pnl: number } | null;
  worst_call: { date: string; pnl: number } | null;
  by_confidence: Record<string, { wins: number; losses: number; total: number }>;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatShortDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================================================
// COMPONENT
// ============================================================================

const ScorecardSection: React.FC<ScorecardSectionProps> = ({ darkMode }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [journalCalls, setJournalCalls] = useState<TradeCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [journalPage, setJournalPage] = useState(1);
  const [journalTotal, setJournalTotal] = useState(0);
  const journalLimit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResult, journalResult] = await Promise.all([
        getTradeCallStats().catch(() => null),
        getTradeCalls({ page: journalPage, limit: journalLimit }).catch(() => ({ calls: [], pagination: { total: 0 } })),
      ]);

      setStats(statsResult);
      setJournalCalls(journalResult.calls || []);
      setJournalTotal(journalResult.pagination?.total || 0);
    } catch {
      setStats(null);
      setJournalCalls([]);
    } finally {
      setLoading(false);
    }
  }, [journalPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(journalTotal / journalLimit);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 h-24"
              style={{
                backgroundColor: darkMode ? 'rgba(12, 26, 46, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              }}
            />
          ))}
        </div>
        <div className="rounded-2xl p-5 h-48" style={{
          backgroundColor: darkMode ? 'rgba(12, 26, 46, 0.6)' : 'rgba(255, 255, 255, 0.9)',
          border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        }} />
      </div>
    );
  }

  // Default to zeros if no stats
  const s: StatsData = stats || {
    total_calls: 0,
    open_positions: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    avg_win_percent: 0,
    avg_loss_percent: 0,
    current_streak: { type: null, count: 0 },
    best_call: null,
    worst_call: null,
    by_confidence: {},
  };

  const streakLabel = s.current_streak.type === 'WIN'
    ? `${s.current_streak.count}W`
    : s.current_streak.type === 'LOSS'
    ? `${s.current_streak.count}L`
    : '—';

  const streakColor = s.current_streak.type === 'WIN'
    ? 'text-emerald-500'
    : s.current_streak.type === 'LOSS'
    ? 'text-red-400'
    : 'text-gray-400';

  const cardBg = darkMode ? 'rgba(12, 26, 46, 0.6)' : 'rgba(255, 255, 255, 0.95)';
  const cardBorder = darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)';

  return (
    <div className="space-y-6 pb-40">
      {/* Section Header */}
      <div>
        <h2
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7B3E] mb-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Performance Dashboard
        </h2>
        <p
          className="text-sm text-gray-500 dark:text-gray-400"
          style={{ fontFamily: "'Libre Baskerville', serif" }}
        >
          {s.total_calls > 0
            ? `${s.total_calls} calls tracked — ${s.wins}W ${s.losses}L`
            : 'Stats will populate as trade calls are recorded.'}
        </p>
      </div>

      {/* Stats Cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Win Rate */}
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ backgroundColor: cardBg, border: cardBorder }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9A7B3E] to-transparent" />
          <span
            className="block text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Win Rate
          </span>
          <span
            className="text-2xl font-bold text-navy-900 dark:text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {s.win_rate.toFixed(1)}%
          </span>
          <span
            className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {s.wins}W — {s.losses}L
          </span>
        </div>

        {/* Total Calls */}
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ backgroundColor: cardBg, border: cardBorder }}
        >
          <span
            className="block text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Total Calls
          </span>
          <span
            className="text-2xl font-bold text-navy-900 dark:text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {s.total_calls}
          </span>
          <span
            className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {s.open_positions} open
          </span>
        </div>

        {/* Current Streak */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: cardBg, border: cardBorder }}
        >
          <span
            className="block text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Streak
          </span>
          <span
            className={`text-2xl font-bold ${streakColor}`}
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {streakLabel}
          </span>
          <span
            className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {s.current_streak.type ? `${s.current_streak.type.toLowerCase()} streak` : 'no streak'}
          </span>
        </div>

        {/* Avg Return */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: cardBg, border: cardBorder }}
        >
          <span
            className="block text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Avg Win / Loss
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg font-bold text-emerald-500"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {s.avg_win_percent > 0 ? '+' : ''}{s.avg_win_percent.toFixed(1)}%
            </span>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span
              className="text-lg font-bold text-red-400"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {s.avg_loss_percent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Best / Worst Calls */}
      {(s.best_call || s.worst_call) && (
        <div className="grid grid-cols-2 gap-3">
          {s.best_call && (
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: cardBg, border: cardBorder }}
            >
              <span
                className="block text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Best Call
              </span>
              <span
                className="text-sm font-bold text-emerald-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                +{s.best_call.pnl.toFixed(1)}%
              </span>
              <span
                className="block text-[10px] text-gray-400 dark:text-gray-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {formatShortDate(s.best_call.date)}
              </span>
            </div>
          )}
          {s.worst_call && (
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: cardBg, border: cardBorder }}
            >
              <span
                className="block text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Worst Call
              </span>
              <span
                className="text-sm font-bold text-red-400"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {s.worst_call.pnl.toFixed(1)}%
              </span>
              <span
                className="block text-[10px] text-gray-400 dark:text-gray-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {formatShortDate(s.worst_call.date)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Confidence Breakdown */}
      {Object.keys(s.by_confidence).length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: cardBg, border: cardBorder }}
        >
          <h3
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-3"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            By Confidence Level
          </h3>
          <div className="space-y-2.5">
            {['HIGH', 'MEDIUM', 'LOW'].map((level) => {
              const data = s.by_confidence[level];
              if (!data) return null;
              const rate = data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0;
              const dotColor = level === 'HIGH' ? 'bg-emerald-400' : level === 'MEDIUM' ? 'bg-[#C4A45A]' : 'bg-red-400';
              const barColor = level === 'HIGH' ? 'bg-emerald-500' : level === 'MEDIUM' ? 'bg-[#9A7B3E]' : 'bg-red-500';

              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-20">
                    <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span
                      className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {level}
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold text-navy-900 dark:text-white w-12 text-right"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {rate}%
                  </span>
                  <span
                    className="text-[10px] text-gray-400 dark:text-gray-500 w-12 text-right"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    ({data.total})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="w-full h-px bg-gray-200 dark:bg-navy-700" />

      {/* Trade Journal */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Trade Journal
          </h2>
          {journalTotal > 0 && (
            <span
              className="text-[10px] text-gray-400 dark:text-gray-500"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {journalTotal} total
            </span>
          )}
        </div>

        {journalCalls.length > 0 ? (
          <div className="space-y-2">
            {journalCalls.map((call) => (
              <TradeSignalCard key={call.call_id} call={call} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p
              className="text-gray-400 dark:text-gray-500 text-sm"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px' }}
            >
              No trade calls recorded yet
            </p>
            <p
              className="text-gray-300 dark:text-gray-600 text-xs mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Journal entries will appear as positions are opened and closed.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setJournalPage((p) => Math.max(1, p - 1))}
              disabled={journalPage <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Prev
            </button>
            <span
              className="text-[11px] text-gray-400 dark:text-gray-500"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {journalPage} / {totalPages}
            </span>
            <button
              onClick={() => setJournalPage((p) => Math.min(totalPages, p + 1))}
              disabled={journalPage >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScorecardSection;
