/**
 * Product Service for Maroon Customer App
 * Fetches product catalog from Supabase backend with fallback to static data
 */

import { MetalType, AssetForm, WeightUnit, ProductTemplate } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

// Static fallback catalog (used when API is unavailable)
const STATIC_PRODUCT_CATALOG: ProductTemplate[] = [
  // Gold Coins
  { name: 'American Gold Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'US Mint' },
  { name: 'American Gold Buffalo', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'US Mint' },
  { name: 'Canadian Gold Maple Leaf', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'South African Krugerrand', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'Rand Refinery' },
  { name: 'Austrian Gold Philharmonic', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Austrian Mint' },
  { name: 'Australian Gold Kangaroo', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Perth Mint' },

  // Silver Coins
  { name: 'American Silver Eagle', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'US Mint' },
  { name: 'Canadian Silver Maple Leaf', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Austrian Silver Philharmonic', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Austrian Mint' },
  { name: 'Morgan Silver Dollar', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.7734, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },

  // Bars (Gold)
  { name: 'PAMP Suisse Gold Bar', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'PAMP Suisse Gold Bar (1g)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.GRAMS, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'Valcambi Gold CombiBar', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 50, defaultUnit: WeightUnit.GRAMS, purity: '.9999', mint: 'Valcambi Suisse' },
  { name: 'Royal Canadian Mint Gold Bar', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },

  // Bars (Silver)
  { name: 'Sunshine Mint Silver Bar', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Sunshine Minting' },
  { name: 'Royal Canadian Mint Silver Bar', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Silver Kilo Bar', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.KILOGRAMS, purity: '.999', mint: 'Various' },

  // Platinum/Palladium
  { name: 'American Platinum Eagle', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'US Mint' },
  { name: 'Canadian Palladium Maple Leaf', type: MetalType.PALLADIUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'Royal Canadian Mint' },
];

// In-memory cache
let cachedProducts: ProductTemplate[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

/**
 * Map API product to ProductTemplate format
 */
const mapApiProductToTemplate = (apiProduct: any): ProductTemplate => {
  // Determine metal type from metal_id or metals.code
  let metalType = MetalType.GOLD;
  if (apiProduct.metals?.code) {
    const code = apiProduct.metals.code.toLowerCase();
    if (code === 'xag' || code === 'silver') metalType = MetalType.SILVER;
    if (code === 'xpt' || code === 'platinum') metalType = MetalType.PLATINUM;
    if (code === 'xpd' || code === 'palladium') metalType = MetalType.PALLADIUM;
  }

  // Determine form from category
  let form = AssetForm.COIN;
  const category = (apiProduct.category || '').toLowerCase();
  if (category.includes('bar')) form = AssetForm.BAR;
  if (category.includes('round')) form = AssetForm.ROUND;
  if (category.includes('jewelry') || category.includes('scrap')) form = AssetForm.JEWELRY;

  // Determine weight unit
  let defaultUnit = WeightUnit.TROY_OZ;
  let defaultWeight = apiProduct.weight_ozt || 1;

  if (apiProduct.weight_grams && (!apiProduct.weight_ozt || apiProduct.weight_grams < 31.1)) {
    defaultUnit = WeightUnit.GRAMS;
    defaultWeight = apiProduct.weight_grams;
  }

  return {
    name: apiProduct.name,
    type: metalType,
    form: form,
    defaultWeight: defaultWeight,
    defaultUnit: defaultUnit,
    purity: apiProduct.purity_display || (apiProduct.purity ? `.${Math.round(apiProduct.purity * 10000)}` : '.9999'),
    mint: apiProduct.description || 'Various',
  };
};

/**
 * Fetch products from Supabase API
 */
export const fetchProducts = async (): Promise<ProductTemplate[]> => {
  // Return cached data if fresh
  const now = Date.now();
  if (cachedProducts.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return cachedProducts;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/products?limit=100&is_active=true`);

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const result = await response.json();

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      cachedProducts = result.data.map(mapApiProductToTemplate);
      cacheTimestamp = now;
      return cachedProducts;
    }

    // API returned empty, use static fallback
    return STATIC_PRODUCT_CATALOG;
  } catch (error) {
    console.warn('Failed to fetch products from API, using static catalog:', error);
    return STATIC_PRODUCT_CATALOG;
  }
};

/**
 * Get product catalog (synchronous with cached data)
 * Use this for immediate access, falls back to static if no cache
 */
export const getProductCatalog = (): ProductTemplate[] => {
  return cachedProducts.length > 0 ? cachedProducts : STATIC_PRODUCT_CATALOG;
};

/**
 * Search products by name
 */
export const searchProducts = (query: string): ProductTemplate[] => {
  const catalog = getProductCatalog();
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  return catalog.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.mint?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * React hook for product catalog
 */
export const useProductCatalog = () => {
  const [products, setProducts] = useState<ProductTemplate[]>(STATIC_PRODUCT_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const fetched = await fetchProducts();
        if (mounted) {
          setProducts(fetched);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
          // Keep static catalog on error
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading, error, refresh: () => fetchProducts().then(setProducts) };
};

// Need to import useState and useEffect for the hook
import { useState, useEffect } from 'react';

// Export static catalog for backwards compatibility
export const PRODUCT_CATALOG = STATIC_PRODUCT_CATALOG;
