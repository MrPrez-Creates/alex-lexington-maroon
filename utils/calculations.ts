
import { BullionItem, WeightUnit } from '../types';

/**
 * Parses a purity string into a decimal factor (0 to 1).
 */
export const parsePurity = (purity: string | undefined): number => {
  if (!purity) return 1;
  
  const lowerPurity = purity.toLowerCase().trim();

  // Handle Karats
  if (lowerPurity.includes('k')) {
    const karats = parseFloat(lowerPurity.replace(/[^0-9.]/g, ''));
    if (!isNaN(karats)) {
      return karats / 24;
    }
  }

  // Remove non-numeric characters except dot
  let cleanStr = lowerPurity.replace(/[^0-9.]/g, '');
  let value = parseFloat(cleanStr);

  if (isNaN(value)) return 1;

  if (purity.includes('%') || (value > 1 && value <= 100)) {
    return value / 100;
  }
  
  if (value > 1 && value <= 1000) {
      return value / 1000;
  }

  return value;
};

// Conversion rates to Troy Ounces
const CONVERSION_RATES: Record<string, number> = {
    [WeightUnit.TROY_OZ]: 1,
    [WeightUnit.GRAMS]: 0.0321507,
    [WeightUnit.KILOGRAMS]: 32.1507
};

/**
 * Converts any weight amount/unit pair to Troy Ounces
 */
export const getStandardWeight = (amount: number, unit: string): number => {
    const rate = CONVERSION_RATES[unit.toLowerCase()] || 1;
    return amount * rate;
};

/**
 * Calculates the total monetary value of an inventory item.
 * Formula: Spot Price * Unit Weight (oz) * Purity * Quantity
 */
export const calculateItemValue = (item: BullionItem, spotPrice: number): number => {
  const purity = parsePurity(item.purity);
  const weightOz = getStandardWeight(item.weightAmount, item.weightUnit);
  return spotPrice * weightOz * purity * item.quantity;
};

/**
 * Calculates the total PURE metal weight in troy ounces for an item.
 * Formula: Unit Weight (oz) * Purity * Quantity
 */
export const calculatePureWeight = (item: BullionItem): number => {
    const purity = parsePurity(item.purity);
    const weightOz = getStandardWeight(item.weightAmount, item.weightUnit);
    return weightOz * purity * item.quantity;
};