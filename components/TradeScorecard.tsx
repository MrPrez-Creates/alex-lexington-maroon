import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

interface ScorecardData {
  total_calls: number;
  wins: number;
  losses: number;
  pending: number;
  win_rate: number;
  current_streak: number;
  streak_type: 'win' | 'loss' | 'none';
  avg_return_pct?: number;
}

interface TradeScoreCardProps {
  onViewArchive?: () => void;
  isGated?: boolean;
}

const TradeScorecard: React.FC<TradeScoreCardProps> = ({ onViewArchive, isGated = false }) => {
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchScorecard = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/trade-calls`);
        if (!response.ok) throw new Error('Failed to load scorecard');
        const data = await response.json();
        if (!cancelled) {
          setScorecard(data.scorecard || data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          // Fallback display data if API not available yet
          setScorecard({
            total_calls: 0,
            wins: 0,
            losses: 0,
            pending: 0,
            win_rate: 0,
            current_streak: 0,
            streak_type: 'none',
          });
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchScorecard();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-navy-700 rounded w-32 mb-3" />
        <div className="h-8 bg-gray-200 dark:bg-navy-700 rounded w-20 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-navy-700 rounded w-48" />
      </div>
    );
  }

  if (!scorecard) return null;

  const streakLabel = scorecard.streak_type === 'win'
    ? `${scorecard.current_streak}W streak`
    : scorecard.streak_type === 'loss'
    ? `${scorecard.current_streak}L streak`
    : 'No active streak';

  const streakColor = scorecard.streak_type === 'win'
    ? 'text-emerald-500'
    : scorecard.streak_type === 'loss'
    ? 'text-red-400'
    : 'text-gray-400 dark:text-gray-500';

  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 shadow-sm relative overflow-hidden">
      {/* Subtle gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9A7B3E] to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#9A7B3E]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#9A7B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Maverick Scorecard
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-baseline gap-4 mb-2">
        <span className="text-2xl font-bold text-navy-900 dark:text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {scorecard.wins}–{scorecard.losses}
        </span>
        {scorecard.total_calls > 0 && (
          <span className="text-sm font-semibold text-[#9A7B3E]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {scorecard.win_rate.toFixed(0)}% hit rate
          </span>
        )}
      </div>

      {/* Streak + pending */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-medium ${streakColor}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {streakLabel}
        </span>
        {scorecard.pending > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {scorecard.pending} open
          </span>
        )}
      </div>

      {/* CTA */}
      {onViewArchive && (
        <button
          onClick={onViewArchive}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-navy-900/50 hover:bg-gray-100 dark:hover:bg-navy-900 transition-colors group"
        >
          <span className="text-xs font-semibold text-navy-900 dark:text-gray-300 flex items-center gap-2">
            {isGated && (
              <svg className="w-3.5 h-3.5 text-[#9A7B3E]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
              </svg>
            )}
            View Trade Call Archive
          </span>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#9A7B3E] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TradeScorecard;
