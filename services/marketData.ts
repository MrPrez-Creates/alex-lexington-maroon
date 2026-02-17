
import { SpotPrices, MetalType, MarketHistoryRecord } from '../types';
import { MOCK_SPOT_PRICES } from '../constants';
// Market history uses static data only

const LIVE_TICKER_URL = 'https://alex-app-live-ticker.andre-46c.workers.dev/';

export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface PriceChangeData {
  [key: string]: { change: string; trend: 'up' | 'down' };
}

// Sampled Historical Data from 1985-2026
// Dataset condensed from full daily records to optimize client-side performance while maintaining trend accuracy.
const HISTORICAL_DATA_SOURCE: MarketHistoryRecord[] = [
    // --- 2026 (Current) ---
    { date: "2026-01-13", XAU: 4617.30, XAG: 88.36, XPT: 2370, XPD: 1882 },
    { date: "2026-01-02", XAU: 4520.00, XAG: 85.50, XPT: 2320, XPD: 1850 },

    // --- 2025 Q4 (Bull Market Continuation) ---
    { date: "2025-12-15", XAU: 4380.00, XAG: 78.20, XPT: 2180, XPD: 1780 },
    { date: "2025-12-01", XAU: 4210.00, XAG: 72.40, XPT: 2050, XPD: 1720 },
    { date: "2025-11-15", XAU: 4050.00, XAG: 65.80, XPT: 1850, XPD: 1580 },
    { date: "2025-11-01", XAU: 3920.00, XAG: 58.50, XPT: 1620, XPD: 1420 },
    { date: "2025-10-15", XAU: 3780.00, XAG: 52.30, XPT: 1380, XPD: 1250 },
    { date: "2025-10-01", XAU: 3710.00, XAG: 46.80, XPT: 1150, XPD: 1080 },

    // --- 2025 (Projected Bull Market) ---
    { date: "2025-09-10", XAU: 3630.90, XAG: 40.92, XPT: 944, XPD: 943 },
    { date: "2025-09-01", XAU: 3476.47, XAG: 40.70, XPT: 943, XPD: 960 },
    { date: "2025-08-15", XAU: 3335.39, XAG: 38.02, XPT: 938, XPD: 930 },
    { date: "2025-08-01", XAU: 3362.88, XAG: 37.05, XPT: 942, XPD: 912 },
    { date: "2025-07-15", XAU: 3322.63, XAG: 37.74, XPT: 997, XPD: 995 },
    { date: "2025-07-01", XAU: 3339.21, XAG: 36.09, XPT: 1002, XPD: 938 },
    { date: "2025-06-16", XAU: 3383.20, XAG: 36.36, XPT: 960, XPD: 890 },
    { date: "2025-06-02", XAU: 3380.21, XAG: 34.82, XPT: 1049, XPD: 971 },
    { date: "2025-05-15", XAU: 3240.87, XAG: 32.70, XPT: 975, XPD: 950 },
    { date: "2025-05-01", XAU: 3241.00, XAG: 32.43, XPT: 905, XPD: 1011 },
    { date: "2025-04-15", XAU: 3227.60, XAG: 32.30, XPT: 982, XPD: 1067 },
    { date: "2025-04-01", XAU: 3110.55, XAG: 33.74, XPT: 903, XPD: 1007 },
    { date: "2025-03-17", XAU: 3001.47, XAG: 33.84, XPT: 917, XPD: 1026 },
    { date: "2025-03-03", XAU: 2893.71, XAG: 31.68, XPT: 898, XPD: 951 },
    { date: "2025-02-14", XAU: 2883.18, XAG: 32.14, XPT: 890, XPD: 934 },
    { date: "2025-02-03", XAU: 2813.49, XAG: 31.55, XPT: 901, XPD: 955 },
    { date: "2025-01-15", XAU: 2695.82, XAG: 30.66, XPT: 948, XPD: 1003 },
    { date: "2025-01-02", XAU: 2657.16, XAG: 29.57, XPT: 958, XPD: 1208 },

    // --- 2024 ---
    { date: "2024-12-31", XAU: 2623.81, XAG: 28.87, XPT: 964, XPD: 1221 },
    { date: "2024-12-16", XAU: 2652.50, XAG: 30.52, XPT: 905, XPD: 957 },
    { date: "2024-12-02", XAU: 2638.93, XAG: 30.50, XPT: 931, XPD: 1066 },
    { date: "2024-11-15", XAU: 2561.24, XAG: 30.21, XPT: 899, XPD: 1070 },
    { date: "2024-11-01", XAU: 2735.16, XAG: 32.43, XPT: 887, XPD: 1120 },
    { date: "2024-10-15", XAU: 2660.99, XAG: 31.47, XPT: 874, XPD: 1177 },
    { date: "2024-10-01", XAU: 2662.82, XAG: 31.41, XPT: 943, XPD: 1292 },
    { date: "2024-09-16", XAU: 2582.58, XAG: 30.76, XPT: 945, XPD: 1205 },
    { date: "2024-09-02", XAU: 2499.29, XAG: 28.50, XPT: 911, XPD: 1240 },
    { date: "2024-08-15", XAU: 2456.10, XAG: 28.39, XPT: 921, XPD: 1250 },
    { date: "2024-08-01", XAU: 2445.42, XAG: 28.55, XPT: 970, XPD: 1297 },
    { date: "2024-07-15", XAU: 2422.07, XAG: 31.01, XPT: 911, XPD: 1233 },
    { date: "2024-07-01", XAU: 2331.70, XAG: 29.44, XPT: 983, XPD: 1393 },
    { date: "2024-06-14", XAU: 2332.52, XAG: 29.54, XPT: 1007, XPD: 1419 },
    { date: "2024-06-03", XAU: 2350.35, XAG: 30.76, XPT: 1071, XPD: 1518 },
    { date: "2024-05-15", XAU: 2386.04, XAG: 29.70, XPT: 1074, XPD: 1497 },
    { date: "2024-05-01", XAU: 2317.90, XAG: 26.64, XPT: 1043, XPD: 1484 },
    { date: "2024-04-15", XAU: 2382.51, XAG: 28.89, XPT: 0, XPD: 1406 },
    { date: "2024-04-01", XAU: 2250.36, XAG: 25.09, XPT: 988, XPD: 1432 },
    { date: "2024-03-15", XAU: 2155.54, XAG: 25.16, XPT: 950, XPD: 1465 },
    { date: "2024-03-01", XAU: 2083.39, XAG: 23.15, XPT: 944, XPD: 1555 },
    { date: "2024-02-15", XAU: 2004.09, XAG: 22.90, XPT: 1010, XPD: 1642 },
    { date: "2024-02-01", XAU: 2054.89, XAG: 23.15, XPT: 1057, XPD: 1739 },
    { date: "2024-01-15", XAU: 2054.49, XAG: 23.20, XPT: 984, XPD: 1692 },
    { date: "2024-01-01", XAU: 2063.80, XAG: 23.82, XPT: 1004, XPD: 1859 },

    // --- 2023 ---
    { date: "2023-12-01", XAU: 2070.90, XAG: 25.42, XPT: 993, XPD: 1888 },
    { date: "2023-11-01", XAU: 1982.15, XAG: 22.99, XPT: 912, XPD: 2253 },
    { date: "2023-10-02", XAU: 1827.40, XAG: 21.07, XPT: 855, XPD: 2009 },
    { date: "2023-09-01", XAU: 1938.80, XAG: 24.16, XPT: 938, XPD: 2221 },
    { date: "2023-08-01", XAU: 1944.08, XAG: 24.33, XPT: 867, XPD: 1957 },
    { date: "2023-07-03", XAU: 1921.43, XAG: 22.88, XPT: 1007, XPD: 1950 },
    { date: "2023-06-01", XAU: 1977.88, XAG: 23.91, XPT: 972, XPD: 2227 },
    { date: "2023-05-01", XAU: 1982.05, XAG: 24.97, XPT: 964, XPD: 2111 },
    { date: "2023-04-03", XAU: 1984.11, XAG: 24.00, XPT: 1062, XPD: 2595 },
    { date: "2023-03-01", XAU: 1836.81, XAG: 21.00, XPT: 1003, XPD: 2328 },
    { date: "2023-02-01", XAU: 1950.42, XAG: 23.98, XPT: 959, XPD: 1973 },
    { date: "2023-01-02", XAU: 1823.69, XAG: 23.99, XPT: 978, XPD: 1798 },

    // --- 2022 ---
    { date: "2022-12-01", XAU: 1802.89, XAG: 22.77, XPT: 1023, XPD: 1963 },
    { date: "2022-10-03", XAU: 1699.22, XAG: 20.76, XPT: 991, XPD: 2392 },
    { date: "2022-08-01", XAU: 1771.73, XAG: 20.34, XPT: 1090, XPD: 2634 },
    { date: "2022-06-01", XAU: 1845.55, XAG: 21.80, XPT: 1214, XPD: 2879 },
    { date: "2022-04-01", XAU: 1924.30, XAG: 24.61, XPT: 1266, XPD: 2370 },
    { date: "2022-02-01", XAU: 1800.65, XAG: 22.63, XPT: 1031, XPD: 2323 },
    { date: "2022-01-03", XAU: 1800.85, XAG: 22.86, XPT: 935, XPD: 2338 },

    // --- 2021 ---
    { date: "2021-11-01", XAU: 1793.05, XAG: 24.02, XPT: 975, XPD: 2343 },
    { date: "2021-09-01", XAU: 1813.66, XAG: 24.17, XPT: 833, XPD: 1957 },
    { date: "2021-07-01", XAU: 1776.6, XAG: 26.01, XPT: 768, XPD: 1830 },
    { date: "2021-05-03", XAU: 1792.36, XAG: 26.87, XPT: 870, XPD: 2489 },
    { date: "2021-03-01", XAU: 1723.84, XAG: 26.51, XPT: 983, XPD: 2016 },
    { date: "2021-01-01", XAU: 1898.10, XAG: 26.36, XPT: 947, XPD: 1797 },

    // --- 2020 ---
    { date: "2020-11-02", XAU: 1895.10, XAG: 24.04, XPT: 941, XPD: 1525 },
    { date: "2020-09-01", XAU: 1970.49, XAG: 28.17, XPT: 843, XPD: 1552 },
    { date: "2020-08-06", XAU: 2063.81, XAG: 28.94, XPT: 827, XPD: 1346 }, // 2020 High
    { date: "2020-07-01", XAU: 1770.32, XAG: 17.94, XPT: 889, XPD: 1431 },
    { date: "2020-05-01", XAU: 1700.41, XAG: 14.94, XPT: 830, XPD: 1482 },
    { date: "2020-03-16", XAU: 1514.61, XAG: 12.90, XPT: 823, XPD: 1313 }, // 2020 Low
    { date: "2020-01-02", XAU: 1528.94, XAG: 18.01, XPT: 835, XPD: 1086 },

    // --- Yearly Samples for Historical Context ---
    { date: "2019-01-02", XAU: 1284.77, XAG: 15.52, XPT: 911, XPD: 943 },
    { date: "2018-01-02", XAU: 1318.14, XAG: 17.19, XPT: 1036, XPD: 691 },
    { date: "2017-01-03", XAU: 1158.91, XAG: 16.29, XPT: 952, XPD: 589 },
    { date: "2016-01-04", XAU: 1074.70, XAG: 13.88, XPT: 1424, XPD: 898 },
    { date: "2015-01-02", XAU: 1189.18, XAG: 15.77, XPT: 1491, XPD: 737 },
    { date: "2014-01-02", XAU: 1224.89, XAG: 20.02, XPT: 1394, XPD: 586 },
    { date: "2013-01-02", XAU: 1686.75, XAG: 30.99, XPT: 1773, XPD: 792 },
    { date: "2012-01-03", XAU: 1604.14, XAG: 29.62, XPT: 1508, XPD: 433 },
    { date: "2011-09-06", XAU: 1900.49, XAG: 42.92, XPT: 1533, XPD: 430 }, // 2011 Peak
    { date: "2011-01-03", XAU: 1414.30, XAG: 30.69, XPT: 1206, XPD: 242 },
    { date: "2010-01-04", XAU: 1120.40, XAG: 17.55, XPT: 1974, XPD: 421 },
    { date: "2009-01-02", XAU: 876.55, XAG: 11.57, XPT: 1302, XPD: 357.9 },
    { date: "2008-03-17", XAU: 1002.7, XAG: 20.17, XPT: 1242, XPD: 320 }, // 2008 Peak
    { date: "2008-01-02", XAU: 857.2, XAG: 15.25, XPT: 1170, XPD: 376 },
    { date: "2007-01-03", XAU: 627.7, XAG: 12.56, XPT: 861.5, XPD: 198 },
    { date: "2006-01-03", XAU: 533.6, XAG: 9.18, XPT: 908, XPD: 290 },
    { date: "2005-01-03", XAU: 428.95, XAG: 6.48, XPT: 666, XPD: 230 },
    { date: "2004-01-02", XAU: 415.12, XAG: 5.97, XPT: 512, XPD: 372 },
    { date: "2003-01-02", XAU: 345.62, XAG: 4.81, XPT: 595, XPD: 975 },
    { date: "2002-01-02", XAU: 278.85, XAG: 4.58, XPT: 497, XPD: 497 },
    { date: "2001-01-02", XAU: 268.85, XAG: 4.57, XPT: 353, XPD: 322.5 },
    { date: "2000-01-03", XAU: 289.0, XAG: 5.36, XPT: 367.5, XPD: 201.5 },
    { date: "1999-01-04", XAU: 287.35, XAG: 4.94, XPT: 368.25, XPD: 117 },
    { date: "1998-01-02", XAU: 288.25, XAG: 5.97, XPT: 409.6, XPD: 130.5 },
    { date: "1997-01-02", XAU: 365.4, XAG: 4.72, XPT: 414.25, XPD: 156.25 },
    { date: "1996-01-02", XAU: 390.6, XAG: 5.35, XPT: 375, XPD: 130.4 },
    { date: "1995-01-03", XAU: 379.7, XAG: 4.75, XPT: 356.85, XPD: 94.4 },
    { date: "1994-01-03", XAU: 393.75, XAG: 5.23, XPT: 367, XPD: 87.2 },
    { date: "1993-01-04", XAU: 328.55, XAG: 3.65, XPT: 446.75, XPD: 99.65 },
    { date: "1992-01-02", XAU: 352.45, XAG: 3.97, XPT: 0, XPD: 0 },
    { date: "1991-01-02", XAU: 388.65, XAG: 4.13, XPT: 0, XPD: 0 },
    { date: "1990-01-02", XAU: 399.45, XAG: 5.19, XPT: 0, XPD: 0 },
    { date: "1989-01-03", XAU: 410.28, XAG: 5.89, XPT: 0, XPD: 0 },
    { date: "1988-01-04", XAU: 480.76, XAG: 6.47, XPT: 0, XPD: 0 },
    { date: "1987-12-14", XAU: 498.25, XAG: 6.99, XPT: 0, XPD: 0 }, // 87 High
    { date: "1987-01-02", XAU: 403.1, XAG: 5.45, XPT: 0, XPD: 0 },
    { date: "1986-01-02", XAU: 326.5, XAG: 5.73, XPT: 0, XPD: 0 },
    { date: "1985-01-02", XAU: 305.5, XAG: 6.15, XPT: 0, XPD: 0 }
];

