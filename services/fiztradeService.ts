/**
 * FizTrade Trading Service
 * API client for the FizTrade Trading Worker (Cloudflare Worker)
 * Handles market status, product browsing, price locking, trade execution, and quote management
 */

const FIZTRADE_API = import.meta.env.VITE_FIZTRADE_API_URL || '';

// ============================================
// TYPES
// ============================================

export interface FizTradeMarketStatus {
  isOpen: boolean;
  message: string;
  rawResponse?: Record<string, unknown>;
}

export interface FizTradeSpotPrices {
  goldAsk: number;
  goldBid: number;
  silverAsk: number;
  silverBid: number;
  platinumAsk: number;
  platinumBid: number;
  palladiumAsk: number;
  palladiumBid: number;
  timestamp: string;
}

export interface FizTradeProduct {
  productCode: string;
  description: string;
  metalType: string;
  weight: number;
  weightUnit: string;
  purity: number;
  isActiveSell: string;
  isIRAEligible: string;
  availability: string;
  askPrice?: number;
  bidPrice?: number;
}

export interface LockPriceItem {
  product: string;
  price: number;
  qty: string;
  amount: number;
  ask: number;
  bid: number;
}

export interface LockPricesResult {
  transactionId: string;
  lockToken: string;
  prices: LockPriceItem[];
  totalCost: number;
  expiresIn: string;
  lockedAt: string;
}

export interface ExecuteTradeResult {
  transactionId: string;
  referenceNumber: string;
  confirmationNumber: string | null;
  allConfirmations: string[];
  status: string;
  inventoryLocation?: string;
  bustedItems: string[];
  shippingOption: string;
  executedAt: string;
}

export interface QuoteItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  markup: number;
  retailPrice: number;
}

export interface FizTradeQuote {
  id: string;
  quote_ref: string;
  customer_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  items: QuoteItem[];
  subtotal: number;
  markup_total: number;
  total: number;
  notes?: string;
  status: 'pending' | 'executed' | 'cancelled';
  created_at: string;
  expires_at: string;
  fiztrade_confirmation?: string;
  fiztrade_transaction_id?: string;
  locked_prices?: LockPriceItem[];
  executed_at?: string;
}

export interface ProductPriceInfo {
  sku: string;
  description: string;
  askPrice: number;
  bidPrice: number;
  isActiveSell: boolean;
  availability: string;
}

// ============================================
// API FETCH HELPER
// ============================================

async function fiztradeFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!FIZTRADE_API) {
    throw new Error('FizTrade API not configured. Set VITE_FIZTRADE_API_URL in .env');
  }

  const url = `${FIZTRADE_API}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.details || `FizTrade API Error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// MARKET STATUS
// ============================================

export async function getMarketStatus(): Promise<FizTradeMarketStatus> {
  const result = await fiztradeFetch<{ success: boolean; data: FizTradeMarketStatus }>('/api/market/status');
  return result.data;
}

// ============================================
// PRICING
// ============================================

export async function getSpotPrices(): Promise<FizTradeSpotPrices> {
  const result = await fiztradeFetch<{ success: boolean; data: FizTradeSpotPrices }>('/api/prices/spot');
  return result.data;
}

// ============================================
// PRODUCTS
// ============================================

export async function getProductsByMetal(metal: string): Promise<FizTradeProduct[]> {
  const result = await fiztradeFetch<{ success: boolean; count: number; data: FizTradeProduct[] }>(
    `/api/products/${metal.toLowerCase()}`
  );
  return result.data;
}

export async function getProductPrice(sku: string): Promise<ProductPriceInfo> {
  const result = await fiztradeFetch<{ success: boolean; data: ProductPriceInfo }>(
    `/api/products/sku/${sku.toUpperCase()}`
  );
  return result.data;
}

// ============================================
// TRADING - LOCK & EXECUTE
// ============================================

export async function lockPrices(
  transactionId: string,
  items: Array<{ code: string; qty: string; transactionType: 'buy' | 'sell' }>
): Promise<LockPricesResult> {
  const result = await fiztradeFetch<{ success: boolean; data: LockPricesResult }>(
    '/api/trading/lock-prices',
    {
      method: 'POST',
      body: JSON.stringify({ transactionId, items }),
    }
  );
  return result.data;
}

export async function executeTrade(params: {
  transactionId: string;
  lockToken: string;
  referenceNumber: string;
  traderId?: string;
  shippingOption: 'hold' | 'drop_ship' | 'drop_ship_hold' | 'store';
  dropShipInfo?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    phone?: string;
  };
  idsAccountNumber?: string;
}): Promise<ExecuteTradeResult> {
  const result = await fiztradeFetch<{ success: boolean; data: ExecuteTradeResult }>(
    '/api/trading/execute',
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
  return result.data;
}

// ============================================
// QUOTES
// ============================================

export async function saveQuote(quoteData: {
  customerId?: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: QuoteItem[];
  subtotal: number;
  markup: number;
  total: number;
  notes?: string;
  createdBy?: string;
}): Promise<FizTradeQuote> {
  const result = await fiztradeFetch<{ success: boolean; data: FizTradeQuote }>(
    '/api/quotes',
    {
      method: 'POST',
      body: JSON.stringify(quoteData),
    }
  );
  return result.data;
}

export async function getPendingQuotes(): Promise<FizTradeQuote[]> {
  const result = await fiztradeFetch<{ success: boolean; count: number; data: FizTradeQuote[] }>(
    '/api/quotes/pending'
  );
  return result.data;
}

export async function executeQuote(
  quoteId: string,
  options?: {
    shippingOption?: 'hold' | 'drop_ship' | 'drop_ship_hold';
    dropShipInfo?: {
      name: string;
      address1: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      phone?: string;
    };
  }
): Promise<{
  quoteRef: string;
  transactionId: string;
  confirmationNumber: string;
  allConfirmations: string[];
  status: string;
  lockedPrices: LockPriceItem[];
  executedAt: string;
}> {
  const result = await fiztradeFetch<{ success: boolean; data: any }>(
    `/api/quotes/${quoteId}/execute`,
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
  return result.data;
}

// ============================================
// ORDER TRACKING
// ============================================

export async function getOrderStatus(confirmationNumber: string): Promise<Record<string, unknown>> {
  const result = await fiztradeFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/api/orders/${confirmationNumber}`
  );
  return result.data;
}

// ============================================
// HELPERS
// ============================================

export function isConfigured(): boolean {
  return !!FIZTRADE_API;
}

export { FIZTRADE_API };
