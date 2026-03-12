import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TradeCallData {
  ticker: string;
  direction: 'LONG' | 'SHORT' | 'HOLD';
  entry: string;
  target: string;
  stop: string;
  status?: 'open' | 'hit' | 'stopped' | 'closed';
  result_pct?: number;
}

export interface ArticleContent {
  id: string;
  title: string;
  subtitle?: string;
  format_type: 'dispatch' | 'pulse' | 'spotlight' | 'house_intel' | 'playbook' | 'trade_call';
  body_html: string;
  preview_text?: string;
  author?: string;
  published_at: string;
  tier_required: 'public' | 'inner_circle' | 'vault_member' | 'house_client';
  trade_calls?: TradeCallData[];
  tags?: string[];
}

interface ArticleViewProps {
  article: ArticleContent;
  onBack: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTypeBadge = (type: string): { label: string; color: string } => {
  switch (type) {
    case 'dispatch': return { label: 'Morning Dispatch', color: 'bg-[#9A7B3E]/15 text-[#9A7B3E] border-[#9A7B3E]/30' };
    case 'pulse': return { label: 'Market Pulse', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
    case 'spotlight': return { label: 'Weekend Spotlight', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' };
    case 'house_intel': return { label: 'House Intel', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
    case 'playbook': return { label: 'The Playbook', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' };
    case 'trade_call': return { label: 'Trade Call', color: 'bg-red-500/10 text-red-500 border-red-500/30' };
    default: return { label: type, color: 'bg-gray-200/50 text-gray-500 border-gray-300/50' };
  }
};

const directionColor = (dir: string): string => {
  switch (dir) {
    case 'LONG': return 'text-emerald-500';
    case 'SHORT': return 'text-red-400';
    default: return 'text-[#9A7B3E]';
  }
};

const statusBadge = (status?: string): { label: string; className: string } => {
  switch (status) {
    case 'hit': return { label: 'TARGET HIT', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    case 'stopped': return { label: 'STOPPED OUT', className: 'bg-red-500/10 text-red-400 border-red-500/30' };
    case 'closed': return { label: 'CLOSED', className: 'bg-gray-200/50 text-gray-500 border-gray-300/50' };
    default: return { label: 'OPEN', className: 'bg-[#9A7B3E]/10 text-[#9A7B3E] border-[#9A7B3E]/30' };
  }
};

/**
 * Render body HTML safely. Content is authored internally by the Maverick
 * media pipeline and served from al-business-api -- not user-generated.
 */
const renderBodyHtml = (html: string) => {
  return { __html: html };
};

// ============================================================================
// COMPONENT
// ============================================================================

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack }) => {
  const badge = formatTypeBadge(article.format_type);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F4EE' }}>
      {/* Navy Masthead Bar */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#0C1A2E' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Back</span>
          </button>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A7B3E]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Alex Lexington Intelligence
          </span>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-5 py-8 pb-40">
        {/* Format badge + date */}
        <div className="flex items-center gap-3 mb-5">
          <span
            className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${badge.color}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {badge.label}
          </span>
          <span
            className="text-xs text-gray-400"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {formatDate(article.published_at)}
          </span>
        </div>

        {/* Gold accent line */}
        <div className="w-12 h-[2px] mb-6" style={{ backgroundColor: '#9A7B3E' }} />

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-light leading-tight mb-3"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#0C1A2E',
            fontWeight: 300,
          }}
        >
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p
            className="text-lg leading-relaxed mb-6"
            style={{
              fontFamily: "'Libre Baskerville', serif",
              color: '#5A5A5A',
              fontStyle: 'italic',
            }}
          >
            {article.subtitle}
          </p>
        )}

