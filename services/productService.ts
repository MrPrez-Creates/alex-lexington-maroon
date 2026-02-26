/**
 * Product Service for Maroon Customer App
 * Fetches bullion product catalog from /api/bullion-products (146 products)
 * with fallback to static data when API is unavailable
 */

import { MetalType, AssetForm, WeightUnit, ProductTemplate } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

// Static fallback catalog (used when API is unavailable)
// Comprehensive precious metals database — NO base metal coins
const STATIC_PRODUCT_CATALOG: ProductTemplate[] = [
  // ═══════════════════════════════════════════════════
  // US GOLD COINS
  // ═══════════════════════════════════════════════════
  { name: 'American Gold Eagle (1 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'US Mint' },
  { name: 'American Gold Eagle (1/2 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.5, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'US Mint' },
  { name: 'American Gold Eagle (1/4 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.25, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'US Mint' },
  { name: 'American Gold Eagle (1/10 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'US Mint' },
  { name: 'American Gold Buffalo', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'US Mint' },
  { name: '$20 Liberty Gold Double Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.9675, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$20 Saint-Gaudens Gold Double Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.9675, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$10 Liberty Gold Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.48375, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$10 Indian Gold Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.48375, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$5 Liberty Gold Half Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.24187, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$5 Indian Gold Half Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.24187, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$2.50 Liberty Gold Quarter Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.12094, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$2.50 Indian Gold Quarter Eagle', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.12094, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: '$1 Gold Dollar (Type 1/2/3)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.04837, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'American Gold Eagle Proof', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'US Mint' },

  // ═══════════════════════════════════════════════════
  // WORLD GOLD COINS
  // ═══════════════════════════════════════════════════
  { name: 'Canadian Gold Maple Leaf (1 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Canadian Gold Maple Leaf (1/2 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.5, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Canadian Gold Maple Leaf (1/4 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.25, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Canadian Gold Maple Leaf (1/10 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'South African Krugerrand (1 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'Rand Refinery' },
  { name: 'South African Krugerrand (1/2 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.5, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'Rand Refinery' },
  { name: 'South African Krugerrand (1/4 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.25, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'Rand Refinery' },
  { name: 'South African Krugerrand (1/10 oz)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'Rand Refinery' },
  { name: 'Austrian Gold Philharmonic', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Austrian Mint' },
  { name: 'Australian Gold Kangaroo', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Perth Mint' },
  { name: 'British Gold Britannia', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Mint' },
  { name: 'Chinese Gold Panda (30g)', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 30, defaultUnit: WeightUnit.GRAMS, purity: '.999', mint: 'China Mint' },
  { name: 'Mexican Gold Libertad', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Casa de Moneda' },
  { name: 'Austrian Gold Ducat', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.1107, defaultUnit: WeightUnit.TROY_OZ, purity: '.986', mint: 'Austrian Mint' },
  { name: 'Austrian 4 Ducat Gold Coin', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.4430, defaultUnit: WeightUnit.TROY_OZ, purity: '.986', mint: 'Austrian Mint' },
  { name: 'Austrian 100 Corona Gold Coin', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.9802, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'Austrian Mint' },
  { name: 'Swiss Gold 20 Franc Helvetia', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.1867, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'Swiss Mint' },
  { name: 'French Gold 20 Franc Rooster', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.1867, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'Paris Mint' },
  { name: 'British Gold Sovereign', type: MetalType.GOLD, form: AssetForm.COIN, defaultWeight: 0.2354, defaultUnit: WeightUnit.TROY_OZ, purity: '.9167', mint: 'Royal Mint' },

  // ═══════════════════════════════════════════════════
  // US SILVER COINS (Precious metal content only)
  // ═══════════════════════════════════════════════════
  { name: 'American Silver Eagle (1 oz)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'US Mint' },
  { name: 'Morgan Silver Dollar', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.7734, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Peace Silver Dollar', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.7734, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Walking Liberty Half Dollar (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.3617, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Franklin Half Dollar (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.3617, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Kennedy Half Dollar (90%, Pre-1965)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.3617, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Kennedy Half Dollar (40%, 1965-1970)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.1479, defaultUnit: WeightUnit.TROY_OZ, purity: '.400', mint: 'US Mint' },
  { name: 'Washington Quarter (90%, Pre-1965)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.1808, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Roosevelt Dime (90%, Pre-1965)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.0723, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Mercury Dime (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.0723, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Barber Half Dollar (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.3617, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Barber Quarter (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.1808, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Barber Dime (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.0723, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'War Nickel (35% Silver, 1942-1945)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.0563, defaultUnit: WeightUnit.TROY_OZ, purity: '.350', mint: 'US Mint' },
  { name: 'Seated Liberty Half Dollar (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.3617, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Standing Liberty Quarter (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.1808, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },
  { name: 'Junk Silver $1 Face Value (90%)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 0.7234, defaultUnit: WeightUnit.TROY_OZ, purity: '.900', mint: 'US Mint' },

  // ═══════════════════════════════════════════════════
  // WORLD SILVER COINS
  // ═══════════════════════════════════════════════════
  { name: 'Canadian Silver Maple Leaf (1 oz)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Austrian Silver Philharmonic', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Austrian Mint' },
  { name: 'British Silver Britannia', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Royal Mint' },
  { name: 'Australian Silver Kookaburra', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Perth Mint' },
  { name: 'Australian Silver Kangaroo', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Perth Mint' },
  { name: 'Chinese Silver Panda (30g)', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 30, defaultUnit: WeightUnit.GRAMS, purity: '.999', mint: 'China Mint' },
  { name: 'Mexican Silver Libertad', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Casa de Moneda' },
  { name: 'South African Silver Krugerrand', type: MetalType.SILVER, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Rand Refinery' },

  // ═══════════════════════════════════════════════════
  // SILVER ROUNDS (Generic)
  // ═══════════════════════════════════════════════════
  { name: 'Generic Silver Round (1 oz)', type: MetalType.SILVER, form: AssetForm.ROUND, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Various' },
  { name: 'Generic Silver Round (5 oz)', type: MetalType.SILVER, form: AssetForm.ROUND, defaultWeight: 5, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Various' },

  // ═══════════════════════════════════════════════════
  // GOLD BARS
  // ═══════════════════════════════════════════════════
  { name: 'PAMP Suisse Gold Bar (1g)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.GRAMS, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'PAMP Suisse Gold Bar (5g)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 5, defaultUnit: WeightUnit.GRAMS, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'PAMP Suisse Gold Bar (10g)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.GRAMS, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'PAMP Suisse Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'PAMP Suisse Gold Bar (10 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'PAMP Suisse' },
  { name: 'Valcambi Gold CombiBar (50g)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 50, defaultUnit: WeightUnit.GRAMS, purity: '.9999', mint: 'Valcambi Suisse' },
  { name: 'Valcambi Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Valcambi Suisse' },
  { name: 'Royal Canadian Mint Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Perth Mint Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Perth Mint' },
  { name: 'Credit Suisse Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Credit Suisse' },
  { name: 'Johnson Matthey Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Johnson Matthey' },
  { name: 'Engelhard Gold Bar (1 oz)', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Engelhard' },
  { name: 'Gold Kilo Bar', type: MetalType.GOLD, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.KILOGRAMS, purity: '.9999', mint: 'Various' },

  // ═══════════════════════════════════════════════════
  // SILVER BARS
  // ═══════════════════════════════════════════════════
  { name: 'Sunshine Mint Silver Bar (1 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Sunshine Minting' },
  { name: 'Sunshine Mint Silver Bar (10 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Sunshine Minting' },
  { name: 'Royal Canadian Mint Silver Bar (10 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'Royal Canadian Mint Silver Bar (100 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 100, defaultUnit: WeightUnit.TROY_OZ, purity: '.9999', mint: 'Royal Canadian Mint' },
  { name: 'PAMP Suisse Silver Bar (10 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'PAMP Suisse' },
  { name: 'Johnson Matthey Silver Bar (1 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Johnson Matthey' },
  { name: 'Johnson Matthey Silver Bar (10 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Johnson Matthey' },
  { name: 'Johnson Matthey Silver Bar (100 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 100, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Johnson Matthey' },
  { name: 'Engelhard Silver Bar (1 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Engelhard' },
  { name: 'Engelhard Silver Bar (10 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Engelhard' },
  { name: 'Engelhard Silver Bar (100 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 100, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Engelhard' },
  { name: 'Silver Kilo Bar', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.KILOGRAMS, purity: '.999', mint: 'Various' },
  { name: 'Generic Silver Bar (1 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Various' },
  { name: 'Generic Silver Bar (5 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 5, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Various' },
  { name: 'Generic Silver Bar (10 oz)', type: MetalType.SILVER, form: AssetForm.BAR, defaultWeight: 10, defaultUnit: WeightUnit.TROY_OZ, purity: '.999', mint: 'Various' },

  // ═══════════════════════════════════════════════════
  // PLATINUM COINS & BARS
  // ═══════════════════════════════════════════════════
  { name: 'American Platinum Eagle (1 oz)', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'US Mint' },
  { name: 'American Platinum Eagle (1/2 oz)', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 0.5, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'US Mint' },
  { name: 'American Platinum Eagle (1/4 oz)', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 0.25, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'US Mint' },
  { name: 'American Platinum Eagle (1/10 oz)', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 0.1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'US Mint' },
  { name: 'Canadian Platinum Maple Leaf', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'Royal Canadian Mint' },
  { name: 'British Platinum Britannia', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'Royal Mint' },
  { name: 'Australian Platinum Koala', type: MetalType.PLATINUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'Perth Mint' },
  { name: 'PAMP Suisse Platinum Bar (1 oz)', type: MetalType.PLATINUM, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'PAMP Suisse' },
  { name: 'Valcambi Platinum Bar (1 oz)', type: MetalType.PLATINUM, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'Valcambi Suisse' },

  // ═══════════════════════════════════════════════════
  // PALLADIUM COINS & BARS
  // ═══════════════════════════════════════════════════
  { name: 'Canadian Palladium Maple Leaf', type: MetalType.PALLADIUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'Royal Canadian Mint' },
  { name: 'American Palladium Eagle', type: MetalType.PALLADIUM, form: AssetForm.COIN, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'US Mint' },
  { name: 'PAMP Suisse Palladium Bar (1 oz)', type: MetalType.PALLADIUM, form: AssetForm.BAR, defaultWeight: 1, defaultUnit: WeightUnit.TROY_OZ, purity: '.9995', mint: 'PAMP Suisse' },
];

// In-memory cache
let cachedProducts: ProductTemplate[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

/**
 * Map bullion_products API response to ProductTemplate format
 * Source: GET /api/bullion-products (146 products from bullion_products table)
 */
const mapBullionProductToTemplate = (product: any): ProductTemplate => {
  // Map metal_type string to MetalType enum
  let metalType = MetalType.GOLD;
  const metal = (product.metal_type || '').toLowerCase();
  if (metal === 'silver') metalType = MetalType.SILVER;
  else if (metal === 'platinum') metalType = MetalType.PLATINUM;
  else if (metal === 'palladium') metalType = MetalType.PALLADIUM;

  // Map product_type to AssetForm: 'coin' → Coin, 'bullion' → Bar
  const form = product.product_type === 'coin' ? AssetForm.COIN : AssetForm.BAR;

  // Format purity decimal (0.9167) to display string (".9167")
  let purityStr = '.9999';
  if (product.purity != null) {
    const raw = product.purity;
    if (raw === 1 || raw === 1.0) {
      purityStr = '1.000';
    } else {
      // Remove leading zero: 0.9167 → ".9167"
      purityStr = '.' + String(raw).replace(/^0\./, '');
    }
  }

  return {
    name: product.name,
    type: metalType,
    form: form,
    defaultWeight: product.weight_ozt || 1,
    defaultUnit: WeightUnit.TROY_OZ,
    purity: purityStr,
    mint: 'Various',
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
    const response = await fetch(`${API_BASE_URL}/api/bullion-products`);

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const result = await response.json();

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      cachedProducts = result.data.map(mapBullionProductToTemplate);
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

/**
 * Match AI-extracted scan data to a known product in the catalog.
 * Returns the best match with a confidence score (0-1).
 * Used after scanInvoice() to auto-correct weight/purity/mint values.
 */
export const matchToCatalog = (
  extractedName: string,
  extractedMetal?: string
): { product: ProductTemplate; confidence: number } | null => {
  const catalog = getProductCatalog();
  if (!extractedName || extractedName.length < 2) return null;

  const lowerName = extractedName.toLowerCase();
  const lowerMetal = (extractedMetal || '').toLowerCase();

  let bestMatch: ProductTemplate | null = null;
  let bestScore = 0;

  for (const product of catalog) {
    let score = 0;
    const prodName = product.name.toLowerCase();

    // Exact name match
    if (prodName === lowerName) {
      score = 1.0;
    } else if (prodName.includes(lowerName) || lowerName.includes(prodName)) {
      // One name contains the other
      score = 0.8;
    } else {
      // Token-based matching: how many words from the extracted name appear in the product name
      const extractedTokens = lowerName.split(/[\s\-\/\(\),]+/).filter(t => t.length > 1);
      const prodTokens = prodName.split(/[\s\-\/\(\),]+/).filter(t => t.length > 1);

      if (extractedTokens.length === 0) continue;

      let matchCount = 0;
      for (const token of extractedTokens) {
        if (prodTokens.some(pt => pt.includes(token) || token.includes(pt))) {
          matchCount++;
        }
      }

      score = matchCount / Math.max(extractedTokens.length, 2);
    }

    // Boost score if metal type matches
    if (lowerMetal && product.type.toLowerCase() === lowerMetal) {
      score += 0.1;
    } else if (lowerMetal && product.type.toLowerCase() !== lowerMetal) {
      score -= 0.3; // Penalize metal mismatch
    }

    // Cap at 1.0
    score = Math.min(score, 1.0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // Only return matches with reasonable confidence
  if (bestMatch && bestScore >= 0.4) {
    return { product: bestMatch, confidence: bestScore };
  }

  return null;
};

// Export static catalog for backwards compatibility
export const PRODUCT_CATALOG = STATIC_PRODUCT_CATALOG;
