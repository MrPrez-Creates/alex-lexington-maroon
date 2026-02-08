
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import {
  fetchLiveSpotPrices
} from './services/marketData';
import { logoutUser } from './services/authService';
import {
  getCustomerHoldings,
  getCustomerHoldingsByFirebaseUid,
  getCustomerOrderHistory,
  getClientVaultHoldings,
  VaultHolding as ApiVaultHolding,
  PhysicalVaultHolding,
  requestWithdrawal
} from './services/apiClient';
import { resolveCustomerId } from './services/apiService';
import type { SharedCustomer } from './types';
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
import FundingWallet from './components/FundingWallet';
import FundAccountScreen from './components/FundAccountScreen';
import MaverickIntro, { useMaverickIntro } from './components/MaverickIntro';
import BalanceCheckout, { CheckoutSuccess } from './components/BalanceCheckout';

export default function App() {
  // Auth State (Now using Supabase)
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Customer link state (Step 2: auth -> customer record)
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [apiCustomer, setApiCustomer] = useState<SharedCustomer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('maroon-dark-mode');
    return saved !== null ? saved === 'true' : true; // Default to dark
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showMaverickIntro, setShowMaverickIntro] = useState(false);
  const [liveChatPrompt, setLiveChatPrompt] = useState<string | undefined>(undefined);

  // Maverick intro state
  const { hasSeenIntro: hasSeenMaverickIntro, markAsSeen: markMaverickIntroSeen } = useMaverickIntro();
  
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

  // Checkout State
  const [checkoutConfig, setCheckoutConfig] = useState<{
    orderId: string;
    orderTotal: number;
    orderItems: Array<{ name: string; quantity: number; price: number; weight_ozt?: number; metal?: string }>;
  } | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<{
    order_id: string;
    transaction_id?: string;
    amount?: number;
  } | null>(null);

  // --- Helpers ---

  // Map API metal codes (GOLD, SILV, PLAT, PALL) to app metal types (gold, silver, platinum, palladium)
  const mapMetalCode = (code: string): string => {
    const map: Record<string, string> = {
      GOLD: 'gold', SILV: 'silver', PLAT: 'platinum', PALL: 'palladium',
      gold: 'gold', silver: 'silver', platinum: 'platinum', palladium: 'palladium',
    };
    return map[code] || code.toLowerCase();
  };

  // Map order status to Transaction status
  const mapOrderStatus = (status: string): TransactionStatus => {
    switch (status) {
      case 'delivered': case 'paid': return TransactionStatus.COMPLETED;
      case 'shipped': case 'processing': return TransactionStatus.PENDING_RECEIPT;
      default: return TransactionStatus.PENDING_FUNDS;
    }
  };

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
        setCustomerId(null);
        setApiCustomer(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [view, isRegistrationFlow]);

  // 1b. Resolve authenticated user -> Command Center customer record
  useEffect(() => {
    if (!user) {
      setCustomerId(null);
      setApiCustomer(null);
      return;
    }

    let cancelled = false;
    setCustomerLoading(true);

    resolveCustomerId().then(({ customerId: cid, customer }) => {
      if (cancelled) return;
      setCustomerId(cid);
      setApiCustomer(customer);
      setCustomerLoading(false);
      if (cid) {
        console.log(`[Maroon] Linked to customer ${cid}`, customer?.name);
      } else {
        console.warn('[Maroon] Could not resolve customer record');
      }
    }).catch((err) => {
      if (cancelled) return;
      console.error('[Maroon] Customer resolution failed:', err);
      setCustomerLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  // 2. Build user profile from API customer data (replaces Firebase subscription)
  useEffect(() => {
      if (!user) {
          setUserProfile(null);
          return;
      }
      if (apiCustomer) {
          setUserProfile({
              uid: user.id,
              email: apiCustomer.email || user.email || '',
              name: apiCustomer.name || user.user_metadata?.full_name || '',
              photoURL: user.user_metadata?.avatar_url || null,
              phoneNumber: apiCustomer.phone || '',
              kycStatus: apiCustomer.kycStatus || 'unverified',
              cashBalance: apiCustomer.cashBalance || 0,
              settings: { darkMode: isDarkMode, currency: 'USD' },
              createdAt: apiCustomer.createdAt || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              billingAddress: {},
              paymentMethods: [],
          } as UserProfile);
      }
  }, [user, apiCustomer]);

  // 3. Data from API (replaces Firebase subscriptions when customerId is available)
  useEffect(() => {
      if (!user) return;
      if (customerLoading) return;

      // If we have a customerId, fetch real data from Command Center API
      if (customerId) {
          let cancelled = false;

          const fetchAllData = async () => {
              try {
                  // Fetch all three in parallel
                  const [webHoldingsRes, physicalHoldingsRes, ordersRes] = await Promise.all([
                      getCustomerHoldings(customerId, true),
                      getClientVaultHoldings(customerId),
                      getCustomerOrderHistory(customerId, { limit: 50 }),
                  ]);

                  if (cancelled) return;

                  // --- Map web order holdings (purchases from Shopify/WooCommerce) ---
                  const webItems: BullionItem[] = [];
                  if (webHoldingsRes.data?.holdings) {
                      webHoldingsRes.data.holdings.forEach((h: ApiVaultHolding) => {
                          webItems.push({
                              id: `web-${h.holding_id}`,
                              name: h.name || h.description || `${h.metal_name} (Order #${h.order_number})`,
                              metalType: mapMetalCode(h.metal_code),
                              weightAmount: h.weight_ozt,
                              weightUnit: 'oz',
                              quantity: h.quantity,
                              purchasePrice: h.cost_basis,
                              currentValue: h.current_value,
                              acquiredAt: h.purchased_at ? h.purchased_at.split('T')[0] : '',
                              form: h.weight_category || AssetForm.BAR,
                              purity: '.9999',
                              mint: 'Alex Lexington (Vault)',
                              notes: `Order #${h.order_number} | Status: ${h.status}`,
                              sku: h.sku || undefined,
                          });
                      });
                  }

                  // --- Map physical vault holdings (items stored with AL) ---
                  const physicalItems: BullionItem[] = [];
                  if (physicalHoldingsRes.data?.holdings) {
                      physicalHoldingsRes.data.holdings.forEach((h: PhysicalVaultHolding) => {
                          if (h.status !== 'held') return;
                          const metalCode = (h.metals?.code || 'GOLD');
                          physicalItems.push({
                              id: `vault-${h.holding_id}`,
                              name: h.products?.name || h.description || `${h.metals?.name || 'Metal'} (Vault)`,
                              metalType: mapMetalCode(metalCode),
                              weightAmount: h.weight_ozt,
                              weightUnit: 'oz',
                              quantity: h.quantity || 1,
                              purchasePrice: h.cost_basis || 0,
                              currentValue: h.computed_current_value,
                              acquiredAt: h.deposited_at ? h.deposited_at.split('T')[0] : '',
                              form: AssetForm.BAR,
                              purity: '.9999',
                              mint: 'Alex Lexington (Vault)',
                              notes: `Physical Vault | ${h.bag_tag ? `Bag: ${h.bag_tag}` : 'Commingled'}`,
                              sku: h.products?.sku || undefined,
                          });
                      });
                  }

                  if (!cancelled) {
                      // Combine web + physical holdings, deduped
                      const allItems = [...webItems, ...physicalItems];
                      setLocalInventory(allItems);
                      setApiHoldings([]); // Clear separate apiHoldings since everything is now in localInventory
                  }

                  // --- Map orders to Transaction format ---
                  if (ordersRes.data && !cancelled) {
                      const txs: Transaction[] = ordersRes.data.map((order: any) => {
                          const items = order.web_order_items || [];
                          const firstItem = items[0];
                          const metalName = firstItem?.metals?.name || firstItem?.description || 'Order';
                          const totalOzt = items.reduce((sum: number, i: any) => sum + parseFloat(i.weight_ozt || 0) * (i.quantity || 1), 0);
                          const total = parseFloat(order.total || 0);

                          return {
                              id: `order-${order.order_id}`,
                              type: 'buy' as TransactionType,
                              metal: mapMetalCode(firstItem?.metals?.code || ''),
                              itemName: items.length === 1 ? metalName : `${items.length} items`,
                              amountOz: totalOzt,
                              pricePerOz: totalOzt > 0 ? total / totalOzt : 0,
                              totalValue: total,
                              date: order.ordered_at || order.created_at,
                              status: mapOrderStatus(order.status),
                          } as Transaction;
                      });
                      setTransactions(txs);
                  }

              } catch (error) {
                  console.error('[Maroon] Failed to fetch API data:', error);
              }
          };

          fetchAllData();
          const interval = setInterval(fetchAllData, 60000);
          return () => { cancelled = true; clearInterval(interval); };
      }

      // No customerId yet — data will show as empty until customer resolves
  }, [user, customerId, customerLoading]);

  // 3b. Alerts & files - managed locally (Firebase removed)
  // Price alerts are client-side only; documents coming soon

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
      localStorage.setItem('maroon-dark-mode', String(newVal));
  };

  // Open LiveChat with optional initial prompt
  // Shows Maverick intro first if user hasn't seen it
  const openLiveChat = (initialPrompt?: string) => {
      setLiveChatPrompt(initialPrompt);
      if (!hasSeenMaverickIntro) {
          setShowMaverickIntro(true);
      } else {
          setShowLiveChat(true);
      }
  };

  // Handle Maverick intro completion
  const handleMaverickIntroComplete = () => {
      markMaverickIntroSeen();
      setShowMaverickIntro(false);
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
          // Log the trade order — will be processed through the Command Center
          // The FizTrade API endpoints exist but full checkout flow needs balance integration
          console.log(`[Trade Order] ${action.toUpperCase()} ${metal}`, {
              amount, units, price, storageType, fulfillmentType, deliveryMethod,
              isRecurring, frequency, bulkItems,
              timestamp: new Date().toISOString(),
          });
          // Success confirmation is shown by the TradeModal's success step
      } catch (error) {
          console.error("Trade failed:", error);
      }
  };

  const handleTransfer = async (amount: number, type: 'deposit' | 'withdraw') => {
      if (!userProfile || !user) return;

      try {
          if (type === 'withdraw') {
              // === WITHDRAWAL: Submit to API for staff approval ===
              const result = await requestWithdrawal({
                  customer_id: customerId || user.id,
                  amount: amount,
                  speed: 'standard',
                  description: 'Withdrawal request from Maroon app'
              });

              if (result.data?.success) {
                  alert(`Withdrawal request submitted!\n\n$${amount.toLocaleString()} will be transferred once approved.\nYou'll be notified when processed.`);
              } else {
                  throw new Error('Withdrawal request failed');
              }
          } else {
              // === DEPOSIT: Handled via Fund Account / Plaid ===
              alert('To deposit funds, use the Fund Account option in your Wallet to initiate a wire transfer.');
          }

          setShowTransferModal(false);
      } catch (error) {
          console.error('Transfer failed:', error);
          alert('Transfer failed. Please try again or contact support.');
      }
  };

  const handleManualAdd = async (_item: BullionItem) => {
      // Manual inventory add removed (data comes from API now)
      setView('vault');
  };

  const handleManualUpdate = async (_item: BullionItem) => {
      // Manual inventory update removed (data comes from API now)
      setView('vault');
  };

  // --- Render ---

  if (view === 'landing' && !user) {
      return (
          <>
            <LandingPage
                onEnterApp={() => setShowAuthModal(true)}
                onActivateAI={() => {
                  setShowAuthModal(true);
                }}
                user={user}
                prices={prices}
                inventory={inventory}
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
                cashBalance={apiCustomer?.cashBalance ?? userProfile?.cashBalance ?? 0}
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
                onDelete={(_id: string) => { /* Vault items managed via API */ }}
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

         {view === 'wallet' && (
             <FundingWallet
                customerId={customerId ? parseInt(customerId) : 0}
                onFundingComplete={() => setView('dashboard')}
                onNavigateToFundAccount={() => setView('fund-account')}
             />
         )}

         {view === 'fund-account' && (
             <FundAccountScreen
                customerId={customerId || '0'}
                onBack={() => setView('wallet')}
                onLinkBank={() => setView('wallet')}
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
                onAddAlert={(alert: PriceAlert) => setAlerts(prev => [...prev, alert])}
                onRemoveAlert={(id: string) => setAlerts(prev => prev.filter(a => a.id !== id))}
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
         {view === 'documents' && <Documents />}
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

         {view === 'checkout' && checkoutConfig && (
           <div className="max-w-lg mx-auto px-4 py-6">
             <BalanceCheckout
               orderId={checkoutConfig.orderId}
               customerId={customerId || '0'}
               orderTotal={checkoutConfig.orderTotal}
               orderDetails={{
                 items: checkoutConfig.orderItems.map(i => ({
                   name: i.name,
                   quantity: i.quantity,
                   weight_ozt: i.weight_ozt || 0,
                   price: i.price,
                 })),
                 fulfillment: 'vault',
               }}
               onSuccess={(result) => {
                 setCheckoutResult({ ...result, amount: checkoutConfig.orderTotal });
                 setCheckoutConfig(null);
               }}
               onCancel={() => {
                 setCheckoutConfig(null);
                 setView('dashboard');
               }}
               onFundAccount={() => setView('fund-account')}
             />
           </div>
         )}

         {/* Checkout Success Overlay */}
         {checkoutResult && (
           <CheckoutSuccess
             orderNumber={checkoutResult.order_id}
             amount={checkoutResult.amount || 0}
             fulfillment="vault"
             onClose={() => {
               setCheckoutResult(null);
               setView('dashboard');
             }}
           />
         )}
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
                onClick={() => setView('wallet')}
                className={`flex flex-col items-center justify-center w-full h-full ${view === 'wallet' ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Wallet</span>
              </button>

              <button
                onClick={() => setView('vault')}
                className={`flex flex-col items-center justify-center w-full h-full ${view === 'vault' ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Vault</span>
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

      {/* Maverick AI Intro (First-time users) */}
      {showMaverickIntro && (
        <MaverickIntro
            onComplete={handleMaverickIntroComplete}
            customerName={apiCustomer?.name || userProfile?.name}
        />
      )}

      {/* Live Chat Overlay - Maverick AI Concierge */}
      {showLiveChat && (
        <LiveChat
            onClose={closeLiveChat}
            inventory={inventory}
            prices={prices}
            initialPrompt={liveChatPrompt}
            customerContext={{
              customerId: customerId || undefined,
              alAccountNumber: apiCustomer?.alAccountNumber || undefined,
              name: apiCustomer?.name || userProfile?.name || undefined,
              fundingBalance: apiCustomer?.fundingBalance || 0,
              cashBalance: apiCustomer?.cashBalance || 0,
              pendingDeposits: apiCustomer?.pendingDeposits || 0,
            }}
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
          availableBalance={apiCustomer?.cashBalance ?? userProfile?.cashBalance}
          userProfile={userProfile}
          onConfirm={handleTransfer}
      />

    </div>
  );
}
