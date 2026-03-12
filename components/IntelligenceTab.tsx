import React, { useState, useEffect, useCallback } from 'react';
import ArticleView, { ArticleContent } from './ArticleView';
import TradeScorecard from './TradeScorecard';
import { getPublishedContent } from '../services/apiClient';

// ============================================================================
// TYPES
// ============================================================================

type MembershipTier = 'public' | 'inner_circle' | 'vault_member' | 'house_client';
type FormatFilter = 'all' | 'dispatch' | 'pulse' | 'spotlight' | 'house_intel' | 'playbook' | 'trade_call';
type TierFilter = 'all' | 'free' | 'members';

interface IntelligenceTabProps {
  darkMode: boolean;
  customerData: any;
}

// ============================================================================
// TIER HIERARCHY
// ============================================================================

const TIER_RANK: Record<string, number> = {
  public: 0,
  inner_circle: 1,
  vault_member: 1,
  house_client: 2,
};

const canAccess = (userTier: MembershipTier, requiredTier: string): boolean => {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
};

// ============================================================================
// HELPERS
// ============================================================================

const formatTypeBadge = (type: string): { label: string; color: string } => {
  switch (type) {
    case 'dispatch': return { label: 'Dispatch', color: 'bg-[#9A7B3E]/15 text-[#9A7B3E] border-[#9A7B3E]/30' };
    case 'pulse': return { label: 'Pulse', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    case 'spotlight': return { label: 'Spotlight', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' };
    case 'house_intel': return { label: 'Intel Brief', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    case 'playbook': return { label: 'Playbook', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    case 'trade_call': return { label: 'Trade Call', color: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/30' };
    default: return { label: type, color: 'bg-gray-200/50 text-gray-500 border-gray-300/50' };
  }
};

const tierDot = (tier: string): { color: string; label: string } => {
  switch (tier) {
    case 'public': return { color: 'bg-emerald-400', label: 'Public' };
    case 'inner_circle': return { color: 'bg-[#BD9A5F]', label: 'Inner Circle' };
    case 'vault_member': return { color: 'bg-purple-400', label: 'Vault Member' };
    case 'house_client': return { color: 'bg-[#BD9A5F]', label: 'House Client' };
    default: return { color: 'bg-gray-400', label: 'Public' };
  }
};

const formatRelativeDate = (dateStr: string): string => {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TIER_FILTER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'members', label: 'Members Only' },
];

const FORMAT_FILTER_OPTIONS: { value: FormatFilter; label: string }[] = [
  { value: 'all', label: 'All Formats' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'house_intel', label: 'Intel Brief' },
  { value: 'playbook', label: 'Playbook' },
  { value: 'trade_call', label: 'Trade Call' },
];

// ============================================================================
// COMPONENT
// ============================================================================

const IntelligenceTab: React.FC<IntelligenceTabProps> = ({ darkMode, customerData }) => {
  const membershipTier: MembershipTier = customerData?.membershipTier || 'public';

  const [articles, setArticles] = useState<ArticleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTierFilter, setActiveTierFilter] = useState<TierFilter>('all');
  const [activeFormatFilter, setActiveFormatFilter] = useState<FormatFilter>('all');
  const [selectedArticle, setSelectedArticle] = useState<ArticleContent | null>(null);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  // Fetch articles from API using centralized apiClient
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPublishedContent(membershipTier);
      // API returns { content: [...] } — normalize to array of ArticleContent
      const rawList = data.content || data.articles || data.data || data || [];
      const list = Array.isArray(rawList) ? rawList : [];

      // Map API field names (gated_content table) → ArticleContent interface
      const mapped: ArticleContent[] = list.map((item: any) => ({
        id: String(item.content_id ?? item.id ?? ''),
        title: item.title ?? '',
        subtitle: item.subtitle ?? item.meta_description ?? undefined,
        format_type: item.format_type ?? 'dispatch',
        body_html: item.body_html ?? item.content_body ?? '',
        preview_text: item.preview_text ?? item.meta_description ?? undefined,
        author: item.author ?? 'Alex Lexington',
        published_at: item.published_at ?? item.publish_date ?? new Date().toISOString(),
        tier_required: item.tier_required ?? 'public',
        trade_calls: item.trade_calls ?? undefined,
        tags: item.tags ?? undefined,
      }));

      setArticles(mapped);
    } catch (err) {
      console.warn('[Intelligence] API not available yet, showing empty state');
      setArticles([]);
      setError(null); // Don't show error -- API might not be deployed yet
    } finally {
      setLoading(false);
    }
  }, [membershipTier]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Close format dropdown when clicking outside
  useEffect(() => {
    if (!showFormatDropdown) return;
    const close = () => setShowFormatDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showFormatDropdown]);

  // Filter articles by tier access and format type
  const filteredArticles = articles.filter((a) => {
    // Tier filter
    if (activeTierFilter === 'free' && a.tier_required !== 'public') return false;
    if (activeTierFilter === 'members' && a.tier_required === 'public') return false;

    // Format filter
    if (activeFormatFilter !== 'all' && a.format_type !== activeFormatFilter) return false;

    return true;
  });

  // If viewing a specific article, show the ArticleView
  if (selectedArticle) {
    return (
      <ArticleView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 space-y-5 animate-fade-in pb-40">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-3xl font-light text-navy-900 dark:text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Intelligence
          </h1>
          <div className="h-5 w-px bg-gray-200 dark:bg-navy-700" />
          <span
            className="text-[10px] font-bold uppercase tracking-widest text-[#BD9A5F]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {membershipTier === 'house_client' ? 'House Client'
              : membershipTier === 'inner_circle' ? 'Inner Circle'
              : membershipTier === 'vault_member' ? 'Vault Member'
              : 'Public'}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Market analysis, trade calls, and strategic intelligence from the Alex Lexington desk.
        </p>
      </div>

      {/* Trade Scorecard Widget */}
      <TradeScorecard
        onViewArchive={canAccess(membershipTier, 'inner_circle') ? () => setActiveFormatFilter('trade_call') : undefined}
        isGated={!canAccess(membershipTier, 'inner_circle')}
      />

      {/* Tier Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {TIER_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveTierFilter(opt.value)}
            className={`
              flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all
              ${activeTierFilter === opt.value
                ? 'bg-[#BD9A5F] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-navy-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700'
              }
            `}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {opt.label}
          </button>
        ))}

        {/* Format Type Dropdown */}
        <div className="relative ml-auto flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFormatDropdown(!showFormatDropdown);
            }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${activeFormatFilter !== 'all'
                ? 'bg-[#BD9A5F]/15 text-[#BD9A5F] border border-[#BD9A5F]/30'
                : 'bg-gray-100 dark:bg-navy-800 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-navy-700'
              }
            `}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {activeFormatFilter === 'all' ? 'Format' : FORMAT_FILTER_OPTIONS.find(f => f.value === activeFormatFilter)?.label}
            <svg className={`w-3 h-3 transition-transform ${showFormatDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showFormatDropdown && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-gray-100 dark:border-navy-700 py-1 z-50 animate-fade-in">
              {FORMAT_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFormatFilter(opt.value);
                    setShowFormatDropdown(false);
                  }}
                  className={`
                    w-full text-left px-3.5 py-2 text-xs font-medium transition-colors
                    ${activeFormatFilter === opt.value
                      ? 'text-[#BD9A5F] bg-[#BD9A5F]/5'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700'
                    }
                  `}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-5 animate-pulse"
              style={{ borderLeft: '4px solid rgba(189, 154, 95, 0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-16 bg-gray-200 dark:bg-navy-700 rounded" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-navy-700 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-navy-700 rounded mb-2" />
              <div className="h-3 w-full bg-gray-200 dark:bg-navy-700 rounded mb-1" />
              <div className="h-3 w-2/3 bg-gray-200 dark:bg-navy-700 rounded" />
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-800/50 flex items-center justify-center relative">
            <div className="w-3 h-3 rounded-full bg-[#BD9A5F] animate-pulse-slow" />
            <div className="absolute inset-0 rounded-full border border-[#BD9A5F]/20 animate-pulse-slow" />
          </div>
          <p
            className="text-gray-400 dark:text-gray-500 text-sm font-medium mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px' }}
          >
            No content available yet
          </p>
          <p
            className="text-gray-300 dark:text-gray-600 text-xs"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {activeTierFilter !== 'all' || activeFormatFilter !== 'all'
              ? 'No content matches these filters. Try adjusting your selection.'
              : 'Intelligence briefs will appear here as they are published.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article, index) => {
            const accessible = canAccess(membershipTier, article.tier_required);
            const badge = formatTypeBadge(article.format_type);
            const tier = tierDot(article.tier_required);
            const previewText = article.preview_text
              ? article.preview_text.length > 150
                ? article.preview_text.slice(0, 150) + '...'
                : article.preview_text
              : '';

            return (
              <button
                key={article.id}
                onClick={() => {
                  if (accessible) {
                    setSelectedArticle(article);
                  }
                }}
                disabled={!accessible}
                className={`
                  w-full text-left rounded-2xl p-5
                  transition-all relative overflow-hidden group
                  ${accessible
                    ? 'hover:shadow-md active:scale-[0.99] cursor-pointer'
                    : 'opacity-75 cursor-default'
                  }
                `}
                style={{
                  animationDelay: `${index * 60}ms`,
                  borderLeft: `4px solid ${accessible ? '#BD9A5F' : 'rgba(189, 154, 95, 0.15)'}`,
                  background: darkMode
                    ? 'rgba(13, 42, 77, 0.6)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.06)',
                  borderLeftWidth: '4px',
                  borderLeftColor: accessible ? '#BD9A5F' : 'rgba(189, 154, 95, 0.15)',
                }}
              >
                {/* Top row: badge + tier dot + date + lock */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${badge.color}`}
                      style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.35em' }}
                    >
                      {badge.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${tier.color}`} />
                      <span
                        className="text-[9px] text-gray-400 dark:text-gray-500 uppercase"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.35em' }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    <span
                      className="text-[11px] text-gray-400 dark:text-gray-500"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {formatRelativeDate(article.published_at)}
                    </span>
                  </div>

                  {!accessible && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#BD9A5F]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3
                  className={`text-base font-semibold mb-1.5 leading-snug ${
                    accessible
                      ? 'text-navy-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                >
                  {article.title}
                </h3>

                {/* Preview text */}
                {previewText && (
                  <p
                    className={`text-sm leading-relaxed line-clamp-2 ${
                      accessible
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    style={{ fontFamily: "'Libre Baskerville', serif" }}
                  >
                    {previewText}
                  </p>
                )}

                {/* Gated CTA overlay */}
                {!accessible && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#BD9A5F]/5 border border-[#BD9A5F]/10">
                    <svg className="w-4 h-4 text-[#BD9A5F] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                    </svg>
                    <span
                      className="text-[11px] font-semibold text-[#BD9A5F]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {article.tier_required === 'house_client'
                        ? 'House Client access required'
                        : 'Upgrade to Inner Circle'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IntelligenceTab;
