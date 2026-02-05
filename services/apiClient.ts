/**
 * API Client for al-business-api
 * Connects Maroon customer app to Supabase backend via Cloudflare Worker
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Customer types matching Supabase schema
export interface Customer {
  id: string;
  contact_info: {
    emails: string[];
    phones: string[];
    first_names: string[];
    last_names: string[];
  };
  created_at: string;
  updated_at: string;
  total_spent?: number;
  last_active?: string;
  billing_address?: string;
  customer_type?: 'RETAIL' | 'WHOLESALE' | 'VIP';
  kyc_status?: 'PENDING' | 'VERIFIED' | 'FAILED';
}

export interface Order {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  metal_type?: string;
  weight_oz?: number;
}

export interface Inventory {
  id: string;
  sku: string;
  name: string;
  metal_type: string;
  weight_oz: number;
  purity: number;
  quantity: number;
  cost_per_oz: number;
  location?: string;
}

export interface PriceLock {
  id: string;
  customer_id: string;
  metal_type: string;
  locked_price: number;
  weight_oz: number;
  deposit_amount: number;
  expires_at: string;
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
}

/**
 * Generic API fetch with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

export async function getCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<Customer>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return apiFetch(`/api/customers${query ? `?${query}` : ''}`);
}

export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return apiFetch(`/api/customers/${id}`);
}

export async function createCustomer(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
  return apiFetch('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
  return apiFetch(`/api/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================
// ORDER ENDPOINTS
// ============================================

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  customer_id?: string;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.customer_id) searchParams.set('customer_id', params.customer_id);
  if (params?.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return apiFetch(`/api/orders${query ? `?${query}` : ''}`);
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return apiFetch(`/api/orders/${id}`);
}

export async function createOrder(data: {
  customer_id: string;
  items: Omit<OrderItem, 'id' | 'order_id'>[];
}): Promise<ApiResponse<Order>> {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// INVENTORY ENDPOINTS
// ============================================

export async function getInventory(params?: {
  metal_type?: string;
  in_stock?: boolean;
}): Promise<PaginatedResponse<Inventory>> {
  const searchParams = new URLSearchParams();
  if (params?.metal_type) searchParams.set('metal_type', params.metal_type);
  if (params?.in_stock !== undefined) searchParams.set('in_stock', params.in_stock.toString());

  const query = searchParams.toString();
  return apiFetch(`/api/inventory${query ? `?${query}` : ''}`);
}

// ============================================
// PRICE LOCK ENDPOINTS (10% Deposit System)
// ============================================

export async function getPriceLocks(customer_id?: string): Promise<PaginatedResponse<PriceLock>> {
  const query = customer_id ? `?customer_id=${customer_id}` : '';
  return apiFetch(`/api/price-locks${query}`);
}

export async function createPriceLock(data: {
  customer_id: string;
  metal_type: string;
  locked_price: number;
  weight_oz: number;
  deposit_amount: number;
  expires_hours?: number;
}): Promise<ApiResponse<PriceLock>> {
  return apiFetch('/api/price-locks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// CUSTOMER VAULT HOLDINGS (For Maroon App Vault Display)
// ============================================

export interface VaultHolding {
  holding_id: string;
  order_id: number;
  order_number: string;
  item_id: number;
  name: string;
  description: string;
  sku: string | null;
  image_url: string | null;
  metal_code: string;
  metal_name: string;
  weight_ozt: number;
  weight_category: string | null;
  quantity: number;
  cost_basis: number;
  cost_per_ozt: number;
  spot_at_purchase: number;
  current_spot: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percent: number;
  status: 'in_vault' | 'in_transit';
  fulfillment_type: string;
  purchased_at: string;
  delivered_at: string | null;
}

export interface VaultSummary {
  total_cost: number;
  total_value: number;
  total_gain_loss: number;
  total_gain_loss_percent: number;
  by_metal: Array<{
    metal_code: string;
    metal_name: string;
    total_ozt: number;
    total_cost: number;
    current_value: number;
    current_spot: number;
    item_count: number;
  }>;
}

export interface CustomerVaultResponse {
  holdings: VaultHolding[];
  summary: VaultSummary;
}

/**
 * Get customer holdings by Supabase customer ID
 */
export async function getCustomerHoldings(
  customerId: string | number,
  includeHistory = false
): Promise<ApiResponse<CustomerVaultResponse>> {
  const query = includeHistory ? '?include_history=true' : '';
  return apiFetch(`/api/customer-vault/${customerId}/holdings${query}`);
}

/**
 * Get customer holdings by user ID (Supabase or Firebase UID)
 * (Used by Maroon app - endpoint supports both Firebase and Supabase UIDs via maroon_user_id field)
 */
export async function getCustomerHoldingsByFirebaseUid(
  userId: string,
  includeHistory = false
): Promise<ApiResponse<CustomerVaultResponse>> {
  const query = includeHistory ? '?include_history=true' : '';
  // Note: The endpoint name still says "firebase" but it looks up by maroon_user_id
  // which now stores Supabase UIDs for new users
  return apiFetch(`/api/customer-vault/by-firebase/${userId}/holdings${query}`);
}

/**
 * Get customer order history
 */
export async function getCustomerOrderHistory(
  customerId: string | number,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  return apiFetch(`/api/customer-vault/${customerId}/orders${query ? `?${query}` : ''}`);
}

/**
 * Get quick summary of customer holdings (for dashboard)
 */
export async function getCustomerVaultSummary(customerId: string | number): Promise<ApiResponse<{
  total_orders: number;
  completed_orders: number;
  total_spent: number;
  total_ozt: number;
  current_value: number;
  gain_loss: number;
  by_metal: Record<string, { ozt: number; value: number }>;
}>> {
  return apiFetch(`/api/customer-vault/${customerId}/summary`);
}

