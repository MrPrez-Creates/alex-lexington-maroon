/**
 * Alex Lexington Pricing Configuration
 *
 * Two pricing models based on fulfillment source:
 *
 * 1. FIZTRADE VAULT (stored items) - Fiztrade product price + our markup
 *    - Gold: 3.15% over Fiztrade price (slight discount for choosing storage)
 *    - Silver: 6.5% over Fiztrade price
 *
 * 2. OWN INVENTORY (physical delivery) - Spot price + our markup
 *    - Gold 1oz: 2.5% over spot
 *    - Gold larger bars: 2% over spot
 *    - Silver 0-10oz: 5% over spot
 *    - Silver kilo/100oz: 3% over spot
 *
 * Vault storage fees based on industry standards (profitable, not loss-leader).
 * Industry reference (2024-2025):
 * - Discount players: 0.29-0.49% annually
 * - Mid-tier: 0.50-0.70% annually
 * - Premium/full-service: 0.75-1.0% annually
 *
 * Alex Lexington targets mid-to-premium tier with full-service experience.
 */

// =============================================================================
// PRODUCT SOURCE TYPES
// =============================================================================

export type ProductSource = 'fiztrade' | 'inventory';
export type FulfillmentType = 'storage' | 'delivery' | 'ship_to_us';

// =============================================================================
// VAULT STORAGE FEES (Annual % of portfolio value)
// Premium pricing - this is a profit center, not a loss leader
// =============================================================================

export interface VaultStorageConfig {
  annualRate: number;           // Annual storage fee as % of value
  minimumAnnualFee: number;     // Minimum annual fee in USD
  minimumMonthlyFee: number;    // Minimum monthly fee in USD
  insuranceIncluded: boolean;   // Whether insurance is included
  auditIncluded: boolean;       // Whether annual audit is included
}

export const VAULT_STORAGE_FEES: Record<string, VaultStorageConfig> = {
  // Commingled storage (pooled, lower cost)
  commingled: {
    annualRate: 0.0050,         // 0.50% annually - competitive mid-tier
    minimumAnnualFee: 100,      // $100/year minimum
    minimumMonthlyFee: 10,      // $10/month minimum
    insuranceIncluded: true,
    auditIncluded: true,
  },
  // Segregated/Allocated storage (individual ownership, premium)
  segregated: {
    annualRate: 0.0075,         // 0.75% annually - premium tier
    minimumAnnualFee: 150,      // $150/year minimum
    minimumMonthlyFee: 15,      // $15/month minimum
    insuranceIncluded: true,
    auditIncluded: true,
  },
};

// =============================================================================
// FIZTRADE VAULT MARKUPS (% markup over Fiztrade product price)
// These are applied to Fiztrade's price, NOT spot
// =============================================================================

export interface FiztradeMarkupConfig {
  vaultMarkup: number;          // Markup over Fiztrade price for vault storage
  deliveryMarkup: number;       // Markup if customer wants delivery (higher)
}

export const FIZTRADE_MARKUPS: Record<string, FiztradeMarkupConfig> = {
  gold: {
    vaultMarkup: 0.0315,        // 3.15% over Fiztrade - vault discount
    deliveryMarkup: 0.035,      // 3.5% over Fiztrade - standard retail
  },
  silver: {
    vaultMarkup: 0.065,         // 6.5% over Fiztrade for vault
    deliveryMarkup: 0.10,       // 10% over Fiztrade for delivery
  },
  platinum: {
    vaultMarkup: 0.035,         // 3.5% over Fiztrade
    deliveryMarkup: 0.04,       // 4% over Fiztrade
  },
  palladium: {
    vaultMarkup: 0.035,         // 3.5% over Fiztrade
    deliveryMarkup: 0.04,       // 4% over Fiztrade
  },
};

// =============================================================================
// OWN INVENTORY MARKUPS (% markup over spot price)
// These are applied when selling from our own stock
// =============================================================================

