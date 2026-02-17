import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SpotPrices, MetalType } from '../types';
import { calculateFiztradeBuyPrice, FIZTRADE_MARKUPS, FulfillmentType } from '../utils/pricing';
import {
  getMarketStatus,
  getProductsByMetal,
  getProductPrice,
  lockPrices,
  executeTrade,
  saveQuote,
  getPendingQuotes,
  executeQuote,
  isConfigured,
  FizTradeMarketStatus,
  FizTradeProduct,
  LockPricesResult,
  LockPriceItem,
  ExecuteTradeResult,
  FizTradeQuote,
  QuoteItem,
} from '../services/fiztradeService';
import { getCustomers } from '../services/apiClient';

// ============================================
// TYPES
// ============================================

interface FizTradeHubProps {
  prices: SpotPrices;
  onCheckout?: (items: Array<{
    sku: string;
    description: string;
    metal_type: string;
    weight_ozt: number;
    quantity: number;
    unit_price: number;
    extended_price: number;
    spot_at_order?: number;
  }>) => void;
}

interface InvoiceLineItem {
  sku: string;
  description: string;
  metalType: string;
  weight: number;
  weightUnit: string;
  quantity: number;
  fiztradeAskPrice: number;
  alMarkupPercent: number;
  alMarkupAmount: number;
  retailPrice: number;
  lineTotal: number;
}

interface CustomerOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

type SubView = 'browse' | 'invoice' | 'quotes';

// ============================================
// AVAILABILITY HELPERS
// ============================================

// FizTrade availability values from Dillon Gage:
// Live, 1-5 Days, 6-15 Days, 16-30 Days, Unknown Delay, Not Available, Limited Quantity
type AvailabilityLevel = 'live' | 'short' | 'medium' | 'long' | 'limited' | 'unknown_delay' | 'not_available' | 'ask_off';

function getAvailabilityLevel(product: FizTradeProduct): AvailabilityLevel {
  // Ask OFF = cannot purchase at all, regardless of availability
  if (product.isActiveSell !== 'Y') return 'ask_off';

  const avail = (product.availability || '').toLowerCase().trim();
  if (avail === 'live') return 'live';
  if (avail === '1-5 days') return 'short';
  if (avail === '6-15 days') return 'medium';
  if (avail === '16-30 days') return 'long';
  if (avail.includes('limited')) return 'limited';
  if (avail.includes('unknown') || avail.includes('delay')) return 'unknown_delay';
  if (avail.includes('not available')) return 'not_available';
  return 'not_available';
}

function canLockProduct(product: FizTradeProduct): boolean {
  const level = getAvailabilityLevel(product);
  // Can lock: live, short delay, medium delay, long delay, limited quantity
  // Cannot lock: ask_off, unknown_delay, not_available
  return !['ask_off', 'unknown_delay', 'not_available'].includes(level);
}

