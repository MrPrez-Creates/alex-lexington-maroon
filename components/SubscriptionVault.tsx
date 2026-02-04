import React, { useState, useEffect } from 'react';
import { SpotPrices } from '../types';

// Types for subscription vault data
interface VaultBagItem {
  item_id: number;
  item_name: string;
  metal: 'gold' | 'silver' | 'platinum' | 'palladium';
  weight_grams: number | null;
  weight_oz: number | null;
  purchase_price: number;
  status: 'pending' | 'vaulted' | 'fulfilled';
  added_at: string;
  expected_date: string | null;
}

interface VaultSummary {
  totalGoldGrams: number;
  totalGoldOz: number;
  totalSilverOz: number;
  itemCount: number;
  pendingCount: number;
}

interface SubscriptionVaultData {
  bag: {
    bag_id: number;
    bag_number: string;
    total_value: number;
  };
  items: VaultBagItem[];
  summary: VaultSummary;
}

interface SubscriptionInfo {
  subscription_id: number;
  track: 'gold' | 'silver' | 'mixed';
  monthly_amount: number;
  is_concierge: boolean;
  remainder_dollars: number;
  silver_credit_dollars: number;
  vault_preference: 'accumulate' | 'pickup' | 'delivery';
  start_date: string;
  status: 'active' | 'paused' | 'cancelled';
}

