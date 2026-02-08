/**
 * API Service for Maroon Customer App
 * Connects to al-business-api Cloudflare Worker for unified data storage with Command Center
 */

import { supabase } from '../lib/supabase';
import { CustomerProfile, SharedCustomer, VaultHolding, SharedTransaction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get Supabase auth token for API requests
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (e) {
    console.warn('Failed to get auth token:', e);
    return null;
  }
};

/**
 * Make authenticated API request
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = await getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `Request failed with status ${response.status}` };
    }

    return data;
  } catch (error: any) {
    console.error('API request failed:', error);
    return { error: error.message || 'Network error' };
  }
};

/**
 * Check API health/availability
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
};

// ============================================================================
// CUSTOMER FUNCTIONS
// ============================================================================

/**
 * Get current user's customer profile from Command Center database
 */
export const getMyCustomerProfile = async (): Promise<SharedCustomer | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // First try by maroon_user_id (now Supabase UID)
  const response = await apiRequest<any>(`/api/customers/by-maroon/${user.id}`);

  if (!response.error && response.data) {
    return mapApiCustomerToShared(response.data);
  }

  // Fallback: search by email
  if (user.email) {
    const searchResponse = await apiRequest<any[]>(
      `/api/customers?search=${encodeURIComponent(user.email)}&limit=1`
    );

    if (searchResponse.data && searchResponse.data.length > 0) {
      const customer = searchResponse.data[0];
      if (customer.email?.toLowerCase() === user.email.toLowerCase()) {
        return mapApiCustomerToShared(customer);
      }
    }
  }

  return null;
};

/**
 * Resolve the authenticated Supabase user to a Command Center customer_id.
 *
 * Flow:
 *  1. Look up by maroon_user_id (Supabase UID) — fast path for returning users.
 *  2. If not found, search by email.
 *     - If email match found, PATCH customer to set maroon_user_id + has_maroon_account.
 *  3. If no match at all, create a new customer record.
 *
 * Returns the numeric customer_id (as a string) or null on failure.
 */
