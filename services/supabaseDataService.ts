/**
 * Supabase Data Service for Maroon Customer App
 *
 * This service provides a unified data layer that:
 * 1. Fetches customer holdings/vault data from Supabase (primary source)
 * 2. Falls back to Firebase Firestore for user-specific data
 * 3. Syncs data between Firebase and Supabase where needed
 *
 * Migration Strategy:
 * - Customer holdings: Supabase (via web_orders + web_order_items)
 * - Customer profile: Supabase customers table (linked via maroon_user_id)
 * - User settings: Firebase users collection (auth-related)
 * - Price alerts: Firebase (user-specific, no business need in Command Center)
 * - Market history: Supabase metals table for current spot, Firebase for historical
 */

import { supabase } from '../lib/supabase';
import {
  getCustomerHoldingsByFirebaseUid,
  getCustomerVaultSummary,
  getFundingBalance,
  getFundingTransactions,
  VaultHolding as ApiVaultHolding,
  VaultSummary,
  FundingBalance,
  FundingTransaction
} from './apiClient';
import { getMyCustomerProfile } from './apiService';
import { BullionItem, MetalType, AssetForm, WeightUnit, SharedCustomer } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

// ============================================================================
// TYPES
// ============================================================================

export interface VaultSummaryData {
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  byMetal: {
    gold: { ozt: number; value: number; cost: number };
    silver: { ozt: number; value: number; cost: number };
    platinum: { ozt: number; value: number; cost: number };
    palladium: { ozt: number; value: number; cost: number };
  };
}

// ============================================================================
// CUSTOMER PROFILE
// ============================================================================

/**
 * Get the current user's customer profile from Supabase
 * Returns null if not found or not authenticated
 */
export const getCustomerProfile = async (): Promise<SharedCustomer | null> => {
  try {
    return await getMyCustomerProfile();
  } catch (error) {
    console.error('Failed to get customer profile:', error);
    return null;
  }
};

/**
 * Get customer ID for current user (needed for API calls)
 */
export const getCustomerId = async (): Promise<string | null> => {
  const profile = await getCustomerProfile();
  return profile?.id || null;
};

// ============================================================================
// VAULT HOLDINGS (Supabase Primary)
// ============================================================================

/**
 * Get customer's vault holdings from Supabase
 * These are items purchased through Alex Lexington and stored in vault
 */
export const getVaultHoldings = async (): Promise<BullionItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const response = await getCustomerHoldingsByFirebaseUid(user.id);

    if (!response.data?.holdings) {
      return [];
    }

    // Convert API holdings to BullionItem format
    return response.data.holdings.map(holding => mapApiHoldingToBullionItem(holding));
  } catch (error) {
    console.error('Failed to fetch vault holdings from Supabase:', error);
    return [];
  }
};

/**
 * Get vault summary (totals by metal)
 */
export const getVaultSummary = async (): Promise<VaultSummaryData | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const response = await getCustomerHoldingsByFirebaseUid(user.id);

    if (!response.data?.summary) {
      return null;
    }

    const summary = response.data.summary;

    return {
      totalValue: summary.total_value,
      totalCost: summary.total_cost,
      gainLoss: summary.total_gain_loss,
      gainLossPercent: summary.total_gain_loss_percent,
      byMetal: {
        gold: extractMetalSummary(summary.by_metal, 'XAU'),
        silver: extractMetalSummary(summary.by_metal, 'XAG'),
        platinum: extractMetalSummary(summary.by_metal, 'XPT'),
        palladium: extractMetalSummary(summary.by_metal, 'XPD'),
      }
    };
  } catch (error) {
    console.error('Failed to fetch vault summary:', error);
    return null;
  }
};

// ============================================================================
// FUNDING / CASH BALANCE
// ============================================================================

/**
 * Get customer's funding balance from Supabase
 */
export const getBalance = async (): Promise<FundingBalance | null> => {
  const customerId = await getCustomerId();
  if (!customerId) return null;

  try {
    const response = await getFundingBalance(customerId);
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch funding balance:', error);
    return null;
  }
};

/**
 * Get customer's funding transaction history
 */
