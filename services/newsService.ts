
// services/newsService.ts
// Fetches unified media feed from Alex Lexington RSS proxy worker
// Sources: Shopify Blog, Spotify/Anchor Podcast, YouTube

const MEDIA_FEED_URL = 'https://al-media-feed.andre-46c.workers.dev/';

export type MediaType = 'blog' | 'podcast' | 'youtube';

export interface NewsItem {
  id: string;
  type: MediaType;
  title: string;
  source: 'Alex Lexington';
  summary?: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  // Podcast-specific
  spotifyUrl?: string;
  duration?: string;
  // YouTube-specific
  videoId?: string;
}

export interface MediaLinks {
  spotify: string;
  youtube: string;
  instagram: string;
  tiktok: string;
}

export interface MediaFeedResponse {
  items: NewsItem[];
  total: number;
  mediaLinks: MediaLinks;
  cached?: boolean;
  errors?: { feed: string; error: string }[];
}

// Fallback data if the worker is unreachable
const FALLBACK_DATA: NewsItem[] = [
  {
    id: 'fallback-1',
    type: 'blog',
    title: "Visit the Alex Lexington Blog",
    source: "Alex Lexington",
    summary: "Read the latest articles on precious metals investing, market analysis, and fine jewelry.",
    url: "https://alexlexington.com/blogs/news",
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    type: 'podcast',
    title: "Listen to the Alex Lexington Network Podcast",
    source: "Alex Lexington",
    summary: "Join Andre and Danielle as they explore investing and indulging in precious metals and fine jewelry.",
    url: "https://open.spotify.com/show/263hqyQ6uyijeNtrOgTmS7",
    spotifyUrl: "https://open.spotify.com/show/263hqyQ6uyijeNtrOgTmS7",
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    type: 'youtube',
    title: "Watch Alex Lexington on YouTube",
    source: "Alex Lexington",
    summary: "Videos on precious metals, market updates, and behind-the-scenes at Alex Lexington.",
    url: "https://www.youtube.com/@alexlexingtonnetwork",
    publishedAt: new Date().toISOString(),
  }
];

const DEFAULT_MEDIA_LINKS: MediaLinks = {
  spotify: 'https://open.spotify.com/show/263hqyQ6uyijeNtrOgTmS7',
  youtube: 'https://www.youtube.com/@alexlexingtonnetwork',
  instagram: 'https://www.instagram.com/alex.lexington.precious.metals/',
  tiktok: 'https://www.tiktok.com/@alex_lexington_network'
};

// In-memory cache to avoid hammering the worker on every page load
let cachedResponse: { data: MediaFeedResponse; timestamp: number } | null = null;
const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const fetchMarketNews = async (type?: MediaType, limit: number = 15): Promise<NewsItem[]> => {
  // Check client-side cache
  const cacheKey = `${type || 'all'}_${limit}`;
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CLIENT_CACHE_TTL) {
    let items = cachedResponse.data.items;
    if (type) items = items.filter(i => i.type === type);
    return items.slice(0, limit);
  }

  try {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('limit', String(limit));

    const url = `${MEDIA_FEED_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Media feed returned ${response.status}`);

    const data: MediaFeedResponse = await response.json();

    // Cache the full response
    cachedResponse = { data, timestamp: Date.now() };

    if (data.errors && data.errors.length > 0) {
      console.warn('Some media feeds had errors:', data.errors);
    }

    return data.items;
  } catch (error) {
    console.warn('Failed to fetch media feed, using fallback:', error);
    return FALLBACK_DATA;
  }
};

export const fetchMediaLinks = async (): Promise<MediaLinks> => {
  // If we have cached data, use those links
  if (cachedResponse) {
    return cachedResponse.data.mediaLinks;
  }

  // Otherwise try a quick fetch
  try {
    const response = await fetch(`${MEDIA_FEED_URL}?limit=1`);
    if (response.ok) {
      const data: MediaFeedResponse = await response.json();
      return data.mediaLinks;
    }
  } catch (e) {
    // Ignore
  }

  return DEFAULT_MEDIA_LINKS;
};