// ============================================
// PHYSICAL VAULT HOLDINGS (client_vault_holdings)
// ============================================

export interface PhysicalVaultHolding {
  holding_id: number;
  account_id: number;
  product_id: number | null;
  metal_id: number;
  description: string;
  weight_ozt: number;
  quantity: number;
  cost_basis: number | null;
  purchase_price_per_ozt: number | null;
  location_id: number | null;
  bag_tag: string | null;
  source_type: string;
  status: 'held' | 'withdrawn' | 'pending_withdrawal';
  deposited_at: string;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
  computed_current_value: number;
  computed_gain_loss: number;
  computed_gain_loss_percent: number;
  products: { product_id: number; name: string; sku: string } | null;
  metals: { metal_id: number; code: string; name: string; current_spot_price: number } | null;
}

export interface PhysicalVaultResponse {
  account: any | null;
  holdings: PhysicalVaultHolding[];
  summary: {
    total_ozt: number;
    total_value: number;
    total_cost: number;
    gain_loss: number;
    by_metal: Record<string, { ozt: number; value: number; cost: number; count: number }>;
  };
}

/**
 * Get customer's physical vault holdings (items stored with Alex Lexington)
 */
export async function getClientVaultHoldings(
  customerId: string | number
): Promise<ApiResponse<PhysicalVaultResponse>> {
  return apiFetch(`/api/client-holdings/${customerId}`);
}

// ============================================
// FUNDING / WITHDRAWAL ENDPOINTS
// ============================================

export interface WithdrawalRequest {
  customer_id: string;
  bank_account_id?: string;
  amount: number;
  speed?: 'standard' | 'wire';
  description?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  transaction_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  message: string;
  destination: string;
}

export interface FundingBalance {
  available_balance: number;
  pending_deposits: number;
  pending_withdrawals?: number;
  total_balance: number;
}

export interface FundingTransaction {
  transaction_id: string;
  customer_id: string;
  amount: number;
  fee?: number;
  type: 'deposit' | 'withdrawal' | 'liquidation';
  status: string;
  initiated_at: string;
  completed_at?: string;
  description?: string;
}

/**
 * Request a withdrawal (creates pending transaction for staff approval)
 */
export async function requestWithdrawal(data: WithdrawalRequest): Promise<ApiResponse<WithdrawalResponse>> {
  return apiFetch('/api/funding/withdraw/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get customer's funding balance
 */
export async function getFundingBalance(customerId: string): Promise<ApiResponse<FundingBalance>> {
  return apiFetch(`/api/plaid/balance/${customerId}`);
}

/**
 * Get customer's funding transaction history
 */
export async function getFundingTransactions(
  customerId: string,
  params?: { page?: number; limit?: number }
): Promise<{ data: FundingTransaction[]; pagination: { page: number; limit: number; total: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  return apiFetch(`/api/plaid/transactions/${customerId}${query ? `?${query}` : ''}`);
}

// ============================================
// SHOP - Browse & Purchase Inventory
// ============================================

export interface ShopListing {
  inventory_id: number;
  product_id: number | null;
  item_type: 'bullion' | 'coin';
  name: string;
  description: string | null;
  sku: string | null;
  image_url: string | null;
  metal_id: number;
  metal_code: string;
  metal_name: string;
  weight_ozt: number;
  weight_grams: number;
  purity: number | null;
  purity_display: string;
  quantity_available: number;
  current_spot: number;
  spot_value: number;
  premium_percent: number;
  sale_price: number;
}

export interface ShopReservation {
  order_id: number;
  order_number: string;
  total: number;
  status: string;
  expires_at: string;
}

/**
 * Get available bullion/coins for purchase
 */
export async function getShopListings(params?: {
  metal_id?: number;
  min_weight?: number;
  max_weight?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: ShopListing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.metal_id) searchParams.set('metal_id', params.metal_id.toString());
  if (params?.min_weight) searchParams.set('min_weight', params.min_weight.toString());
  if (params?.max_weight) searchParams.set('max_weight', params.max_weight.toString());
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  return apiFetch(`/api/shop/available${query ? `?${query}` : ''}`);
}

/**
 * Get details for a specific shop item
 */
export async function getShopItem(inventoryId: number): Promise<ApiResponse<ShopListing>> {
  return apiFetch(`/api/shop/available/${inventoryId}`);
}

/**
 * Reserve an item for purchase (creates pending order)
 */
export async function reserveShopItem(data: {
  inventory_id: number;
  customer_id: string;
  quantity?: number;
}): Promise<ApiResponse<ShopReservation>> {
  return apiFetch('/api/shop/reserve', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get current spot prices for all metals
 */
export async function getShopMetalPrices(): Promise<ApiResponse<Array<{
  metal_id: number;
  code: string;
  name: string;
  current_spot_price: number;
  updated_at: string;
}>>> {
  return apiFetch('/api/shop/metals');
}

// ============================================
// WALLET / FUNDING
// ============================================

export interface FundingInfo {
  al_account_number: string | null;
  customer_name: string;
  balance: {
    available: number;
    pending: number;
    cash: number;
  };
  wire_instructions: {
    bank_name: string;
    bank_address: string;
    routing_number: string;
    account_number: string;
    beneficiary_name: string;
    beneficiary_address: string;
  };
  memo_instructions: string;
  timing: {
    wire: string;
    ach: string;
  };
}

export async function getWalletFundingInfo(customerId: string): Promise<FundingInfo> {
  return apiFetch(`/api/funding/info/${customerId}`);
}

// ============================================
// HEALTH CHECK
// ============================================

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return apiFetch('/health');
}

// Export API base for debugging
export { API_BASE };
