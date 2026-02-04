
import React, { useState, useMemo } from 'react';
import { SpotPrices, MetalType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface AdminRiskProps {
  prices: SpotPrices;
}

const AdminRisk: React.FC<AdminRiskProps> = ({ prices }) => {
  // --- 1. COMMAND CENTER (RISK) ---
  // Mock Data: Physical (FileMaker) vs Virtual (Shopify/Liabilities)
  const riskData = useMemo(() => [
    { name: 'Gold', physical: 1250, liabilities: 1100, unit: 'oz' }, // Net Long 150
    { name: 'Silver', physical: 42000, liabilities: 48000, unit: 'oz' }, // Net Short 6000 (Risk!)
    { name: 'Platinum', physical: 500, liabilities: 450, unit: 'oz' },
    { name: 'Palladium', physical: 100, liabilities: 120, unit: 'oz' },
  ], []);

  // --- 2. THE REFINERY (SCRAP MATH) ---
  const [refineryInput, setRefineryInput] = useState({
      metal: 'gold',
      grams: '',
      purity: '99.99' // Percent
  });

  const grams = parseFloat(refineryInput.grams) || 0;
  const purity = parseFloat(refineryInput.purity) || 0;
  
  // Scrap Math Logic
  const troyOz = grams / 31.1035;
  const fineOz = troyOz * (purity / 100);
  const scrapValue = fineOz * (prices[refineryInput.metal as keyof SpotPrices] || 0);

  // --- 3. ENGINE ROOM (CONFIG) ---
  const [globalSpreads, setGlobalSpreads] = useState<Record<string, { buy: number; sell: number }>>({
      gold: { buy: -1.5, sell: 2.5 },
      silver: { buy: -0.50, sell: 1.25 },
      platinum: { buy: -4.0, sell: 4.0 }
  });

  const handleSpreadChange = (metal: string, type: 'buy' | 'sell', val: string) => {
      setGlobalSpreads(prev => ({
          ...prev,
          [metal]: { ...prev[metal], [type]: parseFloat(val) }
      }));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 space-y-6 animate-fade-in pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-navy-900 dark:text-white tracking-tight">Maroon Central Command</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">ERP Module • v2.4.0</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-navy-800 rounded-lg border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">System Operational</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* --- PILLAR 1: COMMAND CENTER (RISK MONITOR) --- */}
            <div className="lg:col-span-8 bg-white dark:bg-navy-800 rounded-2xl p-6 border border-gray-100 dark:border-navy-700 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Net Open Position
                    </h3>
                    <span className="text-[10px] text-gray-400">Vault (Physical) vs Users (Liability)</span>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                            <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#0A2240', borderColor: '#153b63', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                            />
                            <ReferenceLine y={0} stroke="#4B5563" />
                            <Bar dataKey="physical" name="Physical Assets" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="liabilities" name="User Liabilities" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Net Position Indicators */}
                <div className="grid grid-cols-4 gap-4 mt-4 border-t border-gray-100 dark:border-navy-700 pt-4">
                    {riskData.map((item) => {
                        const net = item.physical - item.liabilities;
                        const isSafe = net >= 0;
                        return (
                            <div key={item.name} className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">{item.name} Net</div>
                                <div className={`font-mono font-bold text-sm ${isSafe ? 'text-green-500' : 'text-red-500'}`}>
                                    {net > 0 ? '+' : ''}{net.toLocaleString()} oz
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- PILLAR 2: THE REFINERY (SCRAP MATH) --- */}
            <div className="lg:col-span-4 bg-navy-900 rounded-2xl p-6 border border-gold-500/20 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-sm font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        The Refinery
                    </h3>
                    <span className="text-[9px] bg-gold-500/10 text-gold-500 px-2 py-1 rounded border border-gold-500/20">Scrap Math</span>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Input Weight</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={refineryInput.grams}
                                    onChange={(e) => setRefineryInput({...refineryInput, grams: e.target.value})}
                                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-gold-500 outline-none"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-3 top-2 text-xs text-gray-500">g</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Purity %</label>
                            <input 
                                type="number" 
                                value={refineryInput.purity}
                                onChange={(e) => setRefineryInput({...refineryInput, purity: e.target.value})}
                                className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-gold-500 outline-none"
                                placeholder="99.99"
                            />
                        </div>
                    </div>

                    {/* Calculation Display */}
                    <div className="bg-navy-950 rounded-xl p-4 space-y-3 border border-white/5">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Troy Oz</span>
                            <span className="text-gray-300 font-mono text-sm">{troyOz > 0 ? troyOz.toFixed(4) : '0.0000'} <span className="text-[10px] text-gray-600">oz t</span></span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-gold-500 font-bold text-xs uppercase">Fine Oz (Net)</span>
                            <span className="text-gold-500 font-mono font-bold text-lg">{fineOz > 0 ? fineOz.toFixed(4) : '0.0000'} <span className="text-xs">oz</span></span>
                        </div>
                        <div className="text-right text-[10px] text-gray-600 font-mono">
                            ≈ ${scrapValue.toLocaleString(undefined, {maximumFractionDigits: 2})} USD
                        </div>
                    </div>

                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                        Log Intake Batch
                    </button>
                </div>
            </div>

            {/* --- PILLAR 3: ENGINE ROOM (CONFIG) --- */}
            <div className="lg:col-span-12 bg-white dark:bg-navy-800 rounded-2xl p-6 border border-gray-100 dark:border-navy-700 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Global Pricing Spreads
                    </h3>
                    <button className="text-xs font-bold text-gold-500 border border-gold-500/30 px-3 py-1 rounded hover:bg-gold-500/10 transition-colors">
                        Save Config
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(globalSpreads).map(([metal, s]) => {
                        const spread = s as { buy: number; sell: number };
                        return (
                        <div key={metal} className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 border border-gray-200 dark:border-navy-700">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{metal}</span>
                                <span className="text-[10px] bg-navy-200 dark:bg-navy-800 text-navy-700 dark:text-gray-400 px-2 py-0.5 rounded">
                                    Current Spot: ${prices[metal as keyof SpotPrices]?.toLocaleString() || '0.00'}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1">Buy Spread ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.10"
                                        value={spread.buy}
                                        onChange={(e) => handleSpreadChange(metal, 'buy', e.target.value)}
                                        className="w-full bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded px-2 py-1.5 text-sm font-mono focus:border-gold-500 outline-none text-navy-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1">Sell Spread ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.10"
                                        value={spread.sell}
                                        onChange={(e) => handleSpreadChange(metal, 'sell', e.target.value)}
                                        className="w-full bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded px-2 py-1.5 text-sm font-mono focus:border-gold-500 outline-none text-navy-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    ); })}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminRisk;