export interface InventoryMarkupConfig {
  // Gold tiers (based on size)
  smallMarkup: number;          // 1oz products
  largeMarkup: number;          // Larger bars (10oz, kilo, etc.)
  smallThresholdOz: number;     // Weight threshold for small vs large
  // Silver tiers (based on size)
  silverSmallMarkup: number;    // 0-10oz products
  silverLargeMarkup: number;    // Kilo (32.15oz) and 100oz products
  silverLargeThresholdOz: number; // Weight threshold (anything >= this is large)
}

export const INVENTORY_MARKUPS: Record<string, InventoryMarkupConfig> = {
  gold: {
    smallMarkup: 0.025,         // 2.5% over spot for 1oz
    largeMarkup: 0.02,          // 2% over spot for larger products
    smallThresholdOz: 1,        // Products <= 1oz use small markup
    silverSmallMarkup: 0,       // N/A for gold
    silverLargeMarkup: 0,       // N/A for gold
    silverLargeThresholdOz: 0,  // N/A for gold
  },
  silver: {
    smallMarkup: 0.05,          // 5% over spot for 0-10oz
    largeMarkup: 0.03,          // 3% over spot for kilo/100oz
    smallThresholdOz: 10,       // Products <= 10oz use small markup
    silverSmallMarkup: 0.05,    // Same as smallMarkup
    silverLargeMarkup: 0.03,    // Same as largeMarkup
    silverLargeThresholdOz: 32, // Kilo (32.15oz) and up
  },
  platinum: {
    smallMarkup: 0.03,          // 3% over spot for 1oz
    largeMarkup: 0.025,         // 2.5% over spot for larger
    smallThresholdOz: 1,
    silverSmallMarkup: 0,
    silverLargeMarkup: 0,
    silverLargeThresholdOz: 0,
  },
  palladium: {
    smallMarkup: 0.03,          // 3% over spot for 1oz
    largeMarkup: 0.025,         // 2.5% over spot for larger
    smallThresholdOz: 1,
    silverSmallMarkup: 0,
    silverLargeMarkup: 0,
    silverLargeThresholdOz: 0,
  },
};

// =============================================================================
// SELL/BUYBACK RATES (% of spot price paid to customer)
// These are what Alex Lexington pays when customers SELL to us
// =============================================================================

export interface BuybackConfig {
  bullionRate: number;          // Rate for bullion (coins, bars)
  scrapRate: number;            // Rate for scrap/jewelry
  paymentSpeed: 'same-day' | 'next-day' | '2-3 days';
}

export const BUYBACK_RATES: Record<string, BuybackConfig> = {
  gold: {
    bullionRate: 0.95,          // 95% of spot for gold bullion
    scrapRate: 0.75,            // 75% of melt value for scrap
    paymentSpeed: 'same-day',
  },
  silver: {
    bullionRate: 0.90,          // 90% of spot for silver bullion
    scrapRate: 0.75,            // 75% of melt value for scrap
    paymentSpeed: 'next-day',
  },
  platinum: {
    bullionRate: 0.90,          // 90% of spot for platinum bullion
    scrapRate: 0.75,
    paymentSpeed: 'same-day',
  },
  palladium: {
    bullionRate: 0.90,          // 90% of spot for palladium bullion
    scrapRate: 0.75,
    paymentSpeed: 'same-day',
  },
};

// =============================================================================
// PRICE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate buy price from Fiztrade (for vault storage orders)
 * Price = Fiztrade product price + our markup
 *
 * @param fiztradePrice - The price from Fiztrade API
 * @param metal - Metal type (gold, silver, etc.)
 * @param fulfillmentType - 'storage' or 'delivery'
 */
export function calculateFiztradeBuyPrice(
  fiztradePrice: number,
  metal: string,
  fulfillmentType: FulfillmentType = 'storage'
): { pricePerOz: number; markupPercent: number; markupAmount: number } {
  const config = FIZTRADE_MARKUPS[metal.toLowerCase()] || FIZTRADE_MARKUPS.gold;

  const markupPercent = fulfillmentType === 'storage'
    ? config.vaultMarkup
    : config.deliveryMarkup; // 'delivery' and 'ship_to_us' use same markup

  const pricePerOz = fiztradePrice * (1 + markupPercent);
  const markupAmount = fiztradePrice * markupPercent;

  return { pricePerOz, markupPercent, markupAmount };
}

