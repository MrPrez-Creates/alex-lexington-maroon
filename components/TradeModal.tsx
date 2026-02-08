
import React, { useState, useEffect, useMemo } from 'react';
import { SpotPrices, MetalType, BullionItem, AssetForm, UserProfile, PaymentMethod, RecurringFrequency } from '../types';
import { getStandardWeight, calculateItemValue } from '../utils/calculations';
// Payment methods managed locally (mock)
const addPaymentMethod = async (_method: PaymentMethod) => { /* no-op */ };
import {
  calculateBuyPrice,
  calculateSellPrice,
  calculateStorageFee,
  formatPremiumDisplay,
  getBuybackRateText,
  getPaymentSpeed,
  getStorageInfo,
  getPricingSummary,
  FulfillmentType
} from '../utils/pricing';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction: 'buy' | 'sell';
  initialMetal: string;
  prices: SpotPrices;
  inventory: BullionItem[];
  userProfile: UserProfile | null;
  onTrade: (
      action: 'buy' | 'sell', 
      metal: string, 
      amount: number, // USD amount
      units: 'usd' | 'oz', 
      price: number, 
      inventoryItemId?: string,
      storageType?: 'commingled' | 'segregated',
      payoutMethod?: 'balance' | 'wire' | 'ach' | 'check' | string,
      isRecurring?: boolean,
      frequency?: RecurringFrequency,
      fulfillmentType?: 'storage' | 'delivery',
      deliveryMethod?: 'shipping' | 'pickup',
      bulkItems?: { id: string; qty: number; value: number; name: string; weightOz: number }[]
  ) => void;
  onRedirectToAdd: () => void;
  kycStatus?: string; 
}

const WEIGHT_CHIPS = [
    { label: '1/10 oz', val: 0.10 },
    { label: '1/4 oz', val: 0.25 },
    { label: '1/2 oz', val: 0.50 },
    { label: '3/4 oz', val: 0.75 },
    { label: '1 oz', val: 1.0 },
    { label: '100 g', val: 3.215 },
    { label: '10 oz', val: 10.0 },
    { label: '1 kg', val: 32.15 },
    { label: '100 oz', val: 100.0 },
    { label: 'Monster Box', val: 500.0 },
];

const STORAGE_POLICY_TEXT = `SECTION [X] - PRECIOUS METALS STORAGE PROGRAM... (Full text omitted for brevity)`; 

type Step = 'input' | 'review' | 'success';

// Management Flag: Disable Commingled Storage temporarily
const DISABLE_COMMINGLED = true;

// Helper Interface for Sell Calculation
interface SellItem extends BullionItem {
    sellQty: number;
    unitWeightOz: number;
    unitValue: number;
    totalSellValue: number;
}

