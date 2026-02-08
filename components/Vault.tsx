
import React, { useState, useMemo } from 'react';
import { BullionItem, SpotPrices, MetalType, AssetForm } from '../types';
import { METAL_COLORS } from '../constants';
import { calculateItemValue, calculatePureWeight } from '../utils/calculations';

interface VaultProps {
  inventory: BullionItem[];
  prices: SpotPrices;
  onDelete: (id: string) => void;
  onEdit: (item: BullionItem) => void;
  onSell: (item: BullionItem) => void;
  onAdd?: () => void;
  onScan?: () => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc';

const Vault: React.FC<VaultProps> = ({ inventory, prices, onDelete, onEdit, onSell, onAdd, onScan }) => {
  const [selectedItem, setSelectedItem] = useState<BullionItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BullionItem | null>(null);

  // Filtering and Sorting State
  const [filterMetal, setFilterMetal] = useState<string | 'ALL'>('ALL');
  const [filterForm, setFilterForm] = useState<string | 'ALL'>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  const closeDetail = () => setSelectedItem(null);

  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete.id);
      setItemToDelete(null);
      setSelectedItem(null);
    }
  };

  const displayWeight = (item: BullionItem) => {
    return `${item.weightAmount} ${item.weightUnit}`;
  };

  // Helper to identify Maroon/Vaulted products
  const isMaroonProduct = (item: BullionItem) => {
      return (item.mint?.toLowerCase().includes('alex lexington') && (item.mint?.toLowerCase().includes('digital') || item.mint?.toLowerCase().includes('vault'))) || 
             item.name.startsWith('Maroon') ||
             item.notes?.includes('Storage:');
  };

  // Helper to get stock image URL based on item details
  const getStockImage = (item: BullionItem): string | null => {
    const name = item.name.toLowerCase();
    const form = item.form.toLowerCase();
    const metal = item.metalType.toLowerCase();

    // 1. Specific Famous Coins
    if (metal === 'gold') {
        if (name.includes('eagle')) return 'https://www.usmint.gov/wordpress/wp-content/uploads/2021/06/2021-american-eagle-gold-coin-obverse-768x768.jpg';
        if (name.includes('buffalo')) return 'https://www.usmint.gov/wordpress/wp-content/uploads/2016/06/2006-american-buffalo-gold-proof-coin-obverse.jpg';
        if (name.includes('maple')) return 'https://upload.wikimedia.org/wikipedia/commons/5/53/Gold_Maple_Leaf_Obverse.png'; 
        if (name.includes('kangaroo')) return 'https://www.perthmint.com/globalassets/assets/images/bullion/investment/australian-kangaroo/2024/2024-australian-kangaroo-1oz-gold-bullion-coin-reverse.png';
        if (name.includes('brit') || name.includes('britannia')) return 'https://upload.wikimedia.org/wikipedia/en/3/37/Gold_Britannia_Obverse.jpg';
        if (name.includes('krugerrand')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Krugerrand_Obverse.jpg/480px-Krugerrand_Obverse.jpg';
    }
    if (metal === 'silver') {
        if (name.includes('eagle')) return 'https://www.usmint.gov/wordpress/wp-content/uploads/2021/06/2021-american-eagle-silver-coin-obverse-768x768.jpg';
        if (name.includes('maple')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Silver_Maple_Leaf_Obverse.png';
        if (name.includes('brit') || name.includes('britannia')) return 'https://upload.wikimedia.org/wikipedia/en/7/75/Silver_Britannia_Obverse.jpg';
    }
    if (metal === 'platinum' && form.includes('coin')) {
        return 'https://www.usmint.gov/wordpress/wp-content/uploads/2024/01/2024-american-eagle-platinum-proof-coin-obverse.jpg';
    }

    // 2. Generic Bar/Coin Fallbacks (High Quality Proxies)
    if (form.includes('bar')) {
        if (metal === 'gold') return 'https://images.unsplash.com/photo-1610375461490-6d61569076b9?auto=format&fit=crop&w=150&q=80'; 
        if (metal === 'silver') return 'https://images.unsplash.com/photo-1624823183488-29267ff35467?auto=format&fit=crop&w=150&q=80';
    }
    
    // Default fallback for coins if no specific match but is coin
    if (form.includes('coin') || form.includes('round')) {
        if (metal === 'gold') return 'https://www.usmint.gov/wordpress/wp-content/uploads/2021/06/2021-american-eagle-gold-coin-obverse-768x768.jpg'; // Default to Eagle
        if (metal === 'silver') return 'https://www.usmint.gov/wordpress/wp-content/uploads/2021/06/2021-american-eagle-silver-coin-obverse-768x768.jpg';
    }

    return null;
  };

  const processedInventory = useMemo(() => {
    let result = [...inventory];
    if (filterMetal !== 'ALL') result = result.filter(item => item.metalType === filterMetal);
    
    if (filterForm !== 'ALL') {
        if (filterForm === 'Stored') {
            result = result.filter(item => isMaroonProduct(item));
        } else {
            result = result.filter(item => item.form === filterForm);
        }
    }
    
    result.sort((a, b) => {
        const valueA = calculateItemValue(a, prices[a.metalType] || 0);
        const valueB = calculateItemValue(b, prices[b.metalType] || 0);
        const dateA = new Date(a.acquiredAt).getTime();
        const dateB = new Date(b.acquiredAt).getTime();

      switch (sortOption) {
        case 'date-desc': return dateB - dateA;
        case 'date-asc': return dateA - dateB;
        case 'value-desc': return valueB - valueA;
        case 'value-asc': return valueA - valueB;
        default: return 0;
      }
    });
    return result;
  }, [inventory, filterMetal, filterForm, sortOption, prices]);

  // Calculate total melt value and pure weight across all holdings
  const vaultSummary = useMemo(() => {
    let totalMeltValue = 0;
    let totalCostBasis = 0;
    const metalBreakdown: Record<string, { pureOz: number; value: number }> = {};

    for (const item of inventory) {
      const spotPrice = prices[item.metalType] || 0;
      const meltValue = calculateItemValue(item, spotPrice);
      const pureOz = calculatePureWeight(item);
      totalMeltValue += meltValue;
      totalCostBasis += item.purchasePrice;

      if (!metalBreakdown[item.metalType]) {
        metalBreakdown[item.metalType] = { pureOz: 0, value: 0 };
      }
      metalBreakdown[item.metalType].pureOz += pureOz;
      metalBreakdown[item.metalType].value += meltValue;
    }

    return { totalMeltValue, totalCostBasis, metalBreakdown };
  }, [inventory, prices]);

  const isLocked = selectedItem ? isMaroonProduct(selectedItem) : false;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 space-y-6">

      {/* Header & Filters */}
      <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-navy-900 dark:text-white">The Vault</h1>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <select 
                value={filterMetal} 
                onChange={(e) => setFilterMetal(e.target.value)}
                className="bg-white dark:bg-navy-800 text-xs font-bold text-navy-900 dark:text-gray-300 py-2 px-4 rounded-full border border-gray-200 dark:border-navy-700 focus:outline-none capitalize"
            >
                <option value="ALL">All Metals</option>
                {Object.values(MetalType).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
                value={filterForm} 
                onChange={(e) => setFilterForm(e.target.value)}
                className="bg-white dark:bg-navy-800 text-xs font-bold text-navy-900 dark:text-gray-300 py-2 px-4 rounded-full border border-gray-200 dark:border-navy-700 focus:outline-none"
            >
                <option value="ALL">All Forms</option>
                <option value="Stored">Stored (Vault)</option>
                {Object.values(AssetForm).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-white dark:bg-navy-800 text-xs font-bold text-navy-900 dark:text-gray-300 py-2 px-4 rounded-full border border-gray-200 dark:border-navy-700 focus:outline-none"
            >
                <option value="date-desc">Newest First</option>
                <option value="value-desc">Highest Value</option>
            </select>
          </div>
      </div>

      {/* Total Melt Value Summary */}
      {inventory.length > 0 && (
        <div className="bg-gradient-to-r from-navy-800 to-navy-900 dark:from-navy-800 dark:to-navy-900 rounded-xl p-4 border border-gold-500/20 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Melt Value</span>
            <span className="text-xl font-mono font-bold text-gold-500">
              ${vaultSummary.totalMeltValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {Object.entries(vaultSummary.metalBreakdown).map(([metal, data]) => (
              <div key={metal} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: METAL_COLORS[metal] || '#999' }} />
                <span className="text-[10px] text-gray-300 capitalize">{metal}</span>
                <span className="text-[10px] text-white font-mono font-bold">{data.pureOz.toFixed(2)} oz</span>
              </div>
            ))}
          </div>
          {vaultSummary.totalCostBasis > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Cost Basis</span>
              <span className="text-xs text-gray-400 font-mono">${vaultSummary.totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      )}

      {/* Inventory List */}
      <div className="space-y-3 pb-20">
          {processedInventory.map((item) => {
            const currentPrice = prices[item.metalType] || 0;
            const currentValue = calculateItemValue(item, currentPrice);
            const profit = currentValue - item.purchasePrice;
            const isProfit = profit >= 0;
            const locked = isMaroonProduct(item);
            const stockImage = getStockImage(item);
            const isBar = item.form.toLowerCase().includes('bar');
            
            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border ${locked ? 'border-gold-500/20' : 'border-gray-100 dark:border-navy-700'} flex justify-between items-center active:scale-[0.99] transition-transform cursor-pointer relative overflow-hidden group`}
              >
                {locked && <div className="absolute top-0 right-0 w-2 h-2 bg-gold-500 rounded-bl-lg z-10"></div>}
                
                <div className="flex items-center gap-4">
                  {/* Icon or Image */}
                  <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center ${!stockImage ? 'rounded-full shadow-inner' : ''}`}
                       style={!stockImage ? { backgroundColor: METAL_COLORS[item.metalType] } : {}}
                  >
                    {stockImage ? (
                        <div className={`w-full h-full overflow-hidden border border-gray-100 dark:border-navy-600 bg-white ${isBar ? 'rounded-md' : 'rounded-full'}`}>
                            <img 
                                src={stockImage} 
                                alt={item.name} 
                                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                    // Fallback if image fails
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                        target.style.display = 'none';
                                        parent.style.backgroundColor = METAL_COLORS[item.metalType];
                                        parent.innerText = item.metalType.substring(0, 2).toUpperCase();
                                        parent.className = "w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner";
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-white">
                            {item.metalType.substring(0, 2).toUpperCase()}
                        </span>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex flex-col">
                    <h3 className="font-bold text-sm text-navy-900 dark:text-white leading-tight group-hover:text-gold-500 transition-colors">{item.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                       <span className="font-medium bg-gray-100 dark:bg-navy-700 px-1.5 rounded text-[10px] mr-2 text-navy-700 dark:text-gray-300">{item.quantity}x</span>
                       <span>{displayWeight(item)} {item.form}</span>
                    </div>
                  </div>
                </div>
                
                {/* Value Column */}
                <div className="text-right pl-2">
                  <p className="font-bold text-sm text-navy-900 dark:text-white font-mono">
                    ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[10px] font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                   {isProfit ? '+' : ''}{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}

          {processedInventory.length === 0 && (
             <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1">Your vault is empty</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Add your precious metals holdings to track their value in real time.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                  {onScan && (
                    <button onClick={onScan} className="flex items-center justify-center gap-2 px-5 py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 active:scale-95">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Scan Coin / Invoice
                    </button>
                  )}
                  {onAdd && (
                    <button onClick={onAdd} className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors active:scale-95">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Manually
                    </button>
                  )}
                </div>
             </div>
          )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className={`bg-white dark:bg-navy-800 w-full max-w-sm rounded-2xl p-6 border ${isLocked ? 'border-gold-500 shadow-gold-500/20 shadow-2xl' : 'border-gray-700'} relative`}>
              <button onClick={closeDetail} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
              
              {isLocked && (
                  <div className="absolute top-4 left-6 px-2 py-0.5 bg-gold-500 text-navy-900 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      Vaulted Asset
                  </div>
              )}

              <div className="flex justify-center mb-6 mt-8">
                  {getStockImage(selectedItem) ? (
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-navy-700 shadow-xl bg-white">
                          <img src={getStockImage(selectedItem)!} alt={selectedItem.name} className="w-full h-full object-cover" />
                      </div>
                  ) : (
                      <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-inner" style={{ backgroundColor: METAL_COLORS[selectedItem.metalType] }}>
                          {selectedItem.metalType.substring(0, 2).toUpperCase()}
                      </div>
                  )}
              </div>

              <h2 className={`text-2xl font-serif font-bold text-center ${isLocked ? 'text-gold-500' : 'text-navy-900 dark:text-white'} mb-1`}>{selectedItem.name}</h2>
              <p className="text-gray-400 text-sm mb-6 text-center">{selectedItem.mint}</p>
              
              <div className="space-y-4 bg-navy-50 dark:bg-navy-900/50 p-4 rounded-xl border border-gray-100 dark:border-navy-700">
                 <div className="flex justify-between border-b border-gray-200 dark:border-navy-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Purity</span>
                    <span className="text-navy-900 dark:text-white font-mono text-sm">{selectedItem.purity}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 dark:border-navy-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Weight</span>
                    <span className="text-navy-900 dark:text-white font-mono text-sm">{displayWeight(selectedItem)}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 dark:border-navy-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Pure Content</span>
                    <span className="text-navy-900 dark:text-white font-mono text-sm">{calculatePureWeight(selectedItem).toFixed(4)} oz</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 dark:border-navy-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Melt Value</span>
                    <span className="text-gold-500 font-mono text-sm font-bold">
                      ${calculateItemValue(selectedItem, prices[selectedItem.metalType] || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 dark:border-navy-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Cost Basis</span>
                    <span className="text-navy-900 dark:text-white font-mono text-sm">${selectedItem.purchasePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between pt-1">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Acquired</span>
                    <span className="text-navy-900 dark:text-white font-mono text-sm">{selectedItem.acquiredAt}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                    onClick={() => { onEdit(selectedItem); }}
                    className="flex-1 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-navy-900 dark:text-white font-bold py-3 rounded-xl transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={() => {
                        if (isLocked) {
                            onSell(selectedItem);
                            setSelectedItem(null);
                        } else {
                            setItemToDelete(selectedItem);
                        }
                    }}
                    className={`flex-1 font-bold py-3 rounded-xl transition-colors border ${
                        isLocked
                        ? 'bg-gold-500 hover:bg-gold-600 text-navy-900 border-gold-500'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30'
                    }`}
                >
                    {isLocked ? 'Sell' : 'Remove'}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-navy-800 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-navy-700">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to remove <strong>{itemToDelete.name}</strong> from your vault? You can undo this action immediately after.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Vault;