/**
 * Calculate buy price from own inventory (for delivery orders)
 * Price = Spot price + our markup (based on product size)
 *
 * @param spotPrice - Current spot price per oz
 * @param metal - Metal type (gold, silver, etc.)
 * @param weightOz - Weight of the product in troy ounces
 */
export function calculateInventoryBuyPrice(
  spotPrice: number,
  metal: string,
  weightOz: number = 1
): { pricePerOz: number; markupPercent: number; markupAmount: number } {
  const config = INVENTORY_MARKUPS[metal.toLowerCase()] || INVENTORY_MARKUPS.gold;

  let markupPercent: number;

  if (metal.toLowerCase() === 'silver') {
    // Silver has different thresholds
    markupPercent = weightOz >= config.silverLargeThresholdOz
      ? config.silverLargeMarkup  // 3% for kilo/100oz
      : config.smallMarkup;       // 5% for smaller
  } else {
    // Gold, platinum, palladium
    markupPercent = weightOz <= config.smallThresholdOz
      ? config.smallMarkup   // 2.5% for 1oz gold
      : config.largeMarkup;  // 2% for larger gold
  }

  const pricePerOz = spotPrice * (1 + markupPercent);
  const markupAmount = spotPrice * markupPercent;

  return { pricePerOz, markupPercent, markupAmount };
}

/**
 * Calculate the buy price - unified function for TradeModal
 * Uses Fiztrade pricing for vault storage, inventory pricing for delivery
 *
 * NOTE: For vault orders, we need Fiztrade price from the API.
 * If fiztradePrice is not provided, we estimate based on spot + typical Fiztrade premium.
 */
export function calculateBuyPrice(
  spotPrice: number,
  metal: string,
  orderAmount: number,
  storageType?: 'commingled' | 'segregated',
  options?: {
    fulfillmentType?: FulfillmentType;
    fiztradePrice?: number;
    productWeightOz?: number;
  }
): { pricePerOz: number; premiumPercent: number; premiumAmount: number; source: ProductSource } {
  const fulfillmentType = options?.fulfillmentType || (storageType ? 'storage' : 'delivery');
  const weightOz = options?.productWeightOz || 1;
  const isVault = fulfillmentType === 'storage';

  if (isVault) {
    // Vault storage - use Fiztrade pricing
    // If we don't have Fiztrade price, estimate it (Fiztrade is typically 1-3% over spot)
    const estimatedFiztradePremium = metal.toLowerCase() === 'silver' ? 0.03 : 0.015;
    const fiztradePrice = options?.fiztradePrice || (spotPrice * (1 + estimatedFiztradePremium));

    const result = calculateFiztradeBuyPrice(fiztradePrice, metal, 'storage');

    // Calculate total premium over spot for display
    const totalPremiumOverSpot = (result.pricePerOz - spotPrice) / spotPrice;

    return {
      pricePerOz: result.pricePerOz,
      premiumPercent: totalPremiumOverSpot,
      premiumAmount: result.pricePerOz - spotPrice,
      source: 'fiztrade',
    };
  } else {
    // Physical delivery - use inventory pricing
    const result = calculateInventoryBuyPrice(spotPrice, metal, weightOz);

    return {
      pricePerOz: result.pricePerOz,
      premiumPercent: result.markupPercent,
      premiumAmount: result.markupAmount,
      source: 'inventory',
    };
  }
}

/**
 * Calculate the sell/buyback price (what customer receives)
 */
export function calculateSellPrice(
  spotPrice: number,
  metal: string,
  isScrap: boolean = false
): { pricePerOz: number; buybackPercent: number; paymentSpeed: string } {
  const config = BUYBACK_RATES[metal.toLowerCase()] || BUYBACK_RATES.gold;

  const buybackPercent = isScrap ? config.scrapRate : config.bullionRate;
  const pricePerOz = spotPrice * buybackPercent;

  return {
    pricePerOz,
    buybackPercent,
    paymentSpeed: config.paymentSpeed,
  };
}