// In-memory cache for daily price updates during session
let sessionHistory: MarketHistoryRecord[] = [];

const updateSessionHistory = (prices: SpotPrices) => {
    const today = new Date().toISOString().split('T')[0];
    const record: MarketHistoryRecord = {
      date: today,
      XAU: prices[MetalType.GOLD] || 0,
      XAG: prices[MetalType.SILVER] || 0,
      XPT: prices[MetalType.PLATINUM] || 0,
      XPD: prices[MetalType.PALLADIUM] || 0
    };

    const existingIndex = sessionHistory.findIndex(d => d.date === today);
    if (existingIndex >= 0) {
        sessionHistory[existingIndex] = record;
    } else {
        sessionHistory.push(record);
    }
};

// Module-level cache for price change data from the live ticker API
let _latestPriceChanges: PriceChangeData = {};

export const getLatestPriceChanges = (): PriceChangeData => _latestPriceChanges;

export const fetchLiveSpotPrices = async (): Promise<SpotPrices> => {
  try {
    const response = await fetch(LIVE_TICKER_URL);
    if (!response.ok) throw new Error('Failed to fetch live prices');
    const data = await response.json();

    // Initialize with fallback
    const formattedPrices: SpotPrices = { ...MOCK_SPOT_PRICES };
    const changes: PriceChangeData = {};

    if (Array.isArray(data)) {
        data.forEach((item: any) => {
            const key = item.label || item.name;
            const priceStr = String(item.price).replace(/[^0-9.]/g, '');
            const price = parseFloat(priceStr);

            if (key && !isNaN(price)) {
                // Normalize keys to lowercase to match MetalType enum
                const normalizedKey = key.toLowerCase();
                if (Object.values(MetalType).includes(normalizedKey as MetalType)) {
                    formattedPrices[normalizedKey] = price;
                    // Capture change/trend data from the API response
                    if (item.change && item.trend) {
                        changes[normalizedKey] = {
                            change: item.change,
                            trend: item.trend as 'up' | 'down',
                        };
                    }
                }
            }
        });
    }

    // Store latest change data for the ticker
    _latestPriceChanges = changes;

    // Update session cache with latest prices
    updateSessionHistory(formattedPrices);

    return formattedPrices;
  } catch (error) {
    console.warn('API Error fetching live prices, using fallback data:', error);
    return MOCK_SPOT_PRICES;
  }
};

