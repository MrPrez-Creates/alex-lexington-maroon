
// services/newsService.ts

export interface NewsItem {
  id: string;
  title: string;
  source: 'Bloomberg' | 'Alex Lexington' | 'Market Wire' | 'Other';
  summary?: string;
  url: string;
  publishedAt: string; // ISO Date String
  imageUrl?: string;
}

// In a real production environment, you would use a backend proxy to fetch these RSS feeds 
// to avoid CORS issues in the browser.
// const FEED_URLS = [
//   'https://www.bloomberg.com/feeds/commodities',
//   'https://alexlexington.com/feed',
// ];

const MOCK_NEWS_DATA: NewsItem[] = [
  {
    id: 'al-001',
    title: "Alex Lexington Network: Strategic Gold Reserves Update",
    source: "Alex Lexington",
    summary: "An in-depth look at how central banks are adjusting their gold positions heading into Q4 2024.",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'bb-001',
    title: "Gold Rallies as Inflation Data Signals Persistent Price Pressures",
    source: "Bloomberg",
    summary: "Bullion advanced for a third day as traders weighed the latest CPI print against Federal Reserve signals.",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(), // 4.5 hours ago
  },
  {
    id: 'al-002',
    title: "New Inventory Alert: 2025 Sovereign Coins",
    source: "Alex Lexington",
    summary: "We have just received our first shipment of 2025 Sovereigns and Britannias. Available for immediate vaulting.",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
  },
  {
    id: 'bb-002',
    title: "Platinum Supply Deficits Forecast to Widen Through 2025",
    source: "Bloomberg",
    summary: "Industrial demand for platinum in automotive catalysts is outstripping mine supply from South Africa.",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day, 2 hours ago
  },
  {
    id: 'al-003',
    title: "Blog: The Ratio Trade - Silver vs Gold",
    source: "Alex Lexington",
    summary: "Why the current gold-silver ratio might present a historic buying opportunity for white metal investors.",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  }
];

export const fetchMarketNews = async (): Promise<NewsItem[]> => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, replace this with:
  // const response = await fetch('YOUR_RSS_TO_JSON_ENDPOINT');
  // const data = await response.json();
  // return data.map(...)

  // Return mock data sorted by date (newest first)
  return MOCK_NEWS_DATA.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
};
