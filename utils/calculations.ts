
import { BullionItem, WeightUnit } from '../types';

/**
 * Parses a purity string into a decimal factor (0 to 1).
 */
export const parsePurity = (purity: string | undefined): number => {
  if (!purity || purity.trim().length === 0) return 1;

  const lowerPurity = purity.toLowerCase().trim();

  // Handle Karats (cap at 24)
  if (lowerPurity.includes('k')) {
    const karats = parseFloat(lowerPurity.replace(/[^0-9.]/g, ''));
    if (!isNaN(karats) && karats > 0) {
      return Math.min(karats, 24) / 24;
    }
  }

  // Remove non-numeric characters except dot
  let cleanStr = lowerPurity.replace(/[^0-9.]/g, '');
  let value = parseFloat(cleanStr);

  if (isNaN(value)) return 1;

  let result: number;
  if (purity.includes('%') || (value > 1 && value <= 100)) {
    result = value / 100;
  } else if (value > 1 && value <= 1000) {
    result = value / 1000;
  } else {
    result = value;
  }

  // Clamp to valid range [0, 1]
  return Math.min(Math.max(result, 0), 1);
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