export const fetchChartHistory = async (metal: string, timeframe: string): Promise<HistoricalDataPoint[]> => {
  // Normalize metal name to lowercase for case-insensitive matching
  const metalLower = metal.toLowerCase();

  let dataKey = 'XAU';
  if (metalLower === 'silver') dataKey = 'XAG';
  if (metalLower === 'platinum') dataKey = 'XPT';
  if (metalLower === 'palladium') dataKey = 'XPD';

  const combinedMap = new Map<string, MarketHistoryRecord>();
  
  // 1. Load static historical set
  HISTORICAL_DATA_SOURCE.forEach(item => {
    if (item && item.date) {
        combinedMap.set(item.date, item);
    }
  });

  // 2. Overlay session updates (live prices captured during this session)
  sessionHistory.forEach(item => {
    if (item && item.date) {
        combinedMap.set(item.date, item);
    }
  });

  const combinedArray = Array.from(combinedMap.values()).sort((a, b) => {
    // Robust date parsing with safety checks
    if (!a.date || !b.date) return 0;
    try {
        const dateA = new Date(a.date.replace(/-/g, '/')).getTime(); // Replace - with / for broader compatibility
        const dateB = new Date(b.date.replace(/-/g, '/')).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateA - dateB;
    } catch (e) {
        return 0;
    }
  });

  // Filter out bad data points and ensure value is a valid number
  const allData = combinedArray.map(item => ({
      date: item.date,
      value: parseFloat(String(item[dataKey as keyof typeof item] || 0))
  })).filter(d => !isNaN(d.value) && d.value > 0);

  const totalPoints = allData.length;
  let sliceCount = totalPoints;

  switch (timeframe) {
      case '1D': sliceCount = 5; break; // Show last few data points
      case '1W': sliceCount = 7; break;
      case '1M': sliceCount = 30; break;
      case '3M': sliceCount = 90; break;
      case '1Y': sliceCount = 365; break; // Approx
      case 'ALL': sliceCount = totalPoints; break;
      default: sliceCount = 30;
  }

  // Optimize slicing for large datasets if 'ALL' is selected to prevent chart lag
  if (timeframe === 'ALL' && totalPoints > 500) {
      // Return every nth point to keep chart responsive
      const step = Math.ceil(totalPoints / 500);
      return allData.filter((_, index) => index % step === 0);
  }

  const actualSlice = Math.min(sliceCount, totalPoints);
  const startIndex = Math.max(0, totalPoints - actualSlice);
  
  let result = allData.slice(startIndex);
  
  // CRITICAL FIX: Ensure chart always has at least 2 points to render a line, avoiding crashes
  if (result.length < 2) {
      const fallbackValue = MOCK_SPOT_PRICES[metal.toLowerCase() as keyof typeof MOCK_SPOT_PRICES] || 0;
      // Generate a tiny variance so line isn't perfectly flat/invisible
      result = [
          { date: new Date(Date.now() - 86400000).toISOString(), value: fallbackValue * 0.99 },
          { date: new Date().toISOString(), value: fallbackValue }
      ];
  }
  
  return result;
};
