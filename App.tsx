
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import {
  fetchLiveSpotPrices
} from './services/marketData';
import {
  subscribeToUserProfile,
  subscribeToInventory,
  subscribeToTransactions,
  subscribeToAlerts,
  subscribeToUserFiles,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addTransaction,
  addPriceAlert,
  deletePriceAlert,
  updateUserBalance,
  logoutUser,
  updateUserSettings,
  // Shared collection functions for Command Center integration
  addVaultHolding,
  createSharedTransaction,
  subscribeToVaultHoldings
} from './services/firestoreService';
import {
  getCustomerHoldingsByFirebaseUid,
  VaultHolding as ApiVaultHolding,
  requestWithdrawal
} from './services/apiClient';
import { 
  BullionItem, 
  SpotPrices, 
  Transaction, 
  UserProfile, 
  PriceAlert, 
  StoredFile, 
  ViewState,
  MetalType,
  AssetForm,
  TransactionType,
  TransactionStatus,
  RecurringFrequency,
  VaultHolding
} from './types';
import { MOCK_SPOT_PRICES } from './constants';

// Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Vault from './components/Vault';
import AddItem from './components/AddItem';
import Market from './components/Market';
import History from './components/History';
import AIHub from './components/AIHub';
import Explore from './components/Explore';
import Documents from './components/Documents';
import AdminCustomers from './components/AdminCustomers';
import PaymentMethods from './components/PaymentMethods';
import LiveChat from './components/LiveChat';
import LiveTicker from './components/LiveTicker';
import AuthModal from './components/AuthModal';
import SideMenu from './components/SideMenu';
import TradeModal from './components/TradeModal';
import TransferModal from './components/TransferModal';
import MarketStatus from './components/MarketStatus';
import ContactSupport from './components/ContactSupport';
import AdminSupport from './components/AdminSupport';
import AdminRisk from './components/AdminRisk';