        {/* Author + divider */}
        {article.author && (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0C1A2E' }}>
              <span className="text-xs font-bold text-[#9A7B3E]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {article.author.charAt(0)}
              </span>
            </div>
            <div>
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: "'Libre Baskerville', serif", color: '#0C1A2E' }}
              >
                {article.author}
              </span>
            </div>
          </div>
        )}

        {/* Full-width gold divider */}
        <div className="w-full h-px mb-8" style={{ backgroundColor: '#9A7B3E', opacity: 0.3 }} />

        {/* Trade Calls Section (if present) */}
        {article.trade_calls && article.trade_calls.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#9A7B3E' }}
            >
              Active Positions
            </h2>
            <div className="space-y-3">
              {article.trade_calls.map((tc, i) => {
                const st = statusBadge(tc.status);
                return (
                  <div
                    key={i}
                    className="rounded-xl border p-4"
                    style={{
                      backgroundColor: '#FFFEFA',
                      borderColor: 'rgba(154, 123, 62, 0.15)',
                    }}
                  >
                    {/* Ticker + Direction + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-lg font-bold"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#0C1A2E' }}
                        >
                          {tc.ticker}
                        </span>
                        <span
                          className={`text-sm font-bold ${directionColor(tc.direction)}`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {tc.direction}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${st.className}`}
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {st.label}
                      </span>
                    </div>
                    {/* Entry / Target / Stop */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span
                          className="block text-[10px] uppercase tracking-wider text-gray-400 mb-0.5"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          Entry
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#0C1A2E' }}
                        >
                          {tc.entry}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block text-[10px] uppercase tracking-wider text-gray-400 mb-0.5"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          Target
                        </span>
                        <span
                          className="text-sm font-semibold text-emerald-600"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {tc.target}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block text-[10px] uppercase tracking-wider text-gray-400 mb-0.5"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          Stop
                        </span>
                        <span
                          className="text-sm font-semibold text-red-400"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {tc.stop}
                        </span>
                      </div>
                    </div>
                    {/* Result if closed */}
                    {tc.result_pct !== undefined && tc.result_pct !== null && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span
                          className={`text-sm font-bold ${tc.result_pct >= 0 ? 'text-emerald-500' : 'text-red-400'}`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {tc.result_pct >= 0 ? '+' : ''}{tc.result_pct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Body Content -- authored internally by Maverick media pipeline, not user-generated */}
        <div
          className="article-body"
          style={{
            fontFamily: "'Libre Baskerville', serif",
            color: '#2A2A2A',
            fontSize: '16px',
            lineHeight: '1.85',
          }}
          dangerouslySetInnerHTML={renderBodyHtml(article.body_html)}
        />

        {/* Gold divider before disclosure */}
        <div className="w-full h-px my-10" style={{ backgroundColor: '#9A7B3E', opacity: 0.3 }} />

        {/* Disclosure Block -- mandatory, never removed */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: '#F0EDE7',
            borderColor: 'rgba(154, 123, 62, 0.15)',
          }}
        >
          <h3
            className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#9A7B3E' }}
          >
            Important Disclosure
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{
              fontFamily: "'Libre Baskerville', serif",
              color: '#6B6B6B',
            }}
          >
            This content is published by Alex Lexington for informational and educational purposes only.
            It does not constitute financial advice, investment advice, or a recommendation to buy, sell,
            or hold any security or commodity. Past performance of any trade call or analysis does not
            guarantee future results. Precious metals carry inherent risk, including the potential loss
            of principal. Always consult with a qualified financial advisor before making investment
            decisions. Alex Lexington and its affiliates may hold positions in the assets discussed.
          </p>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {article.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full border"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#9A7B3E',
                  borderColor: 'rgba(154, 123, 62, 0.2)',
                  backgroundColor: 'rgba(154, 123, 62, 0.05)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Global article body styles */}
      <style>{`
        .article-body p {
          margin-bottom: 1.5em;
        }
        .article-body h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 1.5rem;
          color: #0C1A2E;
          margin-top: 2em;
          margin-bottom: 0.75em;
        }
        .article-body h3 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 1.25rem;
          color: #0C1A2E;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .article-body blockquote {
          border-left: 3px solid #9A7B3E;
          padding-left: 1.25em;
          margin: 1.5em 0;
          font-style: italic;
          color: #5A5A5A;
        }
        .article-body strong {
          font-weight: 700;
          color: #0C1A2E;
        }
        .article-body em {
          font-style: italic;
        }
        .article-body ul, .article-body ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        .article-body li {
          margin-bottom: 0.5em;
        }
        .article-body a {
          color: #9A7B3E;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .article-body code {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.875em;
          background-color: rgba(154, 123, 62, 0.08);
          padding: 0.15em 0.4em;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default ArticleView;