export const getTransactionHistory = async (
  page = 1,
  limit = 20
): Promise<FundingTransaction[]> => {
  const customerId = await getCustomerId();
  if (!customerId) return [];

  try {
    const response = await getFundingTransactions(customerId, { page, limit });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return [];
  }
};

// ============================================================================
// CURRENT SPOT PRICES (from Metals table)
// ============================================================================

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  updatedAt: string;
}

/**
 * Get current spot prices from Supabase metals table
 */
export const getCurrentSpotPrices = async (): Promise<SpotPrices | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metals`);

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      return null;
    }

    const prices: SpotPrices = {
      gold: 0,
      silver: 0,
      platinum: 0,
      palladium: 0,
      updatedAt: new Date().toISOString(),
    };

    result.data.forEach((metal: any) => {
      const code = metal.code?.toLowerCase();
      const price = metal.current_spot_price || 0;

      if (code === 'xau') prices.gold = price;
      if (code === 'xag') prices.silver = price;
      if (code === 'xpt') prices.platinum = price;
      if (code === 'xpd') prices.palladium = price;

      if (metal.updated_at) {
        prices.updatedAt = metal.updated_at;
      }
    });

    return prices;
  } catch (error) {
    console.error('Failed to fetch spot prices from Supabase:', error);
    return null;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map API vault holding to BullionItem format
 */
const mapApiHoldingToBullionItem = (holding: ApiVaultHolding): BullionItem => {
  // Determine metal type
  let metalType = MetalType.GOLD;
  const metalCode = holding.metal_code?.toLowerCase() || '';
  if (metalCode === 'xag' || metalCode.includes('silver')) metalType = MetalType.SILVER;
  if (metalCode === 'xpt' || metalCode.includes('platinum')) metalType = MetalType.PLATINUM;
  if (metalCode === 'xpd' || metalCode.includes('palladium')) metalType = MetalType.PALLADIUM;

  // Determine form from description/name
  let form = AssetForm.COIN;
  const desc = (holding.description || holding.name || '').toLowerCase();
  if (desc.includes('bar')) form = AssetForm.BAR;
  if (desc.includes('round')) form = AssetForm.ROUND;

  return {
    id: holding.holding_id,
    metalType,
    form,
    weightAmount: holding.weight_ozt,
    weightUnit: WeightUnit.TROY_OZ,
    quantity: holding.quantity,
    purchasePrice: holding.cost_basis,
    acquiredAt: holding.purchased_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    name: holding.name || holding.description,
    purity: '.9999', // Default for bullion
    mint: `Alex Lexington Vault (${holding.status || 'Vaulted'})`,
    sku: holding.sku || undefined,
    notes: `Storage: ${holding.fulfillment_type || 'Vault'} | Order: ${holding.order_number} | Value: $${holding.current_value?.toFixed(2) || '0.00'}`,
    currentValue: holding.current_value,
  };
};

/**
 * Extract metal summary from API response
 */
const extractMetalSummary = (
  byMetal: VaultSummary['by_metal'],
  metalCode: string
): { ozt: number; value: number; cost: number } => {
  const metalData = byMetal.find(m => m.metal_code === metalCode);

  if (!metalData) {
    return { ozt: 0, value: 0, cost: 0 };
  }

  return {
    ozt: metalData.total_ozt,
    value: metalData.current_value,
    cost: metalData.total_cost,
  };
};

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for fetching vault holdings from Supabase
 */
export const useVaultHoldings = () => {
  const [holdings, setHoldings] = useState<BullionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVaultHoldings();
      setHoldings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault holdings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { holdings, loading, error, refresh };
};

/**
 * Hook for vault summary
 */
export const useVaultSummary = () => {
  const [summary, setSummary] = useState<VaultSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getVaultSummary();
        setSummary(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vault summary');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { summary, loading, error };
};

/**
 * Hook for funding balance
 */
export const useFundingBalance = () => {
  const [balance, setBalance] = useState<FundingBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBalance();
      setBalance(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, loading, error, refresh };
};

/**
 * Hook for current spot prices
 */
export const useSpotPrices = (pollInterval = 60000) => {
  const [prices, setPrices] = useState<SpotPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getCurrentSpotPrices();
      setPrices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (pollInterval > 0) {
      const interval = setInterval(refresh, pollInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, pollInterval]);

  return { prices, loading, error, refresh };
};