const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, initialAction, initialMetal, prices, inventory, userProfile, onTrade, onRedirectToAdd }) => {
  const [action, setAction] = useState<'buy' | 'sell'>(initialAction);
  const [step, setStep] = useState<Step>('input');
  const [metal, setMetal] = useState(initialMetal);
  
  // Buy State
  const [buyAmountStr, setBuyAmountStr] = useState('');
  const [buyWeightStr, setBuyWeightStr] = useState('');
  
  // Fulfillment & Storage State
  const [fulfillmentType, setFulfillmentType] = useState<'storage' | 'delivery'>('storage');
  const [storageType, setStorageType] = useState<'commingled' | 'segregated'>('commingled');
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [selectedBuyMethod, setSelectedBuyMethod] = useState<PaymentMethod | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // Sell State - Multi Select
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [payoutMethod, setPayoutMethod] = useState<string>('balance');
  
  // Active Metal Tab for Sell UI
  const [activeSellTab, setActiveSellTab] = useState(initialMetal);

  const paymentMethods = userProfile?.paymentMethods || [];

  useEffect(() => {
    if (isOpen) {
        setStep('input');
        setAction(initialAction);
        setMetal(initialMetal);
        setActiveSellTab(initialMetal);
        setBuyAmountStr('');
        setBuyWeightStr('');
        setSelectedItems({});
        setFulfillmentType('storage');
        // Default to segregated if commingled is disabled
        setStorageType(DISABLE_COMMINGLED ? 'segregated' : 'commingled');
        setDeliveryMethod('shipping');
        setPolicyAccepted(false);
        setIsRecurring(false);
        setFrequency('monthly');
    }
  }, [isOpen, initialAction, initialMetal]);

  // Enforce Storage Rules for Platinum/Palladium
  useEffect(() => {
      if ((metal === MetalType.PLATINUM || metal === MetalType.PALLADIUM) && fulfillmentType === 'storage') {
          setStorageType('segregated');
      }
  }, [metal, fulfillmentType]);

  // Filter available chips based on metal type
  const availableChips = useMemo(() => {
      if (metal === MetalType.PLATINUM || metal === MetalType.PALLADIUM) {
          return WEIGHT_CHIPS.filter(chip => chip.val === 1.0);
      }
      return WEIGHT_CHIPS;
  }, [metal]);

  if (!isOpen) return null;

  const spot = prices[metal] || 0;

  // Calculate buy price with premium
  // Uses Fiztrade pricing for vault storage, inventory pricing for delivery
  const buyPricing = useMemo(() => {
    const estimatedAmount = parseFloat(buyAmountStr) || 0;
    const weightOz = parseFloat(buyWeightStr) || 1;
    return calculateBuyPrice(spot, metal, estimatedAmount, storageType, {
      fulfillmentType: fulfillmentType as FulfillmentType,
      productWeightOz: weightOz,
    });
  }, [spot, metal, buyAmountStr, buyWeightStr, storageType, fulfillmentType]);

  // Calculate sell price with buyback rate
  const sellPricing = useMemo(() => {
    return calculateSellPrice(spot, metal, false); // false = bullion, not scrap
  }, [spot, metal]);

  // Buy Calculations - now using premium price
  const buyAmountVal = parseFloat(buyAmountStr) || 0;
  const currentWeightVal = parseFloat(buyWeightStr) || 0;
  const buyPricePerOz = buyPricing.pricePerOz;

  // Sell Calculations - now using buyback rate
  const sellPricePerOz = sellPricing.pricePerOz;
  const filteredInventory = inventory.filter(item => item.metalType === activeSellTab);

  const selectedSellItemsList = Object.entries(selectedItems).map(([id, qty]) => {
      const item = inventory.find(i => i.id === id);
      if (!item) return null;
      const weight = getStandardWeight(item.weightAmount, item.weightUnit);
      const itemSpot = prices[item.metalType] || 0;
      // Use buyback rate for sell value
      const sellRate = calculateSellPrice(itemSpot, item.metalType, false);
      const unitWeightOz = weight / item.quantity;
      const unitVal = unitWeightOz * sellRate.pricePerOz;
      return {
          ...item,
          sellQty: qty,
          unitWeightOz,
          unitValue: unitVal,
          totalSellValue: unitVal * qty
      } as SellItem;
  }).filter((item): item is SellItem => item !== null);

  const totalSellValue = selectedSellItemsList.reduce((acc: number, item) => acc + item.totalSellValue, 0);
  const totalSellWeight = selectedSellItemsList.reduce((acc: number, item) => acc + (item.unitWeightOz * item.sellQty), 0);

  // Toggle Item Selection
  const toggleItemSelection = (item: BullionItem) => {
      setSelectedItems(prev => {
          const newState = { ...prev };
          if (newState[item.id]) {
              delete newState[item.id];
          } else {
              newState[item.id] = 1; // Default select 1
          }
          return newState;
      });
  };

  const updateItemQty = (id: string, delta: number, max: number) => {
      setSelectedItems(prev => {
          const current = prev[id] || 0;
          const next = Math.min(Math.max(1, current + delta), max);
          return { ...prev, [id]: next };
      });
  };

  const handleWeightChange = (val: string) => {
      setBuyWeightStr(val);
      const weight = parseFloat(val);
      if (!isNaN(weight) && buyPricePerOz > 0) {
          // Use premium price for cost calculation
          setBuyAmountStr((weight * buyPricePerOz).toFixed(2));
      } else if (val === '') {
          setBuyAmountStr('');
      }
  };

  const handleUSDChange = (val: string) => {
      setBuyAmountStr(val);
      const usd = parseFloat(val);
      if (!isNaN(usd) && buyPricePerOz > 0) {
          // Use premium price for weight calculation
          setBuyWeightStr((usd / buyPricePerOz).toFixed(4));
      } else if (val === '') {
          setBuyWeightStr('');
      }
  };

  const handleBuyChipClick = (oz: number) => {
      handleWeightChange(oz.toString());
  };

  // Generate a reference number for the order (regenerates when step changes)
  const orderRef = useMemo(() => {
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `AL-${ts}-${rand}`;
  }, [step]);

  const handleConfirm = () => {
      if (action === 'buy') {
          // Pass the premium price per oz, not spot
          onTrade(
              'buy',
              metal,
              buyAmountVal,
              'usd',
              buyPricePerOz, // Premium price (spot + markup)
              undefined,
              fulfillmentType === 'storage' ? storageType : undefined,
              undefined,
              isRecurring,
              frequency,
              fulfillmentType,
              deliveryMethod
          );
      } else {
          // Bulk Sell Payload - values already calculated with buyback rate
          const bulkPayload = selectedSellItemsList.map(item => ({
              id: item.id,
              qty: item.sellQty,
              value: item.totalSellValue, // Already uses buyback rate
              name: item.name,
              weightOz: item.unitWeightOz * item.sellQty
          }));

          if (bulkPayload.length > 0) {
              // Pass the buyback price per oz
              const firstItemSpot = prices[selectedSellItemsList[0].metalType] || 0;
              const sellRate = calculateSellPrice(firstItemSpot, selectedSellItemsList[0].metalType, false);
              onTrade('sell', selectedSellItemsList[0].metalType, totalSellValue, 'usd', sellRate.pricePerOz, undefined, undefined, payoutMethod, undefined, undefined, undefined, undefined, bulkPayload);
          }
      }
      // Show success step instead of closing immediately
      setStep('success');
  };

  const getTitle = () => {
      if (step === 'success') return 'Order Submitted';
      if (step === 'review') return 'Review Transaction';
      return action === 'buy' ? 'Execute Trade' : 'Sell Assets';
  };

  const isRestrictedStorage = metal === MetalType.PLATINUM || metal === MetalType.PALLADIUM;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/90 backdrop-blur-md animate-fade-in p-4">
        <div className="w-full max-w-lg bg-navy-800 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-white/5 bg-navy-900/50">
                <button onClick={onClose} className="absolute top-4 right-6 text-gray-400 hover:text-white z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                {step === 'input' && (
                    <div className="flex justify-center gap-6 mb-4">
                        <button 
                            onClick={() => setAction('buy')}
                            className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${action === 'buy' ? 'text-green-500 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            Buy
                        </button>
                        <button 
                            onClick={() => setAction('sell')}
                            className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${action === 'sell' ? 'text-red-500 border-red-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            Sell
                        </button>
                    </div>
                )}
                
                <div className="text-center">
                    <h2 className="text-xl font-serif text-white">{getTitle()}</h2>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* --- INPUT STEP --- */}
                {step === 'input' && (
                    <>
                        {action === 'buy' ? (
                            <>
                                {/* Asset Selector (Buy Mode Only) */}
                                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gold-500 font-bold mb-2">Asset</label>
                                        <select 
                                            value={metal}
                                            onChange={(e) => { 
                                                setMetal(e.target.value); 
                                                setBuyAmountStr(''); 
                                                setBuyWeightStr('');
                                            }}
                                            className="bg-transparent text-2xl font-serif text-white font-medium focus:outline-none cursor-pointer capitalize appearance-none pr-8"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            {Object.values(MetalType).map(m => (
                                                <option key={m} value={m} className="bg-navy-900">{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Your Price</div>
                                        <div className="text-lg font-mono text-white">${buyPricePerOz.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                        <div className="text-[9px] text-gold-500 font-mono">
                                            Spot ${spot.toLocaleString()} {formatPremiumDisplay(buyPricing.premiumPercent, true)}
                                        </div>
                                        <div className="text-[8px] text-gray-500 mt-0.5">
                                            {buyPricing.source === 'fiztrade' ? 'Via Fiztrade (Vault)' : 'From Inventory'}
                                        </div>
                                    </div>
                                </div>

                                {/* Buy Input - Dual Fields */}
                                <div className="grid grid-cols-2 gap-4 items-start">
                                    <div className="bg-navy-900/50 p-3 rounded-xl border border-white/10 focus-within:border-gold-500/50 transition-colors">
                                        <label className="block text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Weight (oz)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={buyWeightStr}
                                                onChange={(e) => handleWeightChange(e.target.value)}
                                                className="w-full bg-transparent text-xl font-serif text-white focus:outline-none placeholder-gray-700"
                                                placeholder="0.0000"
                                            />
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">oz</span>
                                        </div>
                                    </div>

                                    <div className="bg-navy-900/50 p-3 rounded-xl border border-white/10 focus-within:border-gold-500/50 transition-colors">
                                        <label className="block text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Cost (USD)</label>
                                        <div className="relative">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg text-gold-500 font-serif">$</span>
                                            <input 
                                                type="number" 
                                                value={buyAmountStr}
                                                onChange={(e) => handleUSDChange(e.target.value)}
                                                className="w-full bg-transparent text-xl font-serif text-white pl-4 focus:outline-none placeholder-gray-700"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Allocation */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Quick Select</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {availableChips.map((chip) => (
                                            <button
                                                key={chip.label}
                                                onClick={() => handleBuyChipClick(chip.val)}
                                                className="py-3 bg-navy-900 border border-white/10 hover:border-gold-500 hover:text-gold-500 text-gray-300 rounded-lg text-xs font-bold transition-all active:scale-95"
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Sell Input - Multi-Select UI */}
                                <div className="space-y-4">
                                    {/* Tabs */}
                                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                                        {Object.values(MetalType).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setActiveSellTab(m)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                                    activeSellTab === m 
                                                    ? 'bg-gold-500 text-navy-900 shadow-md' 
                                                    : 'bg-navy-900 text-gray-400 border border-white/10 hover:border-gold-500/50'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Select Item from Vault</span>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gold-500 font-mono">
                                                We Pay: {getBuybackRateText(activeSellTab)}
                                            </span>
                                            <span className="text-[9px] text-gray-500 ml-2">
                                                ({getPaymentSpeed(activeSellTab)} payout)
                                            </span>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                                        {filteredInventory.length > 0 ? filteredInventory.map(item => {
                                            const isSelected = !!selectedItems[item.id];
                                            const selectedQty = selectedItems[item.id] || 0;
                                            const weight = getStandardWeight(item.weightAmount, item.weightUnit);
                                            // Calculate sell value using buyback rate
                                            const itemSpot = prices[item.metalType] || 0;
                                            const sellRate = calculateSellPrice(itemSpot, item.metalType, false);
                                            const unitWeightOz = weight / item.quantity;
                                            const unitValue = unitWeightOz * sellRate.pricePerOz;

                                            return (
                                                <div 
                                                    key={item.id}
                                                    className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                                                        isSelected 
                                                        ? 'bg-navy-700/50 border-gold-500 shadow-lg shadow-gold-500/10' 
                                                        : 'bg-navy-900 border-white/5 hover:bg-navy-800 cursor-pointer'
                                                    }`}
                                                    onClick={() => !isSelected && toggleItemSelection(item)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{item.name}</div>
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                {(weight / item.quantity).toFixed(4)} oz each • {item.quantity} available
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-gold-500 font-mono text-sm font-bold">${unitValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                                            <div className="text-[9px] text-gray-500">Quote / unit</div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10 animate-fade-in">
                                                            <span className="text-xs text-gray-300 font-bold">Quantity to Sell:</span>
                                                            <div className="flex items-center bg-navy-900 rounded-lg border border-white/20 overflow-hidden">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (selectedQty === 1) toggleItemSelection(item); // Deselect if 0
                                                                        else updateItemQty(item.id, -1, item.quantity);
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white"
                                                                >
                                                                    -
                                                                </button>
                                                                <div className="w-10 h-8 flex items-center justify-center text-white font-mono text-sm border-l border-r border-white/10 bg-navy-800">
                                                                    {selectedQty}
                                                                </div>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateItemQty(item.id, 1, item.quantity);
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }) : (
                                            <div className="text-center py-8 bg-navy-900/50 rounded-xl border border-dashed border-gray-700">
                                                <p className="text-gray-500 text-xs mb-2">No {activeSellTab} assets available.</p>
                                                <button onClick={onRedirectToAdd} className="text-gold-500 text-xs font-bold hover:underline">Don't see your item? Add it first.</button>
                                            </div>
                                        )}
                                    </div>
                                    {filteredInventory.length > 0 && (
                                        <div className="text-center mt-2">
                                            <button onClick={onRedirectToAdd} className="text-[10px] text-gray-500 hover:text-gold-500 transition-colors">
                                                Don't see your item? Add it first.
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* --- REVIEW STEP --- */}
                {step === 'review' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-navy-900 p-6 rounded-xl border border-white/5 text-center">
                            <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">
                                {action === 'buy' ? 'You Are Buying' : 'You Are Selling'}
                            </div>
                            
                            {action === 'buy' ? (
                                <>
                                    <div className="text-3xl font-serif text-white mb-1">
                                        {currentWeightVal.toFixed(4)} OZ
                                    </div>
                                    <div className="text-gold-500 font-bold capitalize mb-4">
                                        {metal} {fulfillmentType === 'storage' && '(Allocated)'}
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <span className="text-gray-400 text-xs">Total Value</span>
                                        <span className="text-white font-mono font-bold text-lg">${buyAmountVal.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Bulk Sell Summary */}
                                    <div className="text-3xl font-serif text-white mb-1">
                                        {totalSellWeight.toFixed(4)} OZ
                                    </div>
                                    <div className="text-gold-500 font-bold capitalize mb-4">
                                        Mixed Assets ({selectedSellItemsList.length} items)
                                    </div>
                                    
                                    <div className="bg-navy-950/50 rounded-lg p-2 max-h-32 overflow-y-auto mb-4 text-left border border-white/5">
                                        {selectedSellItemsList.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-[10px] text-gray-400 py-1 border-b border-white/5 last:border-0">
                                                <span>{item.sellQty}x {item.name}</span>
                                                <span className="font-mono text-white">${item.totalSellValue.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center border-t border-white/10 pt-4">
                                        <span className="text-gray-400 text-xs">Total Payout</span>
                                        <span className="text-green-500 font-mono font-bold text-lg">${totalSellValue.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {action === 'buy' && (
                            <div className="bg-navy-900/50 p-4 rounded-xl border border-white/5 space-y-4">
                                
                                {/* 1. Fulfillment Toggle */}
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Fulfillment Method</span>
                                    <div className="flex bg-navy-800 rounded-lg p-1">
                                        <button 
                                            onClick={() => setFulfillmentType('storage')}
                                            className={`flex-1 py-2 rounded text-[10px] font-bold transition-colors ${fulfillmentType === 'storage' ? 'bg-gold-500 text-navy-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Secure Vault
                                        </button>
                                        <button 
                                            onClick={() => setFulfillmentType('delivery')}
                                            className={`flex-1 py-2 rounded text-[10px] font-bold transition-colors ${fulfillmentType === 'delivery' ? 'bg-gold-500 text-navy-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Physical Delivery
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Sub-Options based on Fulfillment */}
                                {fulfillmentType === 'storage' ? (
                                    <div className="animate-fade-in">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Storage Type</span>
                                            <div className="flex bg-navy-800 rounded-lg p-1">
                                                <button
                                                    onClick={() => !isRestrictedStorage && !DISABLE_COMMINGLED && setStorageType('commingled')}
                                                    disabled={isRestrictedStorage || DISABLE_COMMINGLED}
                                                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                                                        storageType === 'commingled'
                                                        ? 'bg-white/20 text-white'
                                                        : (isRestrictedStorage || DISABLE_COMMINGLED) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    Commingled
                                                </button>
                                                <button
                                                    onClick={() => setStorageType('segregated')}
                                                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${storageType === 'segregated' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    Segregated
                                                </button>
                                            </div>
                                        </div>
                                        {isRestrictedStorage && (
                                            <p className="text-[9px] text-yellow-500/80 mb-2 -mt-2">
                                                * {metal.charAt(0).toUpperCase() + metal.slice(1)} requires segregated storage.
                                            </p>
                                        )}

                                        {/* Storage Fee Display */}
                                        {(() => {
                                            const storageInfo = getStorageInfo(storageType);
                                            const storageFee = calculateStorageFee(buyAmountVal, storageType);
                                            return (
                                                <div className="bg-navy-800 p-3 rounded-lg border border-white/5 mb-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] text-gray-400 uppercase">Annual Storage Fee</span>
                                                        <span className="text-gold-500 font-mono text-sm font-bold">
                                                            {storageInfo.ratePercent}/yr
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-500">Estimated annual cost:</span>
                                                        <span className="text-white font-mono">
                                                            ${storageFee.annualFee.toFixed(2)}/yr (${storageFee.monthlyFee.toFixed(2)}/mo)
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-3 mt-2 pt-2 border-t border-white/5">
                                                        <span className="text-[9px] text-green-500/80">
                                                            {storageInfo.includesInsurance ? '✓ Insurance included' : ''}
                                                        </span>
                                                        <span className="text-[9px] text-green-500/80">
                                                            {storageInfo.includesAudit ? '✓ Annual audit' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex items-start gap-3 mt-2 pt-2 border-t border-white/5">
                                            <input
                                                type="checkbox"
                                                id="policy"
                                                checked={policyAccepted}
                                                onChange={(e) => setPolicyAccepted(e.target.checked)}
                                                className="mt-0.5 accent-gold-500"
                                            />
                                            <label htmlFor="policy" className="text-[10px] text-gray-400 leading-tight">
                                                I accept the <button onClick={() => setShowPolicy(true)} className="text-gold-500 underline">Storage Agreement</button>.
                                                Assets will be stored in the Alex Lexington vault.
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in space-y-4">
                                        <div>
                                            <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Delivery Preference</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => setDeliveryMethod('shipping')}
                                                    className={`p-3 rounded-xl border text-left transition-all ${deliveryMethod === 'shipping' ? 'bg-navy-700 border-gold-500' : 'bg-navy-800 border-white/5 hover:bg-navy-700'}`}
                                                >
                                                    <div className="font-bold text-white text-xs mb-1">Shipping</div>
                                                    <div className="text-[9px] text-gray-400">Insured Delivery</div>
                                                </button>
                                                <button 
                                                    onClick={() => setDeliveryMethod('pickup')}
                                                    className={`p-3 rounded-xl border text-left transition-all ${deliveryMethod === 'pickup' ? 'bg-navy-700 border-gold-500' : 'bg-navy-800 border-white/5 hover:bg-navy-700'}`}
                                                >
                                                    <div className="font-bold text-white text-xs mb-1">Store Pickup</div>
                                                    <div className="text-[9px] text-gray-400">Atlanta, GA</div>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {deliveryMethod === 'shipping' && (
                                            <div className="p-3 bg-navy-800 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] text-gray-400 block mb-1">Shipping to</span>
                                                        <span className="text-xs text-white font-bold block">{userProfile?.billingAddress?.street || 'No Address Set'}</span>
                                                        <span className="text-xs text-gray-400">{userProfile?.billingAddress?.city} {userProfile?.billingAddress?.state}</span>
                                                    </div>
                                                    <button className="text-[10px] text-gold-500 font-bold hover:text-white">Edit</button>
                                                </div>
                                            </div>
                                        )}
                                        {deliveryMethod === 'pickup' && (
                                            <div className="p-3 bg-navy-800 rounded-xl border border-white/5">
                                                <span className="text-[10px] text-gray-400 block mb-1">Pickup Location</span>
                                                <span className="text-xs text-white font-bold block">Alex Lexington</span>
                                                <span className="text-xs text-gray-400">3337 Buford Hwy NE, Atlanta, GA</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {action === 'sell' && (
                            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                                <div className="text-xs text-blue-300 font-bold mb-1">Status: Processing Order</div>
                                <p className="text-[10px] text-gray-400">
                                    Your price is now locked. We are processing the liquidation from your allocated storage.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- SUCCESS STEP --- */}
                {step === 'success' && (
                    <div className="space-y-6 animate-fade-in text-center">
                        {/* Success Icon */}
                        <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center animate-scale-in">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-serif text-white mb-2">
                                {action === 'buy' ? 'Purchase Order Submitted' : 'Sell Order Submitted'}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Your order has been received and is being processed by our team.
                            </p>
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-navy-900 p-5 rounded-xl border border-white/10 text-left space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Reference</span>
                                <span className="text-xs font-mono text-gold-500 font-bold">{orderRef}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Type</span>
                                <span className={`text-xs font-bold uppercase ${action === 'buy' ? 'text-green-500' : 'text-red-400'}`}>
                                    {action === 'buy' ? 'Buy Order' : 'Sell Order'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Asset</span>
                                <span className="text-xs text-white font-bold capitalize">{metal}</span>
                            </div>

                            {action === 'buy' ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Weight</span>
                                        <span className="text-xs text-white font-mono">{currentWeightVal.toFixed(4)} oz</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Price Per Oz</span>
                                        <span className="text-xs text-white font-mono">${buyPricePerOz.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                        <span className="text-xs text-gray-400 font-bold">Total</span>
                                        <span className="text-lg text-white font-mono font-bold">${buyAmountVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    {fulfillmentType === 'storage' && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Storage</span>
                                            <span className="text-xs text-gold-500 capitalize">{storageType} Vault</span>
                                        </div>
                                    )}
                                    {fulfillmentType === 'delivery' && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Delivery</span>
                                            <span className="text-xs text-gold-500 capitalize">{deliveryMethod === 'shipping' ? 'Insured Shipping' : 'Store Pickup'}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Items</span>
                                        <span className="text-xs text-white">{selectedSellItemsList.length} item{selectedSellItemsList.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Total Weight</span>
                                        <span className="text-xs text-white font-mono">{totalSellWeight.toFixed(4)} oz</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                        <span className="text-xs text-gray-400 font-bold">Payout</span>
                                        <span className="text-lg text-green-500 font-mono font-bold">${totalSellValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Next Steps */}
                        <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-4 text-left">
                            <div className="text-[10px] uppercase tracking-widest text-gold-500 font-bold mb-2">What Happens Next</div>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-gold-500 text-xs mt-0.5">①</span>
                                    <span className="text-xs text-gray-300">Our team will review and confirm your order within 1 business day.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gold-500 text-xs mt-0.5">②</span>
                                    <span className="text-xs text-gray-300">
                                        {action === 'buy'
                                            ? 'You\'ll receive a payment invoice via email with wire instructions or payment link.'
                                            : 'Once verified, your payout will be processed to your selected method.'
                                        }
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gold-500 text-xs mt-0.5">③</span>
                                    <span className="text-xs text-gray-300">
                                        {action === 'buy'
                                            ? fulfillmentType === 'storage'
                                                ? 'After payment clears, your metals will be allocated to your vault.'
                                                : 'After payment clears, your order will be shipped or prepared for pickup.'
                                            : 'A confirmation email will be sent once the transaction is complete.'
                                        }
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-[10px] text-gray-500">
                            Questions? Chat with Maverick AI or email support@alexlexington.com
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-navy-900 border-t border-white/5 shrink-0">
                {step === 'success' ? (
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-sm font-bold tracking-[0.2em] uppercase text-sm transition-all shadow-lg shadow-gold-500/20"
                    >
                        Done
                    </button>
                ) : step === 'input' ? (
                    <button
                        onClick={() => setStep('review')}
                        disabled={action === 'buy' ? (!buyAmountVal || buyAmountVal <= 0) : Object.keys(selectedItems).length === 0}
                        className={`w-full py-4 rounded-sm font-bold tracking-[0.2em] uppercase text-sm transition-all shadow-lg ${
                            (action === 'buy' ? (!buyAmountVal || buyAmountVal <= 0) : Object.keys(selectedItems).length === 0)
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : action === 'buy' ? 'bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-500/20' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                        }`}
                    >
                        {action === 'buy' ? 'Review Purchase' : 'Review Sale'}
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('input')}
                            className="flex-1 py-4 border border-white/10 hover:bg-white/5 text-white rounded-sm font-bold tracking-[0.2em] uppercase text-sm transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={action === 'buy' && fulfillmentType === 'storage' && !policyAccepted}
                            className={`flex-[2] py-4 rounded-sm font-bold tracking-[0.2em] uppercase text-sm transition-colors shadow-lg ${
                                (action === 'buy' && fulfillmentType === 'storage' && !policyAccepted)
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : action === 'buy' ? 'bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-gold-500/20' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                            }`}
                        >
                            Confirm {action === 'buy' ? 'Buy' : 'Sell'}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Policy Modal Overlay */}
        {showPolicy && (
            <div className="absolute inset-0 z-[110] bg-black/95 flex items-center justify-center p-6">
                <div className="bg-navy-800 w-full max-w-md rounded-2xl p-6 h-[80vh] flex flex-col">
                    <h3 className="text-white font-bold mb-4">Storage Terms</h3>
                    <div className="flex-1 overflow-y-auto text-xs text-gray-400 whitespace-pre-wrap mb-4 font-mono border border-white/10 p-2 rounded">
                        {STORAGE_POLICY_TEXT}
                    </div>
                    <button onClick={() => { setPolicyAccepted(true); setShowPolicy(false); }} className="w-full py-3 bg-gold-500 text-navy-900 font-bold rounded-lg">
                        Agree & Continue
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default TradeModal;
