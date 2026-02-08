import { MetalType, AssetForm, WeightUnit, ProductTemplate } from './types';

// Re-export product catalog from Supabase service for backwards compatibility
// Components should migrate to using useProductCatalog hook from productService.ts
export { PRODUCT_CATALOG } from './services/productService';

// Initial Mock Data updated to new schema
export const INITIAL_INVENTORY = [
  {
    id: '1',
    metalType: MetalType.GOLD,
    form: AssetForm.COIN,
    weightAmount: 1,
    weightUnit: WeightUnit.TROY_OZ,
    quantity: 5,
    purchasePrice: 9750.00,
    acquiredAt: '2023-11-15',
    name: 'American Gold Eagle',
    purity: '.9167',
    mint: 'US Mint',
    notes: 'Bought during the dip.',
    sku: 'gold-eagle-1oz'
  },
  {
    id: '2',
    metalType: MetalType.SILVER,
    form: AssetForm.BAR,
    weightAmount: 10,
    weightUnit: WeightUnit.TROY_OZ,
    quantity: 1,
    purchasePrice: 245.00,
    acquiredAt: '2024-01-10',
    name: 'Sunshine Mint Bar',
    purity: '.999',
    mint: 'Sunshine Minting',
    notes: '',
    sku: 'silver-bar-sunshine-10oz'
  },
  {
    id: '3',
    metalType: MetalType.GOLD,
    form: AssetForm.BAR,
    weightAmount: 1,
    weightUnit: WeightUnit.GRAMS,
    quantity: 10,
    purchasePrice: 850.00,
    acquiredAt: '2023-08-22',
    name: 'PAMP Suisse Bar 1g',
    purity: '.9999',
    mint: 'PAMP Suisse',
    notes: 'Valcambi CombiBar style.',
    sku: 'gold-bar-pamp-1g'
  }
];

export const MOCK_SPOT_PRICES = {
  [MetalType.GOLD]: 4617.30,
  [MetalType.SILVER]: 88.36,
  [MetalType.PLATINUM]: 2370.00,
  [MetalType.PALLADIUM]: 1882.00
};

export const METAL_COLORS = {
  [MetalType.GOLD]: '#D4AF37',
  [MetalType.SILVER]: '#C0C0C0',
  [MetalType.PLATINUM]: '#E5E4E2',
  [MetalType.PALLADIUM]: '#CED0DD'
};

// PRODUCT_CATALOG is now exported from ./services/productService.ts
// which fetches from Supabase with static fallback