export default function App() {
  // Auth State (Now using Supabase)
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // App Data State
  const [prices, setPrices] = useState<SpotPrices>(MOCK_SPOT_PRICES);
  const [localInventory, setLocalInventory] = useState<BullionItem[]>([]);
  const [apiHoldings, setApiHoldings] = useState<BullionItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [vaultHoldings, setVaultHoldings] = useState<VaultHolding[]>([]);

  // Combined inventory: local Firebase items + API holdings from Supabase
  const inventory = useMemo(() => {
    // Dedupe by checking if an API holding matches a local item by source order ID
    const localIds = new Set(localInventory.map(item => item.id));
    const uniqueApiHoldings = apiHoldings.filter(h => !localIds.has(h.id));
    return [...localInventory, ...uniqueApiHoldings];
  }, [localInventory, apiHoldings]);
  
  // UI State
  const [view, setView] = useState<ViewState>('landing');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [liveChatPrompt, setLiveChatPrompt] = useState<string | undefined>(undefined);
  
  // Specific Modal States
  const [editingItem, setEditingItem] = useState<BullionItem | null>(null);
  const [autoStartCamera, setAutoStartCamera] = useState(false);
  
  // Trade Modal State
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeConfig, setTradeConfig] = useState<{
    action: 'buy' | 'sell';
    metal: string;
  }>({ action: 'buy', metal: MetalType.GOLD });

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<'deposit' | 'withdraw'>('deposit');

  // Action Sheet (Mobile Add Menu)
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Registration Flow flag
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  
  // Market View Selection
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);

  // ERP Tab State
  const [erpTab, setErpTab] = useState<'risk' | 'crm' | 'ai'>('risk');

  // --- Effects ---

  // 1. Auth Listener (Now using Supabase)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        if (view === 'landing') setView('dashboard');
        if (!isRegistrationFlow) setShowAuthModal(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        if (view === 'landing') setView('dashboard');
        if (!isRegistrationFlow) setShowAuthModal(false);
      } else {
        setView('landing');
        setLocalInventory([]);
        setApiHoldings([]);
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [view, isRegistrationFlow]);

  // 2. User Profile Subscription
  useEffect(() => {
      if (!user) {
          setUserProfile(null);
          return;
      }
      const unsub = subscribeToUserProfile((profile) => {
          setUserProfile(profile);
          if (profile?.settings?.darkMode !== undefined) {
              setIsDarkMode(profile.settings.darkMode);
          }
      });
      return () => unsub();
  }, [user]);

  // 3. Data Subscriptions (Firebase)
  useEffect(() => {
      if (!user) return;

      const unsubInventory = subscribeToInventory(setLocalInventory);
      const unsubTransactions = subscribeToTransactions(setTransactions);
      const unsubAlerts = subscribeToAlerts(setAlerts);
      const unsubFiles = subscribeToUserFiles(setFiles);
      const unsubVaultHoldings = subscribeToVaultHoldings(setVaultHoldings);

      return () => {
          unsubInventory();
          unsubTransactions();
          unsubAlerts();
          unsubFiles();
          unsubVaultHoldings();
      };
  }, [user]);

  // 3b. Fetch holdings from Supabase API (purchases from Shopify/Command Center)
  useEffect(() => {
      if (!user) {
          setApiHoldings([]);
          return;
      }

      const fetchApiHoldings = async () => {
          try {
              const response = await getCustomerHoldingsByFirebaseUid(user.id);
              if (response.data && response.data.holdings) {
                  // Convert API holdings to BullionItem format
                  const holdings: BullionItem[] = response.data.holdings.map((h: ApiVaultHolding) => ({
                      id: h.holding_id,
                      name: h.name || h.description || `${h.metal_name} (Order #${h.order_number})`,
                      metalType: h.metal_code.toLowerCase(),
                      weightAmount: h.weight_ozt,
                      weightUnit: 'oz',
                      quantity: h.quantity,
                      purchasePrice: h.cost_basis,
                      currentValue: h.current_value,
                      acquiredAt: h.purchased_at.split('T')[0],
                      form: h.weight_category || AssetForm.BAR,
                      purity: '.9999',
                      mint: 'Alex Lexington (Vault)',
                      notes: `Order #${h.order_number} | Status: ${h.status}`,
                      sku: h.sku || undefined,
                  }));
                  setApiHoldings(holdings);
              }
          } catch (error) {
              console.error('Failed to fetch API holdings:', error);
              // Don't clear existing holdings on error - they might just be temporarily unavailable
          }
      };

      fetchApiHoldings();
      // Refresh every 60 seconds to pick up new purchases
      const interval = setInterval(fetchApiHoldings, 60000);
      return () => clearInterval(interval);
  }, [user]);

  // 4. Price Ticker
  useEffect(() => {
      const fetchPrices = async () => {
          try {
            const newPrices = await fetchLiveSpotPrices();
            setPrices(newPrices);
          } catch (e) {
            console.error("Failed to fetch prices", e);
          }
      };
      
      fetchPrices();
      const interval = setInterval(fetchPrices, 30000); // 30s
      return () => clearInterval(interval);
  }, []);

  // 5. Dark Mode Class
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  // --- Handlers ---

  const handleLogout = async () => {
      await logoutUser();
      setShowSideMenu(false);
      setView('landing');
  };

  const toggleDarkMode = () => {
      const newVal = !isDarkMode;
      setIsDarkMode(newVal);
      if (userProfile) {
          updateUserSettings({ darkMode: newVal });
      }
  };

  // Open LiveChat with optional initial prompt
  const openLiveChat = (initialPrompt?: string) => {
      setLiveChatPrompt(initialPrompt);
      setShowLiveChat(true);
  };

  // Close LiveChat and clear prompt
  const closeLiveChat = () => {
      setShowLiveChat(false);
      setLiveChatPrompt(undefined);
  };

  const handleTrade = async (
      action: 'buy' | 'sell', 
      metal: string, 
      amount: number, // USD amount (Total for Buy, or unused if bulk selling)
      units: 'usd' | 'oz', 
      price: number, 
      inventoryItemId?: string,
      storageType?: 'commingled' | 'segregated',
      payoutMethod?: 'balance' | 'wire' | 'ach' | 'check',
      isRecurring: boolean = false,
      frequency?: RecurringFrequency,
      fulfillmentType?: 'storage' | 'delivery',
      deliveryMethod?: 'shipping' | 'pickup',
      bulkItems?: { id: string; qty: number; value: number; name: string; weightOz: number }[]
  ) => {
      if (!userProfile || !user) return;

      try {
          const timestamp = new Date().toISOString();
          
          if (action === 'buy') {
              // ... Existing Buy Logic ...
              const ozAmount = price > 0 ? amount / price : 0;
              
              // Check Balance
              if (userProfile.cashBalance < amount) {
                  alert("Insufficient funds. Please deposit cash.");
                  return;
              }

              // Deduct Cash
              await updateUserBalance(user.id, userProfile.cashBalance - amount);

              // Determine Item Details based on Fulfillment
              let itemName = '';
              let mintName = '';
              let notes = '';

              if (fulfillmentType === 'storage') {
                  mintName = 'Alex Lexington (Vault)';
                  // Segregated gets explicit tag, Commingled gets generic name per requirements
                  if (storageType === 'segregated') {
                      itemName = `${metal.charAt(0).toUpperCase() + metal.slice(1)} (Allocated)`;
                  } else {
                      itemName = `${metal.charAt(0).toUpperCase() + metal.slice(1)}`; 
                  }
                  notes = `Storage: ${storageType || 'Commingled'}`;
              } else {
                  // Physical Delivery
                  itemName = `${metal.charAt(0).toUpperCase() + metal.slice(1)}`; // "Nothing special"
                  mintName = 'Alex Lexington';
                  notes = `Fulfillment: Physical ${deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}`;
              }

              if (isRecurring) {
                  notes += ` | Recurring: ${frequency}`;
              }

              // Add to Inventory (Maroon app internal)
              const newItem: BullionItem = {
                  id: `buy-${Date.now()}`,
                  name: itemName,
                  metalType: metal,
                  form: AssetForm.BAR, // Default form
                  weightAmount: ozAmount,
                  weightUnit: 'oz',
                  quantity: 1,
                  purchasePrice: amount,
                  acquiredAt: timestamp.split('T')[0],
                  purity: '.9999',
                  mint: mintName,
                  notes: notes,
              };
              await addInventoryItem(newItem);

              // Record Transaction (Maroon app internal)
              await addTransaction({
                  id: `tx-${Date.now()}`,
                  type: 'buy' as TransactionType, 
                  metal,
                  itemName: newItem.name,
                  amountOz: ozAmount,
                  pricePerOz: price,
                  totalValue: amount,
                  date: timestamp,
                  status: 'Completed' as TransactionStatus,
                  isRecurring
              });

              // === COMMAND CENTER INTEGRATION ===
              // Create shared transaction (visible in Command Center)
              await createSharedTransaction({
                  type: 'buy',
                  metal: metal,
                  weightOzt: ozAmount,
                  pricePerOzt: price,
                  amount: amount,
                  status: 'completed',
                  fiztradeLockStatus: 'filled',
                  paymentMethod: 'balance'
              });

              // Add to vault holdings if storage type (visible in Command Center)
              if (fulfillmentType === 'storage') {
                  await addVaultHolding({
                      metal: metal as VaultHolding['metal'],
                      weightOzt: ozAmount,
                      costBasis: amount,
                      purchasePricePerOzt: price,
                      currentValue: amount,
                      sourceOrderId: newItem.id,
                      status: 'held'
                  });
              }

          } else {
              // --- Sell Logic (Supports Bulk) ---
              let totalPayout = 0;
              const itemsToProcess = bulkItems || (inventoryItemId ? [{ 
                  id: inventoryItemId, 
                  qty: 1, 
                  value: amount, // For single items, amount is passed as total value
                  name: inventory.find(i => i.id === inventoryItemId)?.name || 'Unknown Item',
                  weightOz: 0 // Not critical for simple single sell fallback
              }] : []);

              for (const sellItem of itemsToProcess) {
                  const item = inventory.find(i => i.id === sellItem.id);
                  if (!item) continue;

                  // Update Inventory
                  if (item.quantity > sellItem.qty) {
                      await updateInventoryItem({ ...item, quantity: item.quantity - sellItem.qty });
                  } else {
                      await deleteInventoryItem(item.id);
                  }

                  // Accumulate Payout
                  totalPayout += sellItem.value;

                  // Record Individual Transaction for History Clarity (Maroon internal)
                  await addTransaction({
                      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      type: 'sell' as TransactionType,
                      metal: item.metalType,
                      itemName: item.name,
                      amountOz: sellItem.weightOz, // This will be passed correctly from bulk logic
                      pricePerOz: price,
                      totalValue: sellItem.value,
                      date: timestamp,
                      status: (payoutMethod === 'balance' ? 'Completed' : 'Pending Funds') as TransactionStatus
                  });

                  // === COMMAND CENTER INTEGRATION ===
                  // Create shared transaction for each sell
                  await createSharedTransaction({
                      type: 'sell',
                      metal: item.metalType,
                      weightOzt: sellItem.weightOz,
                      pricePerOzt: price,
                      amount: sellItem.value,
                      status: payoutMethod === 'balance' ? 'completed' : 'pending_funds',
                      paymentMethod: payoutMethod || 'balance'
                  });
              }

              // Update Balance Once
              if (payoutMethod === 'balance' && totalPayout > 0) {
                  await updateUserBalance(user.id, userProfile.cashBalance + totalPayout);
              }
          }
      } catch (error) {
          console.error("Trade failed:", error);
          alert("Trade execution failed. Please try again.");
      }
  };

  const handleTransfer = async (amount: number, type: 'deposit' | 'withdraw') => {
      if (!userProfile || !user) return;

      try {
          if (type === 'withdraw') {
              // === WITHDRAWAL: Submit to API for staff approval ===
              const result = await requestWithdrawal({
                  customer_id: user.id,
                  amount: amount,
                  speed: 'standard',
                  description: 'Withdrawal request from Maroon app'
              });

              if (result.data?.success) {
                  // Show success message - withdrawal is pending approval
                  alert(`Withdrawal request submitted!\n\n$${amount.toLocaleString()} will be transferred once approved.\nYou'll be notified when processed.`);
              } else {
                  throw new Error('Withdrawal request failed');
              }
          } else {
              // === DEPOSIT: Process locally (Plaid deposit handled separately) ===
              const newBalance = userProfile.cashBalance + amount;
              await updateUserBalance(user.id, newBalance);

              await createSharedTransaction({
                  type: 'deposit',
                  amount: amount,
                  status: 'completed',
                  paymentMethod: 'balance'
              });
          }

          setShowTransferModal(false);
      } catch (error) {
          console.error('Transfer failed:', error);
          alert('Transfer failed. Please try again or contact support.');
      }
  };

  const handleManualAdd = async (item: BullionItem) => {
      await addInventoryItem(item);
      setView('vault');
  };

  const handleManualUpdate = async (item: BullionItem) => {
      await updateInventoryItem(item);
      setView('vault');
  };

  // --- Render ---

  if (view === 'landing' && !user) {
      return (
          <>
            <LandingPage 
                onEnterApp={() => setShowAuthModal(true)} 
                user={user} 
                prices={prices}
            />
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)}
                onRegistrationFlow={setIsRegistrationFlow}
            />
          </>
      );
  }

  // App Shell Layout
  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-navy-900 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-40 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setShowSideMenu(true)}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-navy-900 dark:text-white transition-colors group"
               >
                  <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 transform rotate-45 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:rotate-0 transition-transform duration-300">
                      <span className="font-serif font-bold text-navy-900 text-sm transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">M</span>
                  </div>
               </button>
               <span className="font-serif font-bold text-lg text-navy-900 dark:text-white tracking-tight">Maroon</span>
            </div>

            <div className="flex items-center gap-3">
               <MarketStatus />
               
               {/* Maroon AI Button (Microphone Style) - CONNECTED TO LIVE CHAT */}
               <button
                  onClick={() => openLiveChat()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${showLiveChat ? 'bg-gold-500 text-navy-900 border-gold-500 shadow-lg shadow-gold-500/20' : 'bg-gold-500/10 text-gold-500 border-gold-500/20 hover:bg-gold-500 hover:text-navy-900'} active:scale-95`}
                  aria-label="AI Concierge"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
               </button>
            </div>
         </div>
         {/* Ticker under header */}
         <LiveTicker prices={prices} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-28 pb-32 scroll-smooth">
         {view === 'dashboard' && (
             <Dashboard 
                inventory={inventory}
                transactions={transactions}
                prices={prices}
                cashBalance={userProfile?.cashBalance || 0}
                onTrade={(action, metal) => {
                    setTradeConfig({ action, metal });
                    setShowTradeModal(true);
                }}
                onSelectMetal={(metal) => {
                    setSelectedMetal(metal);
                    setView('market');
                }}
                darkMode={isDarkMode}
                onAction={(action) => {
                    if (action === 'transfer') {
                        setTransferType('deposit');
                        setShowTransferModal(true);
                    } else if (action === 'trade') {
                        setTradeConfig({ action: 'buy', metal: MetalType.GOLD });
                        setShowTradeModal(true);
                    }
                }}
             />
         )}

         {view === 'vault' && (
             <Vault
                inventory={inventory}
                prices={prices}
                onDelete={deleteInventoryItem}
                onEdit={(item) => {
                    setEditingItem(item);
                    setView('add');
                }}
                onSell={(item) => {
                    setTradeConfig({ action: 'sell', metal: item.metalType });
                    setShowTradeModal(true);
                }}
             />
         )}

         {view === 'add' && (
             <AddItem 
                inventory={inventory}
                onAdd={handleManualAdd}
                onUpdate={handleManualUpdate}
                onCancel={() => {
                    setEditingItem(null);
                    setView('vault');
                }}
                initialItem={editingItem}
                autoStartCamera={autoStartCamera}
             />
         )}

         {view === 'market' && (
             <Market 
                prices={prices}
                assets={inventory}
                onTrade={(action, metal) => {
                    setTradeConfig({ action, metal });
                    setShowTradeModal(true);
                }}
                alerts={alerts}
                onAddAlert={addPriceAlert}
                onRemoveAlert={deletePriceAlert}
                selectedMetal={selectedMetal}
                onSelectMetal={(m) => {
                     setSelectedMetal(m);
                     if (!m && view === 'market') {
                         // Optional: Handle deselection logic if any specific cleanup needed
                     }
                }}
             />
         )}
         
         {view === 'explore' && (
             <Explore
                onNavigate={(v) => setView(v)}
                onStartChat={() => openLiveChat()}
             />
         )}

         {view === 'history' && <History inventory={inventory} transactions={transactions} />}
         {view === 'documents' && <Documents files={files} />}
         {view === 'customers' && <AdminCustomers />}
         {view === 'payment-methods' && <PaymentMethods userProfile={userProfile} />}
         
         {/* Maroon Central Command (ERP) */}
         {view === 'landing' && user && (
             <div className="flex flex-col h-full animate-fade-in">
                 <div className="flex justify-center p-4 pb-0 bg-gray-50 dark:bg-navy-900 sticky top-0 z-10">
                    <div className="flex bg-white dark:bg-navy-800 p-1 rounded-xl border border-gray-200 dark:border-navy-700 shadow-sm">
                        <button 
                            onClick={() => setErpTab('risk')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${erpTab === 'risk' ? 'bg-gold-500 text-navy-900 shadow' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
                        >
                            Command Center
                        </button>
                        <button 
                            onClick={() => setErpTab('crm')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${erpTab === 'crm' ? 'bg-gold-500 text-navy-900 shadow' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
                        >
                            Front Office
                        </button>
                        <button 
                            onClick={() => setErpTab('ai')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${erpTab === 'ai' ? 'bg-gold-500 text-navy-900 shadow' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
                        >
                            Intelligence
                        </button>
                    </div>
                 </div>
                 
                 <div className="flex-1">
                    {erpTab === 'risk' && <AdminRisk prices={prices} />}
                    {erpTab === 'crm' && <AdminCustomers />}
                    {erpTab === 'ai' && <AIHub onStartChat={openLiveChat} />}
                 </div>
             </div>
         )}

         {view === 'contact-support' && <ContactSupport userProfile={userProfile} />}
         {view === 'admin-support' && <AdminSupport />}
         {view === 'admin-risk' && <AdminRisk prices={prices} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-navy-900 border-t border-gray-200 dark:border-white/5 pb-4 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
          <div className="flex justify-around items-center h-16">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex flex-col items-center justify-center w-full h-full ${view === 'dashboard' ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
              </button>

              <button 
                onClick={() => setView('market')}
                className={`flex flex-col items-center justify-center w-full h-full ${view === 'market' ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Market</span>
              </button>

              <div className="relative -top-6">
                  <button 
                    onClick={() => setShowActionSheet(true)}
                    className="w-14 h-14 rounded-full bg-gold-500 hover:bg-gold-400 text-navy-900 flex items-center justify-center shadow-lg shadow-gold-500/30 transition-transform active:scale-95"
                  >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
              </div>

              <button 
                onClick={() => setView('vault')}
                className={`flex flex-col items-center justify-center w-full h-full ${view === 'vault' ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Vault</span>
              </button>

              <button 
                onClick={() => setView('landing')}
                className={`flex flex-col items-center justify-center w-full h-full ${view === 'landing' ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 mb-1 ${view === 'landing' ? 'border-gold-500 bg-gold-500 text-navy-900' : 'border-gray-400 text-gray-400'}`}>
                      <span className="font-serif font-bold text-[10px]">M</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Maroon</span>
              </button>
          </div>
      </nav>

      {/* --- Modals & Overlays --- */}

      {/* Action Sheet (Add Menu) */}
      {showActionSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowActionSheet(false)}>
              <div className="w-full bg-white dark:bg-navy-900 rounded-t-3xl p-6 pb-10 animate-slide-up relative" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
                  
                  <div className="space-y-4">
                      {/* 1. Buy Gold & Silver (Primary) */}
                      <button 
                         onClick={() => {
                            setTradeConfig({ action: 'buy', metal: MetalType.GOLD });
                            setShowTradeModal(true);
                            setShowActionSheet(false);
                        }}
                        className="w-full p-4 rounded-2xl bg-gold-500 text-navy-900 flex items-center justify-between shadow-lg shadow-gold-500/20 active:scale-95 transition-transform"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-navy-900/10 flex items-center justify-center">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                            <span className="font-bold text-lg">Buy Gold & Silver</span>
                         </div>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* 2. Sell Assets */}
                      <button
                         onClick={() => {
                            setTradeConfig({ action: 'sell', metal: MetalType.GOLD });
                            setShowTradeModal(true);
                            setShowActionSheet(false);
                        }}
                        className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors group border border-transparent dark:hover:border-navy-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </div>
                            <span className="text-navy-900 dark:text-white font-medium text-lg">Sell Assets</span>
                         </div>
                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* 3. Add to Inventory */}
                      <button
                         onClick={() => {
                            setView('add');
                            setEditingItem(null);
                            setAutoStartCamera(false);
                            setShowActionSheet(false);
                        }}
                        className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors group border border-transparent dark:hover:border-navy-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <span className="text-navy-900 dark:text-white font-medium text-lg">Add to Inventory</span>
                         </div>
                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* 4. Scan Coin / Invoice */}
                      <button
                         onClick={() => {
                            setView('add');
                            setEditingItem(null);
                            setAutoStartCamera(true);
                            setShowActionSheet(false);
                        }}
                        className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors group border border-transparent dark:hover:border-navy-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="text-navy-900 dark:text-white font-medium text-lg">Scan Coin / Invoice</span>
                         </div>
                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* 5. Transfer Group */}
                      <div className="bg-navy-800 rounded-2xl overflow-hidden mt-4">
                          <button
                             onClick={() => {
                                setTransferType('deposit');
                                setShowTransferModal(true);
                                setShowActionSheet(false);
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-navy-700 transition-colors group border-b border-navy-700"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-green-500">
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                </div>
                                <span className="text-white font-medium text-lg">Deposit Funds</span>
                             </div>
                             <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>

                          <button
                             onClick={() => {
                                setTransferType('withdraw');
                                setShowTransferModal(true);
                                setShowActionSheet(false);
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-navy-700 transition-colors group"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-gray-400">
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </div>
                                <span className="text-white font-medium text-lg">Withdraw Funds</span>
                             </div>
                             <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Side Menu */}
      <SideMenu 
        isOpen={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onNavigate={(v) => {
            setView(v);
            setShowSideMenu(false);
        }}
      />

      {/* Live Chat Overlay */}
      {showLiveChat && (
        <LiveChat
            onClose={closeLiveChat}
            inventory={inventory}
            prices={prices}
            initialPrompt={liveChatPrompt}
        />
      )}

      {/* Trade Modal */}
      <TradeModal 
         isOpen={showTradeModal}
         onClose={() => setShowTradeModal(false)}
         initialAction={tradeConfig.action}
         initialMetal={tradeConfig.metal}
         prices={prices}
         inventory={inventory}
         userProfile={userProfile}
         onTrade={handleTrade}
         onRedirectToAdd={() => {
             setView('add');
             setShowTradeModal(false);
         }}
      />

      {/* Transfer Modal */}
      <TransferModal 
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          type={transferType}
          availableBalance={userProfile?.cashBalance}
          userProfile={userProfile}
          onConfirm={handleTransfer}
      />

    </div>
  );
}
