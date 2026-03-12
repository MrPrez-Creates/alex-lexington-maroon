import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TradeCallRecord {
  call_id: number;
  call_date: string;
  ticker: string;
  action: string; // BUY, SELL, HOLD
  confidence: string | null; // HIGH, MEDIUM, LOW
  status: string; // OPEN, CLOSED, STOPPED_OUT, TARGET_HIT, CANCELLED
  result: string | null; // WIN, LOSS
  pnl_percent: number | null;
  close_date: string | null;
  created_at: string;
  // Archive-only fields (available with Inner Circle+)
  entry_price?: number | null;
  target_price?: number | null;
  stop_price?: number | null;
  thesis?: string | null;
  timeframe_days?: number | null;
}

interface TradeSignalCardProps {
  call: TradeCallRecord;
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const actionStyle = (action: string): { bg: string; text: string; label: string } => {
  switch (action?.toUpperCase()) {
    case 'BUY':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'BUY' };
    case 'SELL':
      return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'SELL' };
    case 'HOLD':
      return { bg: 'bg-[#9A7B3E]/20', text: 'text-[#C4A45A]', label: 'HOLD' };
    default:
      return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: action || '—' };
  }
};

const confidenceDot = (confidence: string | null): { color: string; label: string } => {
  switch (confidence?.toUpperCase()) {
    case 'HIGH':
      return { color: 'bg-emerald-400', label: 'High' };
    case 'MEDIUM':
      return { color: 'bg-[#C4A45A]', label: 'Medium' };
    case 'LOW':
      return { color: 'bg-red-400', label: 'Low' };
    default:
      return { color: 'bg-gray-500', label: '—' };
  }
};

const statusStyle = (status: string): { className: string; label: string; pulse?: boolean } => {
  switch (status?.toUpperCase()) {
    case 'OPEN':
      return { className: 'bg-[#9A7B3E]/15 text-[#C4A45A] border-[#9A7B3E]/30', label: 'OPEN', pulse: true };
    case 'TARGET_HIT':
      return { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'TARGET HIT' };
    case 'STOPPED_OUT':
      return { className: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'STOPPED' };
    case 'CLOSED':
      return { className: 'bg-gray-500/15 text-gray-400 border-gray-500/30', label: 'CLOSED' };
    case 'CANCELLED':
      return { className: 'bg-gray-500/15 text-gray-500 border-gray-500/30', label: 'CANCELLED' };
    default:
      return { className: 'bg-gray-500/15 text-gray-400 border-gray-500/30', label: status || '—' };
  }
};

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '—';
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================================================
// COMPONENT
// ============================================================================

const TradeSignalCard: React.FC<TradeSignalCardProps> = ({ call, compact = false }) => {
  const action = actionStyle(call.action);
  const confidence = confidenceDot(call.confidence);
  const status = statusStyle(call.status);
  const hasPriceData = call.entry_price !== null && call.entry_price !== undefined;

  if (compact) {
    // Compact row for trade journal / recent closed list
    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 dark:bg-white/[0.03] border border-white/[0.06] dark:border-white/[0.04]">
        <div className="flex items-center gap-3">
          <span
            className="text-xs text-gray-400 dark:text-gray-500 w-14"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {formatDate(call.call_date)}
          </span>
          <span
            className="text-sm font-bold text-navy-900 dark:text-white"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {call.ticker}
          </span>
          <span
            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${action.bg} ${action.text}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {action.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${status.className}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {status.label}
          </span>
          {call.pnl_percent !== null && call.pnl_percent !== undefined && (
            <span
              className={`text-sm font-bold ${call.pnl_percent >= 0 ? 'text-emerald-500' : 'text-red-400'}`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {call.pnl_percent >= 0 ? '+' : ''}{call.pnl_percent.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full card for active signals
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        backgroundColor: '#0C1A2E',
        border: '1px solid rgba(154, 123, 62, 0.15)',
      }}
    >
      {/* Subtle gold top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(to right, transparent, #9A7B3E, transparent)',
        }}
      />

      {/* Top row: Ticker + Action + Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {call.ticker}
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${action.bg} ${action.text}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}
          >
            {action.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence dot */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${confidence.color} ${status.pulse ? 'animate-pulse' : ''}`} />
            <span
              className="text-[10px] text-gray-400 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}
            >
              {confidence.label}
            </span>
          </div>
        </div>
      </div>

      {/* Status badge + date */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${status.className}`}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {status.pulse && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C4A45A] mr-1.5 animate-pulse" />
          )}
          {status.label}
        </span>
        <span
          className="text-[11px] text-gray-500"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {formatDate(call.call_date)}
        </span>
        {call.timeframe_days && (
          <span
            className="text-[11px] text-gray-600"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {call.timeframe_days}d horizon
          </span>
        )}
      </div>

      {/* Entry / Target / Stop grid — only if archive data available */}
      {hasPriceData && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/[0.04] rounded-lg p-3">
            <span
              className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Entry
            </span>
            <span
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {formatPrice(call.entry_price)}
            </span>
          </div>
          <div className="bg-white/[0.04] rounded-lg p-3">
            <span
              className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Target
            </span>
            <span
              className="text-sm font-semibold text-emerald-400"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {formatPrice(call.target_price)}
            </span>
          </div>
          <div className="bg-white/[0.04] rounded-lg p-3">
            <span
              className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Stop
            </span>
            <span
              className="text-sm font-semibold text-red-400"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {formatPrice(call.stop_price)}
            </span>
          </div>
        </div>
      )}

      {/* P&L result if closed */}
      {call.pnl_percent !== null && call.pnl_percent !== undefined && (
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] uppercase tracking-wider text-gray-500"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Result
            </span>
            <span
              className={`text-lg font-bold ${call.pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {call.pnl_percent >= 0 ? '+' : ''}{call.pnl_percent.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Thesis if available */}
      {call.thesis && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p
            className="text-xs text-gray-400 leading-relaxed"
            style={{ fontFamily: "'Libre Baskerville', serif" }}
          >
            {call.thesis}
          </p>
        </div>
      )}
    </div>
  );
};

export default TradeSignalCard;