export const resolveCustomerId = async (): Promise<{
  customerId: string | null;
  customer: SharedCustomer | null;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { customerId: null, customer: null };

  // 1. Try by maroon_user_id (Supabase UID)
  const byUidResponse = await apiRequest<any>(`/api/customers/by-maroon/${user.id}`);
  if (!byUidResponse.error && byUidResponse.data) {
    const customer = mapApiCustomerToShared(byUidResponse.data);
    return { customerId: customer.id, customer };
  }

  // 2. Fallback: search by email
  if (user.email) {
    const searchResponse = await apiRequest<any[]>(
      `/api/customers?search=${encodeURIComponent(user.email)}&limit=1`
    );

    if (searchResponse.data && searchResponse.data.length > 0) {
      const match = searchResponse.data[0];
      if (match.email?.toLowerCase() === user.email.toLowerCase()) {
        // Link this customer to the Supabase user
        await apiRequest(`/api/customers/${match.customer_id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            maroon_user_id: user.id,
            has_maroon_account: true,
          }),
        });
        const customer = mapApiCustomerToShared({ ...match, maroon_user_id: user.id });
        return { customerId: customer.id, customer };
      }
    }
  }

  // 3. No match — create a new customer
  const nameParts = (user.user_metadata?.full_name || user.email?.split('@')[0] || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const createResponse = await apiRequest<any>('/api/customers', {
    method: 'POST',
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email: user.email || '',
      phone: '',
      customer_type: 'retail',
      maroon_user_id: user.id,
      has_maroon_account: true,
      notes: 'Created from Maroon app',
    }),
  });

  if (createResponse.error || !createResponse.data) {
    console.error('Failed to create customer:', createResponse.error);
    return { customerId: null, customer: null };
  }

  const customer = mapApiCustomerToShared(createResponse.data);
  return { customerId: customer.id, customer };
};

/**
 * Create or link customer in Command Center database
 */
export const createOrLinkCustomer = async (
  profile: Partial<SharedCustomer>
): Promise<SharedCustomer | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Split name into first/last
  const nameParts = (profile.name || user.user_metadata?.full_name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const customerData = {
    first_name: firstName,
    last_name: lastName,
    email: profile.email || user.email,
    phone: profile.phone || '',
    customer_type: 'retail',
    maroon_user_id: user.id, // Critical: links to Supabase user
    notes: 'Created from Maroon app',
  };

  const response = await apiRequest<any>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });

  if (response.error) {
    // Customer might already exist, try to update link
    console.warn('Customer creation failed:', response.error);
    return null;
  }

  return mapApiCustomerToShared(response.data);
};

/**
 * Update customer profile in Command Center
 */
export const updateCustomerProfile = async (
  updates: Partial<SharedCustomer>
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get existing customer first
  const existing = await getMyCustomerProfile();
  if (!existing?.id) return false;

  const updateData: any = {};
  if (updates.name) {
    const nameParts = updates.name.trim().split(' ');
    updateData.first_name = nameParts[0] || '';
    updateData.last_name = nameParts.slice(1).join(' ') || '';
  }
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.email) updateData.email = updates.email;
  if (updates.kycStatus) updateData.kyc_status = updates.kycStatus;
  if (updates.cashBalance !== undefined) updateData.cash_balance = updates.cashBalance;

  const response = await apiRequest<any>(`/api/customers/${existing.id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });

  return !response.error;
};

// ============================================================================
// VAULT FUNCTIONS
// ============================================================================

/**
 * Get customer's vault holdings
 */
export const getVaultHoldings = async (): Promise<VaultHolding[]> => {
  const customer = await getMyCustomerProfile();
  if (!customer?.id) return [];

  const response = await apiRequest<any[]>(`/api/customer-vault?customer_id=${customer.id}`);

  if (response.error || !response.data) {
    return [];
  }

  return response.data.map(mapApiVaultToHolding);
};

/**
 * Request vault withdrawal (creates a task in Command Center)
 */
export const requestVaultWithdrawal = async (
  holdingId: string,
  weightOzt: number,
  notes?: string
): Promise<boolean> => {
  // This would typically call an API endpoint that creates a task
  // For now, we'll note this needs implementation
  console.log('Vault withdrawal request:', { holdingId, weightOzt, notes });
  return true;
};

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

/**
 * Get customer's orders
 */
export const getMyOrders = async (): Promise<SharedTransaction[]> => {
  const customer = await getMyCustomerProfile();
  if (!customer?.id) return [];

  const response = await apiRequest<any[]>(`/api/orders?customer_id=${customer.id}`);

  if (response.error || !response.data) {
    return [];
  }

  return response.data.map(mapApiOrderToTransaction);
};

/**
 * Get single order details
 */
export const getOrderDetails = async (orderId: string): Promise<SharedTransaction | null> => {
  const response = await apiRequest<any>(`/api/orders/${orderId}`);

  if (response.error || !response.data) {
    return null;
  }

  return mapApiOrderToTransaction(response.data);
};

// ============================================================================
// PRODUCT FUNCTIONS
// ============================================================================

/**
 * Get available products/inventory
 */
export const getProducts = async (
  category?: string,
  search?: string
): Promise<any[]> => {
  let endpoint = '/api/products?limit=50';
  if (category) endpoint += `&category=${encodeURIComponent(category)}`;
  if (search) endpoint += `&search=${encodeURIComponent(search)}`;

  const response = await apiRequest<any[]>(endpoint);

  if (response.error || !response.data) {
    return [];
  }

  return response.data;
};

/**
 * Get current inventory availability
 */
export const getInventoryAvailability = async (): Promise<any[]> => {
  const response = await apiRequest<any[]>('/api/inventory?available=true&limit=100');

  if (response.error || !response.data) {
    return [];
  }

  return response.data;
};

// ============================================================================
// HELPER MAPPERS
// ============================================================================

const mapApiCustomerToShared = (apiCustomer: any): SharedCustomer => ({
  id: apiCustomer.customer_id?.toString(),
  name: `${apiCustomer.first_name || ''} ${apiCustomer.last_name || ''}`.trim(),
  firstName: apiCustomer.first_name || '',
  lastName: apiCustomer.last_name || '',
  phone: apiCustomer.phone || '',
  email: apiCustomer.email || '',
  type: apiCustomer.customer_type?.toUpperCase() || 'RETAIL',
  kycStatus: apiCustomer.kyc_status || 'unverified',
  maroonUserId: apiCustomer.maroon_user_id,
  cashBalance: apiCustomer.cash_balance || 0,
  fundingBalance: apiCustomer.funding_balance || 0,
  pendingDeposits: apiCustomer.pending_deposits || 0,
  alAccountNumber: apiCustomer.al_account_number || undefined,
  lifetimeBuyTotal: apiCustomer.lifetime_value || 0,
  createdAt: apiCustomer.created_at,
  updatedAt: apiCustomer.updated_at,
});

const mapApiVaultToHolding = (apiVault: any): VaultHolding => ({
  id: apiVault.vault_id?.toString() || apiVault.id,
  customerId: apiVault.customer_id?.toString(),
  metal: apiVault.metal_type?.toLowerCase() || 'gold',
  weightOzt: apiVault.weight_ozt || 0,
  costBasis: apiVault.cost_basis,
  purchasePricePerOzt: apiVault.purchase_price_per_ozt,
  currentValue: apiVault.current_value,
  sourceOrderId: apiVault.source_order_id?.toString(),
  status: apiVault.status || 'held',
  depositedAt: apiVault.deposited_at || apiVault.created_at,
  updatedAt: apiVault.updated_at,
});

const mapApiOrderToTransaction = (apiOrder: any): SharedTransaction => ({
  id: apiOrder.order_id?.toString() || apiOrder.id,
  customerId: apiOrder.customer_id?.toString(),
  type: apiOrder.order_type === 'buy' ? 'buy' : 'sell',
  metal: apiOrder.metal_type,
  weightOzt: apiOrder.weight_ozt,
  pricePerOzt: apiOrder.price_per_ozt,
  amount: apiOrder.total_amount || 0,
  source: 'MAROON',
  status: apiOrder.status || 'pending',
  paymentMethod: apiOrder.payment_method,
  createdAt: apiOrder.created_at,
  updatedAt: apiOrder.updated_at,
});

// Status is now passed through directly as string

// ============================================================================
// EXPORT CHECK FOR HYBRID MODE
// ============================================================================

/**
 * Feature flag for using API vs Firebase
 * When true, data syncs to both Firebase AND the Command Center API
 */
export const USE_API_SYNC = import.meta.env.VITE_USE_API_SYNC === 'true';

/**
 * Sync customer data to API (call after Firebase operations)
 */
export const syncCustomerToApi = async (): Promise<void> => {
  if (!USE_API_SYNC) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Check if customer exists in API
    const existing = await getMyCustomerProfile();

    if (!existing) {
      // Create new customer in API
      await createOrLinkCustomer({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        phone: '',
      });
    }
  } catch (e) {
    console.warn('Failed to sync customer to API:', e);
  }
};