function getAvailabilityBadge(product: FizTradeProduct): { label: string; color: string; bgColor: string } {
  const level = getAvailabilityLevel(product);
  switch (level) {
    case 'live':
      return { label: 'Live', color: 'text-green-400', bgColor: 'bg-green-500/10' };
    case 'short':
      return { label: '1-5 Days', color: 'text-green-300', bgColor: 'bg-green-500/10' };
    case 'medium':
      return { label: '6-15 Days', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    case 'long':
      return { label: '16-30 Days', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    case 'limited':
      return { label: 'Limited Qty', color: 'text-yellow-300', bgColor: 'bg-yellow-500/10' };
    case 'unknown_delay':
      return { label: 'Unknown Delay', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    case 'not_available':
      return { label: 'Not Available', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    case 'ask_off':
      return { label: 'Ask OFF', color: 'text-red-500', bgColor: 'bg-red-500/20' };
  }
}

// ============================================
// CATEGORY EXTRACTION
// ============================================

// Parse product descriptions into categories for grouped browsing
// e.g. "1 OZ AMERICAN GOLD EAGLE SCRUFFY" → category "American Eagle"
// e.g. "100 OZ SILVER BAR" → category "Bars"
// e.g. "1 OZ CANADIAN SILVER MAPLE LEAF" → category "Canadian Maple Leaf"

function extractProductCategory(description: string): string {
  const d = description.toUpperCase();

  // Coins
  if (d.includes('EAGLE') && d.includes('AMERICAN')) return 'American Eagle';
  if (d.includes('BUFFALO') && d.includes('AMERICAN')) return 'American Buffalo';
  if (d.includes('MAPLE') && d.includes('CANADIAN')) return 'Canadian Maple Leaf';
  if (d.includes('KRUGERRAND')) return 'Krugerrand';
  if (d.includes('PHILHARMONIC')) return 'Philharmonic';
  if (d.includes('BRITANNIA')) return 'Britannia';
  if (d.includes('PANDA')) return 'Chinese Panda';
  if (d.includes('LIBERTAD')) return 'Libertad';
  if (d.includes('KANGAROO') || d.includes('NUGGET')) return 'Australian Kangaroo';
  if (d.includes('KOOKABURRA')) return 'Australian Kookaburra';
  if (d.includes('KOALA')) return 'Australian Koala';

  // Bars
  if (d.includes('BAR')) return 'Bars';

  // Rounds
  if (d.includes('ROUND')) return 'Rounds';

  // Generic coins / other
  if (d.includes('COIN')) return 'Coins';
  if (d.includes('JUNK') || d.includes('90%') || d.includes('40%')) return 'Junk Silver';

  return 'Other';
}

interface ProductCategory {
  name: string;
  products: FizTradeProduct[];
}

function groupProductsByCategory(products: FizTradeProduct[]): ProductCategory[] {
  const categoryMap = new Map<string, FizTradeProduct[]>();

  for (const product of products) {
    const cat = extractProductCategory(product.description);
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat)!.push(product);
  }

  // Sort: categories with available products first, then alphabetically
  return Array.from(categoryMap.entries())
    .map(([name, prods]) => ({ name, products: prods }))
    .sort((a, b) => {
      const aHasAvail = a.products.some(p => canLockProduct(p));
      const bHasAvail = b.products.some(p => canLockProduct(p));
      if (aHasAvail && !bHasAvail) return -1;
      if (!aHasAvail && bHasAvail) return 1;
      return a.name.localeCompare(b.name);
    });
}

// ============================================
// COMPONENT
// ============================================

const FizTradeHub: React.FC<FizTradeHubProps> = ({ prices, onCheckout }) => {
  // --- Sub-view navigation ---
  const [activeView, setActiveView] = useState<SubView>('browse');

  // --- Market status ---
  const [marketStatus, setMarketStatus] = useState<FizTradeMarketStatus>({ isOpen: false, message: 'Checking...' });
  const [marketLoading, setMarketLoading] = useState(true);

  // --- Product browsing ---
  const [selectedMetal, setSelectedMetal] = useState<string>('gold');
  const [products, setProducts] = useState<FizTradeProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // --- Invoice / Cart ---
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('storage');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [shipToAddress, setShipToAddress] = useState({
    name: '', address1: '', address2: '', city: '', state: '', postalCode: '', phone: '',
  });

  // --- Quote management ---
  const [pendingQuotes, setPendingQuotes] = useState<FizTradeQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  // --- Lock / Execute state ---
  const [lockData, setLockData] = useState<LockPricesResult | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [isLocking, setIsLocking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tradeResult, setTradeResult] = useState<ExecuteTradeResult | null>(null);
  const [quoteExecuteResult, setQuoteExecuteResult] = useState<{ quoteRef: string; confirmationNumber: string } | null>(null);

  // --- Feedback ---
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);

  // --- Category browsing ---
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showUnavailable, setShowUnavailable] = useState(false);

  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const configured = isConfigured();

  // ============================================
  // EFFECTS
  // ============================================

  // Check market status on mount and every 60s
  useEffect(() => {
    if (!configured) return;
    const fetchStatus = async () => {
      try {
        setMarketLoading(true);
        const status = await getMarketStatus();
        setMarketStatus(status);
      } catch {
        setMarketStatus({ isOpen: false, message: 'Unable to check market status' });
      } finally {
        setMarketLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [configured]);

  // Fetch products when metal changes
  useEffect(() => {
    if (!configured) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      setError(null);
      try {
        const prods = await getProductsByMetal(selectedMetal);
        setProducts(prods);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [selectedMetal, configured]);

  // Fetch customers for the customer selector
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await getCustomers({ limit: 200 });
        const options: CustomerOption[] = (res.data || []).map((c: any) => ({
          id: c.id || c.customer_id,
          name: [c.contact_info?.first_names?.[0], c.contact_info?.last_names?.[0]].filter(Boolean).join(' ') || c.name || 'Unknown',
          email: c.contact_info?.emails?.[0] || c.email,
          phone: c.contact_info?.phones?.[0] || c.phone,
        }));
        setCustomerOptions(options);
      } catch {
        // Non-critical — customer list may not be available
      }
    };
    fetchCustomers();
  }, []);

  // Lock countdown timer
  useEffect(() => {
    if (lockCountdown <= 0 && lockTimerRef.current) {
      clearInterval(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, [lockCountdown]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ============================================
  // COMPUTED
  // ============================================

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      filtered = products.filter(p =>
        p.description.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q)
      );
    }
    // Optionally hide unavailable products
    if (!showUnavailable) {
      filtered = filtered.filter(p => canLockProduct(p));
    }
    return filtered;
  }, [products, productSearch, showUnavailable]);

  const productCategories = useMemo(() => {
    return groupProductsByCategory(filteredProducts);
  }, [filteredProducts]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customerOptions.slice(0, 20);
    const q = customerSearch.toLowerCase();
    return customerOptions.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    ).slice(0, 20);
  }, [customerOptions, customerSearch]);

  const invoiceTotals = useMemo(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.fiztradeAskPrice * item.quantity, 0);
    const markupTotal = invoiceItems.reduce((sum, item) => sum + item.alMarkupAmount * item.quantity, 0);
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
    return { subtotal, markupTotal, grandTotal };
  }, [invoiceItems]);

  // ============================================
  // HANDLERS
  // ============================================

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const addToInvoice = useCallback((product: FizTradeProduct) => {
    clearMessages();

    // Check if product can actually be locked/purchased
    if (!canLockProduct(product)) {
      const badge = getAvailabilityBadge(product);
      setError(`${product.description} cannot be purchased — ${badge.label}`);
      return;
    }

    const askPrice = product.askPrice || 0;
    if (askPrice <= 0) {
      setError(`${product.productCode} has no available ask price`);
      return;
    }

    // Check if already in invoice
    const existing = invoiceItems.find(i => i.sku === product.productCode);
    if (existing) {
      setInvoiceItems(prev => prev.map(item =>
        item.sku === product.productCode
          ? { ...item, quantity: item.quantity + 1, lineTotal: item.retailPrice * (item.quantity + 1) }
          : item
      ));
      return;
    }

    const metal = product.metalType?.toLowerCase() || selectedMetal;
    const { pricePerOz, markupPercent, markupAmount } = calculateFiztradeBuyPrice(askPrice, metal, fulfillmentType);

    const newItem: InvoiceLineItem = {
      sku: product.productCode,
      description: product.description,
      metalType: metal,
      weight: product.weight,
      weightUnit: product.weightUnit || 'oz',
      quantity: 1,
      fiztradeAskPrice: askPrice,
      alMarkupPercent: markupPercent,
      alMarkupAmount: markupAmount,
      retailPrice: pricePerOz,
      lineTotal: pricePerOz,
    };

    setInvoiceItems(prev => [...prev, newItem]);

    // Auto-switch to invoice view if first item
    if (invoiceItems.length === 0) {
      setActiveView('invoice');
    }
  }, [invoiceItems, selectedMetal, fulfillmentType]);

  const updateItemQty = (sku: string, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.sku !== sku) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty, lineTotal: item.retailPrice * newQty };
    }));
  };

  const removeItem = (sku: string) => {
    setInvoiceItems(prev => prev.filter(item => item.sku !== sku));
  };

  const clearInvoice = () => {
    setInvoiceItems([]);
    setSelectedCustomer(null);
    setInvoiceNotes('');
    setShipToAddress({ name: '', address1: '', address2: '', city: '', state: '', postalCode: '', phone: '' });
    clearMessages();
  };

  // Recalculate markups when fulfillment type changes
  const handleFulfillmentChange = (type: FulfillmentType) => {
    setFulfillmentType(type);
    setInvoiceItems(prev => prev.map(item => {
      const { pricePerOz, markupPercent, markupAmount } = calculateFiztradeBuyPrice(
        item.fiztradeAskPrice, item.metalType, type
      );
      return {
        ...item,
        alMarkupPercent: markupPercent,
        alMarkupAmount: markupAmount,
        retailPrice: pricePerOz,
        lineTotal: pricePerOz * item.quantity,
      };
    }));
  };

  const refreshProducts = async () => {
    setProductsLoading(true);
    setError(null);
    try {
      const prods = await getProductsByMetal(selectedMetal);
      setProducts(prods);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh products');
    } finally {
      setProductsLoading(false);
    }
  };

  // --- Save Quote ---
  const handleSaveQuote = async () => {
    if (invoiceItems.length === 0) return;
    if (!selectedCustomer) {
      setError('Select a customer before saving the quote');
      return;
    }

    clearMessages();
    setSavingQuote(true);
    try {
      const quoteItems: QuoteItem[] = invoiceItems.map(item => ({
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.fiztradeAskPrice,
        markup: item.alMarkupAmount * item.quantity,
        retailPrice: item.retailPrice,
      }));

      const quote = await saveQuote({
        customerId: selectedCustomer ? parseInt(selectedCustomer.id) : undefined,
        customerName: selectedCustomer?.name || 'Walk-in',
        customerEmail: selectedCustomer?.email,
        customerPhone: selectedCustomer?.phone,
        items: quoteItems,
        subtotal: invoiceTotals.subtotal,
        markup: invoiceTotals.markupTotal,
        total: invoiceTotals.grandTotal,
        notes: invoiceNotes || undefined,
      });

      setSuccessMsg(`Quote saved: ${quote.quote_ref}`);
      clearInvoice();
      // Refresh quotes list
      fetchQuotes();
    } catch (err: any) {
      setError(err.message || 'Failed to save quote');
    } finally {
      setSavingQuote(false);
    }
  };

  // --- Lock & Execute Now ---
  const handleLockPrices = async () => {
    if (invoiceItems.length === 0) return;
    if (!marketStatus.isOpen) {
      setError('Market is closed. Save as a quote instead.');
      return;
    }
    if (fulfillmentType === 'ship_to_us') {
      const { name, address1, city, state, postalCode } = shipToAddress;
      if (!name || !address1 || !city || !state || !postalCode) {
        setError('Please fill in all required shipping address fields before locking prices.');
        return;
      }
    }

    clearMessages();
    setIsLocking(true);

    // Pre-check availability for each SKU
    try {
      for (const item of invoiceItems) {
        const priceInfo = await getProductPrice(item.sku);
        if (!priceInfo.isActiveSell) {
          setError(`${item.sku} (${item.description}) is no longer available. Remove it and try again.`);
          setIsLocking(false);
          return;
        }
      }
    } catch (err: any) {
      setError(`Availability check failed: ${err.message}`);
      setIsLocking(false);
      return;
    }

    try {
      const txId = `AL-${Date.now()}`;
      const items = invoiceItems.map(item => ({
        code: item.sku,
        qty: String(item.quantity),
        transactionType: 'buy' as const,
      }));

      const result = await lockPrices(txId, items);
      setLockData(result);
      setLockCountdown(20);

      // Start countdown
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
      lockTimerRef.current = setInterval(() => {
        setLockCountdown(prev => {
          if (prev <= 1) {
            if (lockTimerRef.current) clearInterval(lockTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to lock prices');
    } finally {
      setIsLocking(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!lockData) return;
    if (lockCountdown <= 0) {
      setError('Lock expired. Re-lock prices to try again.');
      return;
    }

    // Validate shipping address for ship_to_us
    if (fulfillmentType === 'ship_to_us') {
      const { name, address1, city, state, postalCode } = shipToAddress;
      if (!name || !address1 || !city || !state || !postalCode) {
        setError('Please fill in all required shipping address fields before executing.');
        return;
      }
    }

    clearMessages();
    setIsExecuting(true);
    try {
      const shippingOption = fulfillmentType === 'ship_to_us' ? 'drop_ship' as const : 'hold' as const;
      const result = await executeTrade({
        transactionId: lockData.transactionId,
        lockToken: lockData.lockToken,
        referenceNumber: lockData.transactionId,
        shippingOption,
        ...(fulfillmentType === 'ship_to_us' && {
          dropShipInfo: {
            name: shipToAddress.name,
            address1: shipToAddress.address1,
            address2: shipToAddress.address2 || undefined,
            city: shipToAddress.city,
            state: shipToAddress.state,
            postalCode: shipToAddress.postalCode,
            phone: shipToAddress.phone || undefined,
          },
        }),
      });

      setTradeResult(result);
      setLockData(null);
      setLockCountdown(0);
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);

      if (result.bustedItems && result.bustedItems.length > 0) {
        setError(`Partial fill — busted items: ${result.bustedItems.join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Trade execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const cancelLock = () => {
    setLockData(null);
    setLockCountdown(0);
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
  };

  // --- Quote Management ---
  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try {
      const quotes = await getPendingQuotes();
      setPendingQuotes(quotes);
    } catch {
      // Non-critical
    } finally {
      setQuotesLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'quotes' && configured) {
      fetchQuotes();
    }
  }, [activeView, configured]);

  const handleExecuteQuote = async (quoteId: string) => {
    if (!marketStatus.isOpen) {
      setError('Market is closed. Cannot execute quotes right now.');
      return;
    }

    // Validate shipping address for ship_to_us
    if (fulfillmentType === 'ship_to_us') {
      const { name, address1, city, state, postalCode } = shipToAddress;
      if (!name || !address1 || !city || !state || !postalCode) {
        setError('Please fill in all required shipping address fields before executing.');
        return;
      }
    }

    clearMessages();
    setIsExecuting(true);
    try {
      const shippingOption = fulfillmentType === 'ship_to_us' ? 'drop_ship' as const : 'hold' as const;
      const result = await executeQuote(quoteId, {
        shippingOption,
        ...(fulfillmentType === 'ship_to_us' && {
          dropShipInfo: {
            name: shipToAddress.name,
            address1: shipToAddress.address1,
            city: shipToAddress.city,
            state: shipToAddress.state,
            postalCode: shipToAddress.postalCode,
            phone: shipToAddress.phone || undefined,
          },
        }),
      });
      setQuoteExecuteResult({
        quoteRef: result.quoteRef,
        confirmationNumber: result.confirmationNumber,
      });
      setSuccessMsg(`Quote ${result.quoteRef} executed! Confirmation: ${result.confirmationNumber}`);
      fetchQuotes();
    } catch (err: any) {
      setError(err.message || 'Quote execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-serif text-white mb-2">FizTrade Not Configured</h3>
        <p className="text-sm text-gray-400 text-center max-w-md">
          Set <code className="text-gold-500 text-xs bg-navy-900 px-1.5 py-0.5 rounded">VITE_FIZTRADE_API_URL</code> in your .env file to connect to the FizTrade Trading Worker.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 space-y-4 animate-fade-in pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-900 dark:text-white tracking-tight">FizTrade Trading Desk</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Dillon Gage Integration</p>
        </div>

        {/* Market Status Pill */}
        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
          marketLoading
            ? 'bg-navy-800 border-white/10'
            : marketStatus.isOpen
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            marketLoading ? 'bg-gray-500 animate-pulse' : marketStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${
            marketLoading ? 'text-gray-400' : marketStatus.isOpen ? 'text-green-400' : 'text-red-400'
          }`}>
            {marketLoading ? 'Checking...' : marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
          </span>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex bg-white dark:bg-navy-800 p-1 rounded-xl border border-gray-200 dark:border-navy-700 shadow-sm self-start">
        {([
          { key: 'browse', label: 'Browse Products' },
          { key: 'invoice', label: `Invoice${invoiceItems.length > 0 ? ` (${invoiceItems.length})` : ''}` },
          { key: 'quotes', label: 'Pending Quotes' },
        ] as { key: SubView; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveView(tab.key); clearMessages(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === tab.key
                ? 'bg-gold-500 text-navy-900 shadow'
                : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-300">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-400 hover:text-green-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* BROWSE PRODUCTS VIEW */}
      {/* ============================================ */}
      {activeView === 'browse' && (
        <div className="space-y-4 animate-fade-in">
          {/* Metal Selector + Search + Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex gap-2">
                {Object.values(MetalType).map(metal => (
                  <button
                    key={metal}
                    onClick={() => { setSelectedMetal(metal); setProductSearch(''); setCollapsedCategories(new Set()); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedMetal === metal
                        ? 'bg-gold-500 text-navy-900 shadow-md shadow-gold-500/20'
                        : 'bg-navy-800 text-gray-400 border border-white/10 hover:border-gold-500/50 hover:text-white'
                    }`}
                  >
                    {metal}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex gap-2">
                <div className="flex-1 relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-navy-800 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                  />
                </div>
                <button
                  onClick={refreshProducts}
                  disabled={productsLoading}
                  className="px-3 py-2 bg-navy-800 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-gold-500/50 transition-colors"
                  title="Refresh prices"
                >
                  <svg className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter toggles + product count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} in {productCategories.length} categor{productCategories.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
              <button
                onClick={() => setShowUnavailable(prev => !prev)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors ${
                  showUnavailable
                    ? 'bg-gray-700/50 text-gray-300 border-gray-600'
                    : 'bg-navy-800 text-gray-500 border-white/5 hover:text-gray-300'
                }`}
              >
                {showUnavailable ? 'Hide' : 'Show'} Unavailable
              </button>
            </div>
          </div>

          {/* Category-Grouped Products */}
          {productsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : productCategories.length === 0 ? (
            <div className="text-center py-16 bg-navy-800 rounded-2xl border border-white/5">
              <p className="text-gray-500 text-sm">No products found for {selectedMetal}</p>
              {!showUnavailable && products.length > 0 && (
                <button
                  onClick={() => setShowUnavailable(true)}
                  className="text-xs text-gold-500 mt-2 hover:underline"
                >
                  Show unavailable products ({products.length - filteredProducts.length} hidden)
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {productCategories.map(category => {
                const isCollapsed = collapsedCategories.has(category.name);
                const availableCount = category.products.filter(p => canLockProduct(p)).length;

                return (
                  <div key={category.name} className="bg-navy-800/50 rounded-xl border border-white/5 overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{category.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {category.products.length} item{category.products.length !== 1 ? 's' : ''}
                          {availableCount < category.products.length && (
                            <span className="text-gray-600"> ({availableCount} available)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {availableCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </div>
                    </button>

                    {/* Category Products */}
                    {!isCollapsed && (
                      <div className="border-t border-white/5">
                        {category.products.map(product => {
                          const lockable = canLockProduct(product);
                          const badge = getAvailabilityBadge(product);
                          const askPrice = product.askPrice || 0;
                          const bidPrice = product.bidPrice || 0;
                          const alreadyInInvoice = invoiceItems.some(i => i.sku === product.productCode);

                          return (
                            <div
                              key={product.productCode}
                              className={`flex items-center gap-4 px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${
                                lockable ? 'hover:bg-navy-900/30' : 'opacity-40'
                              }`}
                            >
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white truncate">{product.description}</span>
                                  {product.isIRAEligible === 'Y' && (
                                    <span className="text-[8px] text-blue-400 font-bold uppercase shrink-0">IRA</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                  {product.productCode} | {product.weight} {product.weightUnit}
                                </div>
                              </div>

                              {/* Availability Badge */}
                              <span className={`text-[9px] ${badge.bgColor} ${badge.color} px-2 py-0.5 rounded-full font-bold uppercase shrink-0`}>
                                {badge.label}
                              </span>

                              {/* Ask / Bid */}
                              <div className="text-right shrink-0 w-36">
                                <div className="text-[9px] text-gray-500 uppercase font-bold">Ask / Bid</div>
                                <div className="text-sm font-mono">
                                  {askPrice > 0 ? (
                                    <>
                                      <span className="text-white font-bold">${askPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                      <span className="text-gray-600 mx-1">/</span>
                                      <span className="text-gray-400">${bidPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-600">—</span>
                                  )}
                                </div>
                              </div>

                              {/* Add Button */}
                              <button
                                onClick={() => addToInvoice(product)}
                                disabled={!lockable}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
                                  alreadyInInvoice
                                    ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30'
                                    : lockable
                                      ? 'bg-gold-500 text-navy-900 hover:bg-gold-400 active:scale-95'
                                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                {alreadyInInvoice ? '+ More' : 'Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* INVOICE BUILDER VIEW */}
      {/* ============================================ */}
      {activeView === 'invoice' && (
        <div className="space-y-4 animate-fade-in">
          {invoiceItems.length === 0 ? (
            <div className="text-center py-16 bg-navy-800 rounded-2xl border border-white/5">
              <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm mb-3">No items in invoice</p>
              <button
                onClick={() => setActiveView('browse')}
                className="text-xs font-bold text-gold-500 border border-gold-500/30 px-4 py-2 rounded-lg hover:bg-gold-500/10 transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
              {/* Fulfillment Toggle */}
              <div className="flex items-center justify-between bg-navy-800 rounded-xl border border-white/5 p-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Fulfillment</span>
                <div className="flex bg-navy-900 rounded-lg p-1">
                  <button
                    onClick={() => handleFulfillmentChange('storage')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold transition-colors ${
                      fulfillmentType === 'storage' ? 'bg-gold-500 text-navy-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Vault Storage
                  </button>
                  <button
                    onClick={() => handleFulfillmentChange('delivery')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold transition-colors ${
                      fulfillmentType === 'delivery' ? 'bg-gold-500 text-navy-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    onClick={() => handleFulfillmentChange('ship_to_us')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold transition-colors ${
                      fulfillmentType === 'ship_to_us' ? 'bg-gold-500 text-navy-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Ship to US
                  </button>
                </div>
              </div>

              {/* Ship to US Address Form */}
              {fulfillmentType === 'ship_to_us' && (
                <div className="bg-navy-800 rounded-xl border border-white/5 p-4 space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Shipping Address</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={shipToAddress.name}
                      onChange={e => setShipToAddress(p => ({ ...p, name: e.target.value }))}
                      placeholder="Recipient Name *"
                      className="col-span-2 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                    />
                    <input
                      value={shipToAddress.address1}
                      onChange={e => setShipToAddress(p => ({ ...p, address1: e.target.value }))}
                      placeholder="Street Address *"
                      className="col-span-2 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                    />
                    <input
                      value={shipToAddress.address2}
                      onChange={e => setShipToAddress(p => ({ ...p, address2: e.target.value }))}
                      placeholder="Apt / Suite / Unit"
                      className="col-span-2 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                    />
                    <input
                      value={shipToAddress.city}
                      onChange={e => setShipToAddress(p => ({ ...p, city: e.target.value }))}
                      placeholder="City *"
                      className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={shipToAddress.state}
                        onChange={e => setShipToAddress(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                        placeholder="ST *"
                        maxLength={2}
                        className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none uppercase"
                      />
                      <input
                        value={shipToAddress.postalCode}
                        onChange={e => setShipToAddress(p => ({ ...p, postalCode: e.target.value.slice(0, 10) }))}
                        placeholder="ZIP *"
                        className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                      />
                    </div>
                    <input
                      value={shipToAddress.phone}
                      onChange={e => setShipToAddress(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone (optional)"
                      className="col-span-2 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Customer Selector */}
              <div ref={customerDropdownRef} className="relative bg-navy-800 rounded-xl border border-white/5 p-4">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Customer</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white font-bold">{selectedCustomer.name}</span>
                      {selectedCustomer.email && <span className="text-xs text-gray-500 ml-2">{selectedCustomer.email}</span>}
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer by name, email, or phone..."
                      className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none"
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-navy-900 border border-white/10 rounded-lg max-h-48 overflow-y-auto z-20 shadow-xl">
                        {filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setShowCustomerDropdown(false);
                              setCustomerSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-navy-800 transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="text-xs text-white font-bold">{c.name}</div>
                            <div className="text-[10px] text-gray-500">{c.email || c.phone || `ID: ${c.id}`}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="bg-navy-800 rounded-xl border border-white/5 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-navy-900/50 border-b border-white/5">
                  <div className="col-span-4 text-[9px] uppercase tracking-widest text-gray-500 font-bold">Product</div>
                  <div className="col-span-1 text-[9px] uppercase tracking-widest text-gray-500 font-bold text-center">Qty</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-widest text-gray-500 font-bold text-right">FizTrade</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-widest text-gray-500 font-bold text-right">Retail</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-widest text-gray-500 font-bold text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Line Items */}
                {invoiceItems.map(item => (
                  <div key={item.sku} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 items-center hover:bg-navy-900/30 transition-colors">
                    <div className="col-span-4">
                      <div className="text-xs text-white font-bold truncate">{item.description}</div>
                      <div className="text-[9px] text-gray-500 font-mono">{item.sku} | +{(item.alMarkupPercent * 100).toFixed(1)}% markup</div>
                    </div>
                    <div className="col-span-1 flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateItemQty(item.sku, -1)}
                        className="w-5 h-5 rounded bg-navy-900 text-gray-400 hover:text-white text-xs flex items-center justify-center"
                      >-</button>
                      <span className="text-xs text-white font-mono w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQty(item.sku, 1)}
                        className="w-5 h-5 rounded bg-navy-900 text-gray-400 hover:text-white text-xs flex items-center justify-center"
                      >+</button>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-gray-400 font-mono">${item.fiztradeAskPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-gold-500 font-mono font-bold">${item.retailPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-white font-mono font-bold">${item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => removeItem(item.sku)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="px-4 py-4 bg-navy-900/30 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Subtotal (FizTrade Cost)</span>
                    <span className="text-gray-400 font-mono">${invoiceTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gold-500">AL Markup ({fulfillmentType === 'storage' ? 'Vault' : fulfillmentType === 'ship_to_us' ? 'Ship to US' : 'Delivery'})</span>
                    <span className="text-gold-500 font-mono font-bold">+${invoiceTotals.markupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="text-white font-bold">Customer Total</span>
                    <span className="text-white font-mono font-bold text-lg">${invoiceTotals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Notes (Internal)</label>
                <textarea
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                  placeholder="Optional notes for this order..."
                  rows={2}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold-500/50 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Proceed to Checkout (customer-facing flow) */}
                {onCheckout && invoiceItems.length > 0 && (
                  <button
                    onClick={() => {
                      const cartItems = invoiceItems.map(item => ({
                        sku: item.sku,
                        description: item.description,
                        metal_type: item.metalType,
                        weight_ozt: item.weight,
                        quantity: item.quantity,
                        unit_price: item.retailPrice,
                        extended_price: item.lineTotal,
                        spot_at_order: item.fiztradeAskPrice,
                      }));
                      onCheckout(cartItems);
                    }}
                    className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold-500/20 active:scale-[0.98]"
                  >
                    Proceed to Checkout — ${invoiceTotals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </button>
                )}

                {/* Staff action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={clearInvoice}
                    className="px-4 py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveQuote}
                    disabled={savingQuote || invoiceItems.length === 0}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      savingQuote || invoiceItems.length === 0
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-navy-700 border border-gold-500/30 text-gold-500 hover:bg-gold-500/10'
                    }`}
                  >
                    {savingQuote ? 'Saving...' : 'Save as Quote'}
                  </button>
                  <button
                    onClick={handleLockPrices}
                    disabled={isLocking || invoiceItems.length === 0 || !marketStatus.isOpen}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${
                      isLocking || invoiceItems.length === 0 || !marketStatus.isOpen
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-gold-500/20 active:scale-[0.98]'
                    }`}
                  >
                    {isLocking ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                        Locking...
                      </span>
                    ) : !marketStatus.isOpen ? 'Market Closed' : 'Lock & Execute'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* PENDING QUOTES VIEW */}
      {/* ============================================ */}
      {activeView === 'quotes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              {pendingQuotes.length} pending quote{pendingQuotes.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={fetchQuotes}
              disabled={quotesLoading}
              className="text-xs font-bold text-gold-500 border border-gold-500/30 px-3 py-1.5 rounded-lg hover:bg-gold-500/10 transition-colors flex items-center gap-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${quotesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {quotesLoading && pendingQuotes.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingQuotes.length === 0 ? (
            <div className="text-center py-16 bg-navy-800 rounded-2xl border border-white/5">
              <p className="text-gray-500 text-sm">No pending quotes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQuotes.map(quote => {
                const isExpanded = expandedQuoteId === quote.id;
                const isExpired = new Date(quote.expires_at) < new Date();

                return (
                  <div key={quote.id} className="bg-navy-800 rounded-xl border border-white/5 overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-navy-900/30 transition-colors"
                      onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-xs text-gold-500 font-mono font-bold">{quote.quote_ref}</div>
                          <div className="text-[10px] text-gray-500">{quote.customer_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-white font-mono font-bold">${quote.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div className="text-[9px] text-gray-500">
                            {quote.items?.length || 0} item{(quote.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {isExpired ? (
                          <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">Expired</span>
                        ) : (
                          <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase">Pending</span>
                        )}
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in">
                        <div className="space-y-1 mb-3">
                          {(quote.items || []).map((item: QuoteItem, idx: number) => (
                            <div key={idx} className="flex justify-between text-[10px]">
                              <span className="text-gray-400">{item.quantity}x {item.description} <span className="text-gray-600 font-mono">({item.sku})</span></span>
                              <span className="text-white font-mono">${(item.retailPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 border-t border-white/5 pt-2 mb-3">
                          <span>Created: {new Date(quote.created_at).toLocaleDateString()}</span>
                          <span>Expires: {new Date(quote.expires_at).toLocaleDateString()}</span>
                        </div>
                        {quote.notes && (
                          <p className="text-[10px] text-gray-500 italic mb-3">Note: {quote.notes}</p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExecuteQuote(quote.id); }}
                          disabled={isExecuting || !marketStatus.isOpen || isExpired}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                            isExecuting || !marketStatus.isOpen || isExpired
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              : 'bg-gold-500 hover:bg-gold-400 text-navy-900 active:scale-[0.98]'
                          }`}
                        >
                          {isExecuting ? 'Executing...' : isExpired ? 'Quote Expired' : !marketStatus.isOpen ? 'Market Closed' : 'Execute Quote'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* LOCK TIMER OVERLAY */}
      {/* ============================================ */}
      {lockData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/95 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md bg-navy-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            {/* Timer Header */}
            <div className={`p-6 text-center ${lockCountdown <= 0 ? 'bg-red-500/10' : lockCountdown <= 5 ? 'bg-orange-500/10' : 'bg-gold-500/5'}`}>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Prices Locked</div>

              {/* Countdown Circle */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="none" className="text-navy-900" />
                  <circle
                    cx="50" cy="50" r="45"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - lockCountdown / 20)}`}
                    className={`transition-all duration-1000 ${
                      lockCountdown <= 0 ? 'text-red-500' : lockCountdown <= 5 ? 'text-orange-500' : 'text-gold-500'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-mono font-bold ${
                    lockCountdown <= 0 ? 'text-red-500' : lockCountdown <= 5 ? 'text-orange-500' : 'text-white'
                  }`}>
                    {lockCountdown}
                  </span>
                </div>
              </div>

              {lockCountdown <= 0 ? (
                <p className="text-red-400 text-xs font-bold">Lock expired. Re-lock to try again.</p>
              ) : (
                <p className="text-gray-400 text-xs">Execute within {lockCountdown} seconds</p>
              )}
            </div>

            {/* Locked Prices Table */}
            <div className="px-6 py-4 border-t border-white/5">
              <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Locked Prices</div>
              <div className="space-y-2">
                {lockData.prices.map((item: LockPriceItem, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-white font-bold">{item.product}</span>
                      <span className="text-[10px] text-gray-500 ml-2">x{item.qty}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 font-mono">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-white font-mono font-bold ml-3">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                <span className="text-xs text-gray-400 font-bold">Total (FizTrade Cost)</span>
                <span className="text-lg text-white font-mono font-bold">${lockData.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-navy-900/50 border-t border-white/5 flex gap-3">
              <button
                onClick={cancelLock}
                className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              {lockCountdown <= 0 ? (
                <button
                  onClick={handleLockPrices}
                  disabled={isLocking}
                  className="flex-[2] py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-gold-500/20"
                >
                  {isLocking ? 'Locking...' : 'Re-Lock Prices'}
                </button>
              ) : (
                <button
                  onClick={handleExecuteTrade}
                  disabled={isExecuting}
                  className="flex-[2] py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-gold-500/20 active:scale-[0.98]"
                >
                  {isExecuting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                      Executing...
                    </span>
                  ) : 'Execute Trade'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TRADE SUCCESS OVERLAY */}
      {/* ============================================ */}
      {tradeResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/95 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md bg-navy-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-xl font-serif text-white mb-1">Trade Executed</h3>
              <p className="text-gray-400 text-xs mb-6">{tradeResult.status}</p>

              <div className="bg-navy-900 rounded-xl p-4 text-left space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Confirmation</span>
                  <span className="text-sm text-gold-500 font-mono font-bold">{tradeResult.confirmationNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Transaction ID</span>
                  <span className="text-xs text-gray-400 font-mono">{tradeResult.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Shipping</span>
                  <span className="text-xs text-gray-400 capitalize">
                    {tradeResult.shippingOption === 'drop_ship' ? 'Ship to Customer' : tradeResult.shippingOption === 'hold' ? 'Hold at Vault' : tradeResult.shippingOption}
                  </span>
                </div>
                {tradeResult.shippingOption === 'drop_ship' && shipToAddress.name && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Ship To</span>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <div>{shipToAddress.name}</div>
                      <div>{shipToAddress.address1}{shipToAddress.address2 ? `, ${shipToAddress.address2}` : ''}</div>
                      <div>{shipToAddress.city}, {shipToAddress.state} {shipToAddress.postalCode}</div>
                      {shipToAddress.phone && <div>{shipToAddress.phone}</div>}
                    </div>
                  </div>
                )}
                {tradeResult.bustedItems.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase text-red-400 font-bold block mb-1">Busted Items (Not Filled)</span>
                    {tradeResult.bustedItems.map((item, idx) => (
                      <span key={idx} className="text-xs text-red-300 block">{item}</span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setTradeResult(null); clearInvoice(); }}
                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-gold-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Execute Success Overlay */}
      {quoteExecuteResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/95 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md bg-navy-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-serif text-white mb-1">Quote Executed</h3>
              <div className="bg-navy-900 rounded-xl p-4 text-left space-y-3 my-6">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Quote</span>
                  <span className="text-sm text-gold-500 font-mono font-bold">{quoteExecuteResult.quoteRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Confirmation</span>
                  <span className="text-sm text-green-400 font-mono font-bold">{quoteExecuteResult.confirmationNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setQuoteExecuteResult(null)}
                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-gold-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FizTradeHub;