/**
 * Calculate annual vault storage fee
 */
export function calculateStorageFee(
  portfolioValue: number,
  storageType: 'commingled' | 'segregated' = 'segregated'
): { annualFee: number; monthlyFee: number; effectiveRate: number } {
  const config = VAULT_STORAGE_FEES[storageType];

  // Calculate fee based on portfolio value
  const calculatedAnnualFee = portfolioValue * config.annualRate;

  // Apply minimum fees
  const annualFee = Math.max(calculatedAnnualFee, config.minimumAnnualFee);
  const monthlyFee = Math.max(annualFee / 12, config.minimumMonthlyFee);

  // Calculate effective rate (may be higher than base rate for small portfolios)
  const effectiveRate = portfolioValue > 0 ? annualFee / portfolioValue : config.annualRate;

  return { annualFee, monthlyFee, effectiveRate };
}

// =============================================================================
// DISPLAY HELPER FUNCTIONS
// =============================================================================

/**
 * Format premium/discount for display
 */
export function formatPremiumDisplay(percent: number, isBuy: boolean): string {
  const absPercent = Math.abs(percent * 100);
  if (isBuy) {
    return `+${absPercent.toFixed(1)}% premium`;
  } else {
    return `${absPercent.toFixed(0)}% of spot`;
  }
}

/**
 * Get buyback rate display text
 */
export function getBuybackRateText(metal: string, isScrap: boolean = false): string {
  const config = BUYBACK_RATES[metal.toLowerCase()];
  if (!config) return '95% of spot';

  const rate = isScrap ? config.scrapRate : config.bullionRate;
  return `${(rate * 100).toFixed(0)}% of spot`;
}

/**
 * Get payment speed for a metal
 */
export function getPaymentSpeed(metal: string): string {
  const config = BUYBACK_RATES[metal.toLowerCase()];
  return config?.paymentSpeed || 'same-day';
}

/**
 * Get storage fee display text
 */
export function getStorageFeeText(storageType: 'commingled' | 'segregated'): string {
  const config = VAULT_STORAGE_FEES[storageType];
  const ratePercent = (config.annualRate * 100).toFixed(2);
  return `${ratePercent}% annually (min $${config.minimumAnnualFee}/yr)`;
}

/**
 * Get storage info for display
 */
export function getStorageInfo(storageType: 'commingled' | 'segregated'): {
  ratePercent: string;
  minimumAnnual: number;
  minimumMonthly: number;
  includesInsurance: boolean;
  includesAudit: boolean;
} {
  const config = VAULT_STORAGE_FEES[storageType];
  return {
    ratePercent: (config.annualRate * 100).toFixed(2) + '%',
    minimumAnnual: config.minimumAnnualFee,
    minimumMonthly: config.minimumMonthlyFee,
    includesInsurance: config.insuranceIncluded,
    includesAudit: config.auditIncluded,
  };
}

/**
 * Get pricing summary for display based on fulfillment type
 */
export function getPricingSummary(
  metal: string,
  fulfillmentType: FulfillmentType,
  weightOz: number = 1
): { description: string; markupPercent: string } {
  if (fulfillmentType === 'storage') {
    const config = FIZTRADE_MARKUPS[metal.toLowerCase()] || FIZTRADE_MARKUPS.gold;
    return {
      description: 'Fiztrade + markup (vault discount)',
      markupPercent: `${(config.vaultMarkup * 100).toFixed(2)}% over Fiztrade`,
    };
  } else if (fulfillmentType === 'ship_to_us') {
    const config = FIZTRADE_MARKUPS[metal.toLowerCase()] || FIZTRADE_MARKUPS.gold;
    return {
      description: 'Fiztrade + markup (ship to US)',
      markupPercent: `${(config.deliveryMarkup * 100).toFixed(2)}% over Fiztrade`,
    };
  } else {
    const result = calculateInventoryBuyPrice(1, metal, weightOz);
    return {
      description: 'Our inventory (spot + markup)',
      markupPercent: `${(result.markupPercent * 100).toFixed(1)}% over spot`,
    };
  }
}