interface SubscriptionVaultProps {
  subscriptionId: number | null;
  prices: SpotPrices;
  onRequestPickup?: () => void;
  onRequestDelivery?: () => void;
  onSubscriptionChange?: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

const SubscriptionVault: React.FC<SubscriptionVaultProps> = ({
  subscriptionId,
  prices,
  onRequestPickup,
  onRequestDelivery,
  onSubscriptionChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [vaultData, setVaultData] = useState<SubscriptionVaultData | null>(null);
  const [showFulfillmentOptions, setShowFulfillmentOptions] = useState(false);
  const [showContents, setShowContents] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAmountEdit, setShowAmountEdit] = useState(false);
  const [newAmount, setNewAmount] = useState('');

  // Fetch subscription and vault data
  useEffect(() => {
    if (!subscriptionId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch subscription details
        const subResponse = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}`);
        const subData = await subResponse.json();
        if (subData.data) {
          setSubscription(subData.data);
        }

        // Fetch vault contents
        const vaultResponse = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/vault`);
        const vaultDataRes = await vaultResponse.json();
        if (vaultDataRes.data) {
          setVaultData(vaultDataRes.data);
        }
      } catch (err) {
        console.error('Error fetching subscription vault:', err);
        setError('Failed to load vault data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subscriptionId]);

  // Calculate current value using live prices
  const calculateCurrentValue = () => {
    if (!vaultData) return 0;

    let total = 0;
    vaultData.items.forEach(item => {
      if (item.status === 'vaulted') {
        if (item.metal === 'gold' && item.weight_grams) {
          const oz = item.weight_grams / 31.1035;
          total += oz * (prices.gold || 0);
        } else if (item.metal === 'silver' && item.weight_oz) {
          total += item.weight_oz * (prices.silver || 0);
        }
      }
    });

    return total;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate membership duration
  const getMembershipDuration = () => {
    if (!subscription?.start_date) return 'New Member';
    const start = new Date(subscription.start_date);
    const now = new Date();
    const months = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'New Member';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  // Pause subscription
  const handlePause = async () => {
    if (!subscriptionId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
        onSubscriptionChange?.();
      }
    } catch (err) {
      console.error('Error pausing subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Resume subscription
  const handleResume = async () => {
    if (!subscriptionId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
        onSubscriptionChange?.();
      }
    } catch (err) {
      console.error('Error resuming subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel subscription
  const handleCancel = async () => {
    if (!subscriptionId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer requested cancellation via app' }),
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
        setShowCancelConfirm(false);
        setShowManageSubscription(false);
        onSubscriptionChange?.();
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Update monthly amount
  const handleUpdateAmount = async () => {
    if (!subscriptionId || !newAmount) return;
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 95) {
      alert('Minimum monthly amount is $95');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/amount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_amount: amount }),
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
        setShowAmountEdit(false);
        setNewAmount('');
        onSubscriptionChange?.();
      }
    } catch (err) {
      console.error('Error updating subscription amount:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // No subscription state
  if (!subscriptionId) {
    return (
      <div className="bg-gradient-to-b from-navy-800 to-navy-900 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Start Building Wealth</h3>
        <p className="text-sm text-gray-400 mb-4">
          Subscribe to our metals program and start building your physical gold and silver holdings.
        </p>
        <button className="w-full bg-gold-500 text-navy-900 font-bold py-3 rounded-xl hover:bg-gold-400 transition-colors">
          Learn About Subscriptions
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-b from-navy-800 to-navy-900 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-navy-700 rounded w-1/3 mb-4" />
          <div className="h-16 bg-navy-700 rounded mb-4" />
          <div className="h-4 bg-navy-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gradient-to-b from-navy-800 to-navy-900 rounded-2xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-gold-500 hover:text-gold-400"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentValue = calculateCurrentValue();
  const goldValue = (vaultData?.summary.totalGoldOz || 0) * (prices.gold || 0);
  const silverValue = (vaultData?.summary.totalSilverOz || 0) * (prices.silver || 0);

  return (
    <div className="space-y-4">
      {/* Main Vault Card */}
      <div className="bg-gradient-to-b from-navy-800 to-navy-900 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold">My Vault</h2>
                <p className="text-xs text-gray-400">Bag {vaultData?.bag.bag_number}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                subscription?.vault_preference === 'accumulate'
                  ? 'bg-gold-500/20 text-gold-400'
                  : subscription?.vault_preference === 'pickup'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
              }`}>
                {subscription?.vault_preference === 'accumulate' && '⭐ Accumulating'}
                {subscription?.vault_preference === 'pickup' && '📦 Pickup Scheduled'}
                {subscription?.vault_preference === 'delivery' && '🚚 Delivery Pending'}
              </span>
              <p className="text-xs text-gray-400 mt-1">Member for {getMembershipDuration()}</p>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="p-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Total Value</p>
          <p className="text-4xl font-bold text-white">
            ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          {/* Metal Breakdown */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-navy-700/50 rounded-xl p-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-400">GOLD</span>
              </div>
              <p className="text-lg font-bold text-white">
                {(vaultData?.summary.totalGoldOz || 0).toFixed(2)} oz
              </p>
              <p className="text-xs text-gray-400">
                ${goldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-navy-700/50 rounded-xl p-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">SILVER</span>
              </div>
              <p className="text-lg font-bold text-white">
                {(vaultData?.summary.totalSilverOz || 0).toFixed(0)} oz
              </p>
              <p className="text-xs text-gray-400">
                ${silverValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Pending Items Indicator */}
          {vaultData && vaultData.summary.pendingCount > 0 && (
            <div className="mt-4 bg-blue-500/10 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-blue-400">
                {vaultData.summary.pendingCount} item{vaultData.summary.pendingCount > 1 ? 's' : ''} arriving soon
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setShowContents(!showContents)}
            className="flex-1 bg-navy-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-navy-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {showContents ? 'Hide' : 'View'} Contents
          </button>
          <button
            onClick={() => setShowFulfillmentOptions(!showFulfillmentOptions)}
            className="flex-1 bg-gold-500 text-navy-900 py-2.5 rounded-xl text-sm font-bold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Take Possession
          </button>
        </div>
      </div>

      {/* Vault Contents */}
      {showContents && vaultData && (
        <div className="bg-navy-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-gold-500 font-bold">Vault Contents</h3>

          {/* Gold Section */}
          {vaultData.items.filter(i => i.metal === 'gold').length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                GOLD
              </p>
              <div className="space-y-2">
                {vaultData.items.filter(i => i.metal === 'gold').map(item => (
                  <div key={item.item_id} className="bg-navy-700/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{item.item_name}</p>
                      <p className="text-xs text-gray-400">
                        {item.weight_grams?.toFixed(2)}g • Added {formatDate(item.added_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">
                        ${item.purchase_price.toLocaleString()}
                      </p>
                      {item.status === 'pending' && (
                        <span className="text-[10px] text-blue-400">⏳ Pending</span>
                      )}
                      {item.status === 'vaulted' && (
                        <span className="text-[10px] text-green-400">✓ Vaulted</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Silver Section */}
          {vaultData.items.filter(i => i.metal === 'silver').length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 mt-4">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                SILVER
              </p>
              <div className="space-y-2">
                {vaultData.items.filter(i => i.metal === 'silver').map(item => (
                  <div key={item.item_id} className="bg-navy-700/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{item.item_name}</p>
                      <p className="text-xs text-gray-400">
                        {item.weight_oz?.toFixed(0)} oz • Added {formatDate(item.added_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">
                        ${item.purchase_price.toLocaleString()}
                      </p>
                      {item.status === 'pending' && (
                        <span className="text-[10px] text-blue-400">⏳ Pending</span>
                      )}
                      {item.status === 'vaulted' && (
                        <span className="text-[10px] text-green-400">✓ Vaulted</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vaultData.items.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">
              Your vault is empty. Start your subscription to build your holdings!
            </p>
          )}
        </div>
      )}

      {/* Fulfillment Options */}
      {showFulfillmentOptions && (
        <div className="bg-navy-800 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold-500 font-bold">Ready to Take Possession?</h3>

          {/* Keep Accumulating */}
          <button
            onClick={() => setShowFulfillmentOptions(false)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
              subscription?.vault_preference === 'accumulate'
                ? 'border-gold-500 bg-gold-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                ⭐
              </div>
              <div>
                <p className="text-white font-semibold">Keep Accumulating</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your metals stay secure in our insured vault. Keep building toward bigger milestones.
                </p>
                {subscription?.vault_preference === 'accumulate' && (
                  <span className="text-[10px] text-gold-400 mt-2 inline-block">✓ Current preference</span>
                )}
              </div>
            </div>
          </button>

          {/* Schedule Pickup */}
          <button
            onClick={onRequestPickup}
            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
              subscription?.vault_preference === 'pickup'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                📦
              </div>
              <div>
                <p className="text-white font-semibold">Schedule Pickup</p>
                <p className="text-xs text-gray-400 mt-1">
                  Come to our location with valid photo ID. No fees.
                </p>
                {subscription?.vault_preference === 'pickup' && (
                  <span className="text-[10px] text-blue-400 mt-2 inline-block">📅 Pickup scheduled</span>
                )}
              </div>
            </div>
          </button>

          {/* Request Delivery */}
          <button
            onClick={onRequestDelivery}
            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
              subscription?.vault_preference === 'delivery'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                🚚
              </div>
              <div>
                <p className="text-white font-semibold">Request Delivery</p>
                <p className="text-xs text-gray-400 mt-1">
                  We'll ship to you with full insurance. Signature required.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Est. shipping: ~${Math.round(currentValue * 0.01 + 35)}
                </p>
                {subscription?.vault_preference === 'delivery' && (
                  <span className="text-[10px] text-purple-400 mt-2 inline-block">🚚 Delivery pending</span>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Subscription Details */}
      {subscription && (
        <div className="bg-navy-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest text-gold-500 font-bold">My Subscription</h3>
            <button
              onClick={() => setShowManageSubscription(!showManageSubscription)}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage
            </button>
          </div>

          {/* Status Badge */}
          {subscription.status !== 'active' && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-center ${
              subscription.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <p className="text-sm font-bold uppercase">{subscription.status}</p>
              {subscription.status === 'paused' && (
                <p className="text-[10px] mt-1">Your subscription is paused. No charges until resumed.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-navy-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase">Monthly</p>
              <p className="text-white font-bold">${subscription.monthly_amount}</p>
              {subscription.is_concierge && (
                <span className="text-[10px] text-gold-400">+$10 Concierge</span>
              )}
            </div>
            <div className="bg-navy-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase">Track</p>
              <p className="text-white font-bold capitalize">{subscription.track}</p>
            </div>
            {subscription.remainder_dollars > 0 && (
              <div className="bg-navy-700/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase">Remainder</p>
                <p className="text-yellow-400 font-bold">${subscription.remainder_dollars.toFixed(2)}</p>
              </div>
            )}
            {subscription.silver_credit_dollars > 0 && (
              <div className="bg-navy-700/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase">Silver Credit</p>
                <p className="text-gray-300 font-bold">${subscription.silver_credit_dollars.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Management Options */}
      {showManageSubscription && subscription && subscription.status !== 'cancelled' && (
        <div className="bg-navy-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-gold-500 font-bold">Manage Subscription</h3>

          {/* Change Amount */}
          {subscription.status === 'active' && !showAmountEdit && (
            <button
              onClick={() => {
                setNewAmount(subscription.monthly_amount.toString());
                setShowAmountEdit(true);
              }}
              className="w-full p-3 rounded-xl border border-white/10 hover:border-white/20 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Change Monthly Amount</p>
                <p className="text-xs text-gray-400">Currently ${subscription.monthly_amount}/month</p>
              </div>
            </button>
          )}

          {/* Amount Edit Form */}
          {showAmountEdit && (
            <div className="bg-navy-700/50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-white font-semibold">New Monthly Amount</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    min="95"
                    step="5"
                    className="w-full bg-navy-800 rounded-lg px-8 py-2 text-white border border-white/10 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleUpdateAmount}
                  disabled={actionLoading}
                  className="bg-gold-500 text-navy-900 px-4 py-2 rounded-lg font-bold hover:bg-gold-400 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowAmountEdit(false)}
                  className="bg-navy-600 text-white px-4 py-2 rounded-lg hover:bg-navy-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Minimum $95/month. Changes apply next billing cycle.</p>
            </div>
          )}

          {/* Pause/Resume */}
          {subscription.status === 'active' && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="w-full p-3 rounded-xl border border-white/10 hover:border-yellow-500/50 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Pause Subscription</p>
                <p className="text-xs text-gray-400">Temporarily stop billing. Resume anytime.</p>
              </div>
            </button>
          )}

          {subscription.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="w-full p-3 rounded-xl border border-white/10 hover:border-green-500/50 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Resume Subscription</p>
                <p className="text-xs text-gray-400">Continue building your holdings.</p>
              </div>
            </button>
          )}

          {/* Cancel */}
          {!showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full p-3 rounded-xl border border-white/10 hover:border-red-500/50 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Cancel Subscription</p>
                <p className="text-xs text-gray-400">Your vault contents remain yours.</p>
              </div>
            </button>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
              <p className="text-red-400 font-bold">Are you sure?</p>
              <p className="text-xs text-gray-400">
                Your subscription will be cancelled immediately. Your accumulated metals remain in your vault and can be picked up or delivered anytime.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-navy-600 text-white py-2 rounded-lg hover:bg-navy-500 transition-colors"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancelled State */}
      {subscription?.status === 'cancelled' && (
        <div className="bg-navy-800 rounded-2xl p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">Subscription Cancelled</h3>
          <p className="text-xs text-gray-400 mb-4">
            Your vault contents are still available for pickup or delivery.
          </p>
          <button className="w-full bg-gold-500 text-navy-900 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors">
            Reactivate Subscription
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionVault;
