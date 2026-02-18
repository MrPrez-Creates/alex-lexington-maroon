
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BullionItem, SpotPrices, MetalType, Transaction } from '../types';
import { METAL_COLORS } from '../constants';
import { fetchChartHistory, HistoricalDataPoint } from '../services/marketData';
import { calculateItemValue } from '../utils/calculations';

interface DashboardProps {
  inventory: BullionItem[];
  transactions: Transaction[];
  prices: SpotPrices;
  cashBalance: number;
  onTrade: (action: 'buy' | 'sell', metal: string, amount: number, units: 'usd' | 'oz', price: number) => void;
  onSelectMetal: (metal: string) => void;
  darkMode: boolean;
  onAction?: (action: 'transfer' | 'trade' | 'deposit' | 'withdraw') => void;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type ChartType = 'PORTFOLIO' | string; // ChartType handles generic string for metal keys

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const Dashboard: React.FC<DashboardProps> = ({ inventory, transactions = [], prices, cashBalance, onSelectMetal, darkMode, onAction }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [selectedChart, setSelectedChart] = useState<ChartType>('PORTFOLIO');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Calculate Portfolio Stats & Allocation
  const portfolioStats = useMemo(() => {
    let value = 0;
    let cost = 0;
    
    // Track value by metal type - Initialize all keys from Enum to prevent undefined access
    const allocation: Record<string, number> = {};
    Object.values(MetalType).forEach(type => {
        allocation[type] = 0;
    });

    inventory.forEach(item => {
      const spotKey = item.metalType;
      const spot = prices[spotKey] || 0;
      const itemTotalValue = calculateItemValue(item, spot);
      
      value += itemTotalValue;
      cost += item.purchasePrice;
      if (allocation[item.metalType] !== undefined) {
         allocation[item.metalType] += itemTotalValue;
      } else {
         // Fallback if type somehow matches nothing in enum (shouldn't happen with strict types)
         allocation[item.metalType] = itemTotalValue;
      }
    });

    // Add Cash Balance
    value += cashBalance;

    const metalValue = value - cashBalance;
    const metalPL = metalValue - cost;
    const plPercent = cost > 0 ? (metalPL / cost) * 100 : 0;

    return { totalValue: value, totalCost: cost, profitLoss: metalPL, profitLossPercent: plPercent, allocation };
  }, [inventory, prices, cashBalance]);

  // Determine Dominant Metal for Portfolio Chart Proxy
  const dominantMetal = useMemo(() => {
      let maxVal = -1;
      let dom = MetalType.GOLD; // Default
      for (const [key, val] of Object.entries(portfolioStats.allocation)) {
          if ((val as number) > maxVal) {
              maxVal = (val as number);
              dom = key as MetalType;
          }
      }
      return maxVal > 0 ? dom : MetalType.GOLD;
  }, [portfolioStats.allocation]);

  // Combine Inventory Purchases and Sales Transactions for display
  const combinedHistory = useMemo(() => {
      // 1. Inventory Purchases
      const purchases = inventory.map(item => ({
          id: item.id,
          date: item.acquiredAt,
          type: 'BUY' as const,
          metal: item.metalType,
          form: item.form,
          name: item.name,
          qty: item.quantity,
          value: item.purchasePrice,
          status: 'Completed'
      }));

      // 2. Sales Transactions
      const sales = transactions.map(tx => ({
          id: tx.id,
          date: tx.date,
          type: 'SELL' as const,
          metal: tx.metal,
          form: 'Asset',
          name: tx.itemName,
          qty: 1, // Simplified
          value: tx.totalValue,
          status: tx.status
      }));

      // Sort Descending by Date
      return [...purchases, ...sales].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [inventory, transactions]);

  // Storage Stats Calculation
  const storageStats = useMemo(() => {
      const vaultValue = inventory.reduce((total, item) => {
          const isVaulted = (item.mint?.toLowerCase().includes('alex lexington')) ||
                            item.id.startsWith('web-') ||
                            item.id.startsWith('vault-') ||
                            item.notes?.includes('In Our Storage');
          if (isVaulted) {
              return total + calculateItemValue(item, prices[item.metalType] || 0);
          }
          return total;
      }, 0);

      // Segregated storage rate (1.25%) — all storage is segregated
      const rate = 0.0125;
      const min = 200;
      const calculatedFee = vaultValue * rate;
      const actualFee = Math.max(calculatedFee, min);
      const isMinimum = calculatedFee <= min;

      return { vaultValue, actualFee, isMinimum, rate };
  }, [inventory, prices]);

  // Fetch Chart Data
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const metalQuery = selectedChart === 'PORTFOLIO' ? dominantMetal : selectedChart; 
        
        const data = await fetchChartHistory(metalQuery, timeRange);
        
        if (!data || data.length === 0) {
            setHistoricalData([]);
            return;
        }

        if (selectedChart === 'PORTFOLIO') {
            const metalTotal = portfolioStats.totalValue - cashBalance;
            if (metalTotal > 0) {
                const lastPointVal = data[data.length - 1].value;
                if (lastPointVal > 0) {
                    const scaleRatio = metalTotal / lastPointVal;
                    const scaledData = data.map(p => ({
                        ...p,
                        value: (p.value * scaleRatio) + cashBalance // Lift chart by cash amount
                    }));
                    setHistoricalData(scaledData);
                } else {
                    setHistoricalData(data);
                }
            } else {
                 // If only cash, flat line? or just hide?
                 if (cashBalance > 0) {
                     setHistoricalData(data.map(p => ({ ...p, value: cashBalance })));
                 } else {
                     setHistoricalData(data);
                 }
            }
        } else {
            setHistoricalData(data);
        }
      } catch (err) {
        console.error("Failed to load chart history", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [timeRange, selectedChart, portfolioStats.totalValue, dominantMetal, cashBalance]); 

  const chartColor = selectedChart === 'PORTFOLIO' 
    ? (portfolioStats.totalValue > 0 ? METAL_COLORS[dominantMetal] : '#D4AF37') 
    : METAL_COLORS[selectedChart] || '#D4AF37';
    
  const isPositive = portfolioStats.profitLoss >= 0;

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* 1. Main Header Stats */}
      <div className="text-center space-y-2 py-4">
          <h2 className="text-gray-500 dark:text-gray-400 text-xs font-bold tracking-widest uppercase">Total Portfolio Value</h2>
          <div className="text-5xl md:text-7xl font-serif font-medium text-navy-900 dark:text-white tracking-tight transition-colors duration-200">
             ${portfolioStats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <span className="mr-1">{isPositive ? '▲' : '▼'}</span>
              ${Math.abs(portfolioStats.profitLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({portfolioStats.profitLossPercent.toFixed(2)}%)
          </div>
      </div>
      
      {/* 1.5 Quick Actions */}
      <div className="flex gap-3 justify-center pb-2">
          <button
            onClick={() => onAction?.('deposit')}
            className="flex-1 max-w-[140px] py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full transition-colors shadow-lg flex items-center justify-center gap-2"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              Deposit
          </button>
          <button
            onClick={() => onAction?.('trade')}
            className="flex-1 max-w-[140px] py-3 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-full transition-colors shadow-lg shadow-gold-500/20"
          >
              Buy & Sell
          </button>
          <button
            onClick={() => onAction?.('withdraw')}
            className="flex-1 max-w-[140px] py-3 bg-navy-800 hover:bg-navy-700 text-white font-bold rounded-full transition-colors border border-white/5 shadow-lg flex items-center justify-center gap-2"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              Withdraw
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SECTION 1: CHART */}
          <div className="lg:col-span-8 order-1">
               <div className="bg-white dark:bg-navy-800 rounded-2xl p-4 md:p-6 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 relative overflow-hidden transition-colors duration-200 flex flex-col">
                   {/* Chart Header */}
                   <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            <button 
                               onClick={() => setSelectedChart('PORTFOLIO')}
                               className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${selectedChart === 'PORTFOLIO' ? 'bg-gold-500 text-navy-900' : 'text-gray-400 hover:text-navy-900 dark:hover:text-white'}`}
                            >
                                Portfolio
                            </button>
                            {Object.values(MetalType)
                                .map((m) => (
                                <button 
                                   key={m}
                                   onClick={() => setSelectedChart(m)}
                                   className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize transition-colors ${selectedChart === m ? 'bg-gold-500 text-navy-900' : 'text-gray-400 hover:text-navy-900 dark:hover:text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="w-full h-96">
                        {isLoadingHistory ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">Loading data...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={historicalData}>
                                    <defs>
                                        <linearGradient id="colorChartMain" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#e5e7eb"} strokeOpacity={darkMode ? 0.3 : 1} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin', 'dataMax']} />
                                    <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: darkMode ? '#0e2e50' : '#ffffff', 
                                          borderColor: darkMode ? '#153b63' : '#e5e7eb', 
                                          color: darkMode ? '#fff' : '#0a2440', 
                                          fontSize: '10px',
                                          borderRadius: '8px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: darkMode ? '#F3F4F6' : '#0a2440' }}
                                        formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Value']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke={chartColor} 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorChartMain)"
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="flex justify-between mt-4 px-2 border-t border-gray-100 dark:border-white/5 pt-4">
                        {TIME_RANGES.map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`text-[10px] font-medium transition-colors ${timeRange === range ? 'text-gold-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
               </div>
          </div>

          {/* SECTION 2: ASSETS */}
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-2">
              <div className="sticky top-24 space-y-4">
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white ml-1">Your Assets</h3>
                  <div className="grid grid-cols-2 gap-4">
                      {/* Cash Card */}
                      <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none hover:border-gold-500/50 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase">Cash</span>
                            </div>
                            <div className="text-lg font-bold text-navy-900 dark:text-white">
                                ${cashBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                                USD Available
                            </div>
                      </div>

                      {Object.values(MetalType).map((metal) => (
                        <div 
                            key={metal}
                            onClick={() => onSelectMetal(metal)}
                            className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none cursor-pointer hover:border-gold-500/50 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: METAL_COLORS[metal]}}></div>
                                <span className="text-xs font-bold text-gray-400 uppercase">{metal}</span>
                            </div>
                            <div className="text-lg font-bold text-navy-900 dark:text-white">
                                ${(portfolioStats.allocation[metal] || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                                {(( (portfolioStats.allocation[metal] || 0) / (portfolioStats.totalValue || 1)) * 100).toFixed(1)}% Allocation
                            </div>
                        </div>
                      ))}
                  </div>

                  {/* Storage Status Card */}
                  {storageStats.vaultValue > 0 && (
                      <div className="bg-navy-900 p-4 rounded-xl border border-gold-500/20 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gold-500 uppercase tracking-wider">Vault Account</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${storageStats.isMinimum ? 'bg-white/10 text-white' : 'bg-gold-500 text-navy-900'}`}>
                                  {storageStats.isMinimum ? 'Standard Tier' : 'Pro Tier'}
                              </span>
                          </div>
                          <div className="flex justify-between items-end">
                              <div>
                                  <div className="text-[10px] text-gray-400">Total Vault Value</div>
                                  <div className="text-sm font-mono text-white">${storageStats.vaultValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-[10px] text-gray-400">Est. Storage Fee</div>
                                  <div className="text-sm font-mono text-white">${storageStats.actualFee.toLocaleString(undefined, {maximumFractionDigits: 2})}<span className="text-[10px] text-gray-500">/yr</span></div>
                              </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="w-full bg-navy-800 rounded-full h-1.5 overflow-hidden">
                                  {/* Progress bar showing how close they are to exiting minimum tier */}
                                  <div 
                                      className="bg-gold-500 h-full rounded-full transition-all duration-1000" 
                                      style={{ width: `${Math.min((storageStats.vaultValue / (200 / storageStats.rate)) * 100, 100)}%` }}
                                  ></div>
                              </div>
                              <p className="text-[9px] text-gray-500 mt-1 text-center">
                                  {storageStats.isMinimum 
                                    ? `Rate locked at minimum until $${(200 / storageStats.rate).toLocaleString()} value` 
                                    : `Currently billed at ${(storageStats.rate * 100).toFixed(2)}%`
                                  }
                              </p>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* SECTION 3: TRANSACTIONS */}
          <div className="lg:col-span-8 pb-24 order-3 lg:order-3">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-4 ml-1">Recent Transactions</h3>
              <div className="space-y-3">
                  {combinedHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none flex justify-between items-center transition-colors hover:bg-gray-50 dark:hover:bg-navy-700"
                      >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                 <div 
                                    className="w-1.5 h-10 rounded-full" 
                                    style={{ backgroundColor: METAL_COLORS[item.metal] || '#ccc' }}
                                ></div>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-mono mb-0.5">{item.date}</span>
                                <h3 className="font-bold text-sm text-navy-900 dark:text-white leading-tight">{item.name}</h3>
                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                   <span className={`font-medium px-1.5 rounded text-[10px] mr-2 ${item.type === 'SELL' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                       {item.type} {item.qty > 1 ? `(${item.qty}x)` : ''}
                                   </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-sm ${item.type === 'SELL' ? 'text-green-500' : 'text-navy-900 dark:text-white'}`}>
                            {item.type === 'SELL' ? '+' : '-'}${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.type === 'SELL' ? 'Proceeds' : 'Cost Basis'}
                          </p>
                        </div>
                      </div>
                  ))}
                  
                  {combinedHistory.length === 0 && (
                      <div className="text-center py-8 bg-white/50 dark:bg-navy-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                          <p className="text-gray-500 text-xs">No transactions recorded.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
