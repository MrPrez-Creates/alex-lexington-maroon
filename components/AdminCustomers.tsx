
import React, { useState, useEffect, useCallback } from 'react';
import { CustomerProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

// --- Types for the full Customer Profile API response ---

interface CustomerDetail {
  customer: any;
  data_sources: {
    has_maroon_account: boolean;
    has_shopify_account: boolean;
    has_pos_history: boolean;
    has_woo_history: boolean;
    has_vault_holdings: boolean;
    has_price_locks: boolean;
    has_subscriptions: boolean;
    has_rate_profile: boolean;
  };
  statistics: {
    total_orders: number;
    lifetime_value: number;
    vault: {
      total_holdings: number;
      total_cost: number;
      current_value: number;
      by_metal: Array<{
        metal_code: string;
        metal_name: string;
        total_ozt: number;
        total_cost: number;
        current_value: number;
        item_count: number;
      }>;
    };
    price_locks: {
      total_locks: number;
      active_locks: number;
      total_locked_ozt: number;
      total_deposits: number;
    };
    subscriptions: {
      total: number;
      active: number;
      monthly_amount: number;
    };
    pos: any;
    shopify: any;
    woocommerce: any;
    maroon: any;
  };
  kyc: {
    status: string;
    verified_at: string | null;
    id_document_type: string | null;
    two_factor_enabled: boolean;
    two_factor_method: string | null;
    audit_log: any[];
  };
  rate_profiles: any[];
  recent_activity: {
    pos_invoices: any[];
    shopify_orders: any[];
    woo_orders: any[];
    maroon_orders: any[];
    price_locks: any[];
    subscriptions: any[];
  };
}

interface BankAccount {
  bank_account_id: number;
  institution_name: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  account_mask: string;
  is_primary: boolean;
  created_at: string;
}

interface BalanceData {
  available_balance: number;
  pending_deposits: number;
  total_balance: number;
  recent_transactions: Array<{
    transaction_id: number;
    amount: number;
    type: 'deposit' | 'withdrawal';
    status: string;
    description: string;
    initiated_at: string;
    completed_at: string | null;
  }>;
}

// --- Helpers ---

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

const kycBadge = (status: string) => {
  const s = status?.toUpperCase() || 'UNVERIFIED';
  if (s === 'VERIFIED') return { label: 'VERIFIED', style: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' };
  if (s === 'PENDING') return { label: 'PENDING', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' };
  if (s === 'FAILED') return { label: 'FAILED', style: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' };
  return { label: 'UNVERIFIED', style: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
};

// --- Client Profile Detail Panel ---

const ClientProfilePanel: React.FC<{
  customerId: string;
  onClose: () => void;
}> = ({ customerId, onClose }) => {
  const [profile, setProfile] = useState<CustomerDetail | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'vault' | 'activity'>('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, accountsRes, balanceRes] = await Promise.all([
          fetch(`${API_BASE}/api/customer-profile/${customerId}`),
          fetch(`${API_BASE}/api/plaid/accounts/${customerId}`).catch(() => null),
          fetch(`${API_BASE}/api/plaid/balance/${customerId}`).catch(() => null),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.data || data);
        }

        if (accountsRes?.ok) {
          const accData = await accountsRes.json();
          setBankAccounts(accData.data || []);
        }

        if (balanceRes?.ok) {
          const balData = await balanceRes.json();
          setBalanceData(balData);
        }
      } catch (err) {
        console.error('Failed to load customer profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [customerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-navy-800 rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading client profile...</p>
        </div>
      </div>
    );
  }

  const customer = profile?.customer || {};
  const kyc = profile?.kyc || { status: 'unverified', verified_at: null, two_factor_enabled: false, two_factor_method: null, id_document_type: null, audit_log: [] };
  const stats = profile?.statistics;
  const vault = stats?.vault;
  const sources = profile?.data_sources;
  const kycInfo = kycBadge(kyc.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        className="w-full md:max-w-2xl bg-white dark:bg-navy-900 md:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl border border-white/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-white/10 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 font-serif text-xl font-bold shadow-lg">
              {(customer.first_name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-white">
                {customer.first_name} {customer.last_name}
              </h2>
              <p className="text-sm text-gray-500">{customer.email}</p>
              {customer.al_account_number && (
                <p className="text-xs text-gold-500 font-mono font-bold mt-0.5">{customer.al_account_number}</p>
              )}
            </div>
          </div>

          {/* Quick Status Row */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${kycInfo.style}`}>
              {kycInfo.label}
            </span>
            {kyc.two_factor_enabled && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                2FA: {kyc.two_factor_method || 'ON'}
              </span>
            )}
            {bankAccounts.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Plaid Connected ({bankAccounts.length})
              </span>
            )}
            {bankAccounts.length === 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                No Bank Linked
              </span>
            )}
            {customer.customer_type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                {customer.customer_type}
              </span>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 dark:border-white/10 px-6 gap-6 overflow-x-auto no-scrollbar">
          {(['overview', 'wallet', 'vault', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-gold-500 border-gold-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* === OVERVIEW TAB === */}
          {activeTab === 'overview' && (
            <>
              {/* Account Info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Phone" value={customer.phone || 'Not set'} />
                <InfoCard label="Customer Type" value={customer.customer_type || 'RETAIL'} />
                <InfoCard label="Member Since" value={customer.created_at ? formatDate(customer.created_at) : 'Unknown'} />
                <InfoCard label="Last Active" value={customer.updated_at ? formatDate(customer.updated_at) : 'Unknown'} />
              </div>

              {/* KYC Detail */}
              <SectionCard title="Identity Verification (KYC)">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Status" value={kyc.status?.toUpperCase() || 'UNVERIFIED'} highlight={kyc.status === 'verified'} />
                  <InfoRow label="Verified At" value={kyc.verified_at ? formatDate(kyc.verified_at) : 'Not verified'} />
                  <InfoRow label="ID Document" value={kyc.id_document_type || 'N/A'} />
                  <InfoRow label="2FA Enabled" value={kyc.two_factor_enabled ? `Yes (${kyc.two_factor_method || 'SMS'})` : 'No'} />
                </div>
                {kyc.audit_log && kyc.audit_log.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-bold mb-2">Audit Log</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {kyc.audit_log.slice(0, 5).map((entry: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] text-gray-400">
                          <span>{entry.event || entry.action}</span>
                          <span className="text-gray-600">{entry.created_at ? formatDate(entry.created_at) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Data Sources */}
              {sources && (
                <SectionCard title="Connected Channels">
                  <div className="flex flex-wrap gap-2">
                    <ChannelBadge label="Maroon App" active={sources.has_maroon_account} />
                    <ChannelBadge label="Shopify" active={sources.has_shopify_account} />
                    <ChannelBadge label="POS" active={sources.has_pos_history} />
                    <ChannelBadge label="WooCommerce" active={sources.has_woo_history} />
                    <ChannelBadge label="Vault Holdings" active={sources.has_vault_holdings} />
                    <ChannelBadge label="Price Locks" active={sources.has_price_locks} />
                    <ChannelBadge label="DCA/Subscriptions" active={sources.has_subscriptions} />
                  </div>
                </SectionCard>
              )}

              {/* Lifetime Stats */}
              {stats && (
                <SectionCard title="Lifetime Statistics">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Total Orders" value={stats.total_orders?.toString() || '0'} />
                    <InfoCard label="Lifetime Value" value={formatCurrency(stats.lifetime_value || 0)} highlight />
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* === WALLET TAB === */}
          {activeTab === 'wallet' && (
            <>
              {/* Funding Balance */}
              <SectionCard title="Funding Balance">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Available</p>
                    <p className="text-lg font-bold font-mono text-white">{formatCurrency(balanceData?.available_balance || customer.funding_balance || 0)}</p>
                  </div>
                  <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Pending</p>
                    <p className="text-lg font-bold font-mono text-yellow-400">{formatCurrency(balanceData?.pending_deposits || customer.pending_deposits || 0)}</p>
                  </div>
                  <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Cash Balance</p>
                    <p className="text-lg font-bold font-mono text-white">{formatCurrency(customer.cash_balance || 0)}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Plaid Bank Accounts */}
              <SectionCard title="Plaid Connected Accounts">
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-xs">No Plaid bank accounts linked</p>
                    <p className="text-gray-600 text-[10px] mt-1">Customer has not connected via Plaid Link</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bankAccounts.map((acct) => (
                      <div key={acct.bank_account_id} className="flex items-center justify-between p-3 bg-navy-900/50 dark:bg-navy-950/50 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{acct.institution_name}</p>
                            <p className="text-gray-400 text-[10px] capitalize">
                              {acct.account_subtype} ****{acct.account_mask}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {acct.is_primary && (
                            <span className="text-[10px] text-green-400 font-bold">Primary</span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Recent Funding Transactions */}
              <SectionCard title="Recent Funding Activity">
                {balanceData?.recent_transactions && balanceData.recent_transactions.length > 0 ? (
                  <div className="space-y-2">
                    {balanceData.recent_transactions.slice(0, 8).map((tx) => (
                      <div key={tx.transaction_id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {tx.type === 'deposit' ? (
                              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            )}
                          </div>
                          <div>
                            <p className="text-white text-xs font-medium capitalize">{tx.type}</p>
                            <p className="text-gray-500 text-[10px]">{formatDate(tx.initiated_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-mono font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs text-center py-4">No funding transactions yet</p>
                )}
              </SectionCard>
            </>
          )}

          {/* === VAULT TAB === */}
          {activeTab === 'vault' && (
            <>
              {/* Vault Summary */}
              <SectionCard title="Vault Holdings Summary">
                {vault && vault.total_holdings > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Holdings</p>
                        <p className="text-lg font-bold text-white">{vault.total_holdings}</p>
                      </div>
                      <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Cost Basis</p>
                        <p className="text-lg font-bold font-mono text-white">{formatCurrency(vault.total_cost)}</p>
                      </div>
                      <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Current Value</p>
                        <p className={`text-lg font-bold font-mono ${vault.current_value >= vault.total_cost ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(vault.current_value)}
                        </p>
                      </div>
                    </div>

                    {/* By Metal Breakdown */}
                    {vault.by_metal && vault.by_metal.length > 0 && (
                      <div className="space-y-2">
                        {vault.by_metal.map((m) => {
                          const gainLoss = m.current_value - m.total_cost;
                          const gainPct = m.total_cost > 0 ? ((gainLoss / m.total_cost) * 100) : 0;
                          return (
                            <div key={m.metal_code} className="flex items-center justify-between p-3 bg-navy-900/50 dark:bg-navy-950/50 rounded-xl border border-white/5">
                              <div>
                                <p className="text-white text-sm font-bold">{m.metal_name}</p>
                                <p className="text-gray-400 text-[10px]">{m.total_ozt.toFixed(4)} oz &middot; {m.item_count} item{m.item_count !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white text-sm font-mono font-bold">{formatCurrency(m.current_value)}</p>
                                <p className={`text-[10px] font-mono ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainPct.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-xs text-center py-4">No vault holdings</p>
                )}
              </SectionCard>

              {/* Price Locks */}
              {stats?.price_locks && stats.price_locks.total_locks > 0 && (
                <SectionCard title="Price Locks">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Active Locks" value={stats.price_locks.active_locks.toString()} />
                    <InfoCard label="Locked Weight" value={`${stats.price_locks.total_locked_ozt.toFixed(2)} oz`} />
                    <InfoCard label="Total Deposits" value={formatCurrency(stats.price_locks.total_deposits)} />
                    <InfoCard label="Total Locks" value={stats.price_locks.total_locks.toString()} />
                  </div>
                </SectionCard>
              )}

              {/* Subscriptions */}
              {stats?.subscriptions && stats.subscriptions.total > 0 && (
                <SectionCard title="DCA / Subscriptions">
                  <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Active" value={stats.subscriptions.active.toString()} />
                    <InfoCard label="Total" value={stats.subscriptions.total.toString()} />
                    <InfoCard label="Monthly" value={formatCurrency(stats.subscriptions.monthly_amount)} />
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* === ACTIVITY TAB === */}
          {activeTab === 'activity' && (
            <>
              {profile?.recent_activity && (
                <>
                  <ActivitySection title="Maroon App Orders" items={profile.recent_activity.maroon_orders} renderItem={(order: any) => (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-xs font-medium">Order #{order.order_number || order.order_id}</p>
                        <p className="text-gray-500 text-[10px]">{order.ordered_at ? formatDate(order.ordered_at) : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-mono">{formatCurrency(parseFloat(order.total || 0))}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  )} />

                  <ActivitySection title="POS Invoices" items={profile.recent_activity.pos_invoices} renderItem={(inv: any) => (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-xs font-medium">Invoice #{inv.invoice_number || inv.invoice_id}</p>
                        <p className="text-gray-500 text-[10px] capitalize">{inv.transaction_type} &middot; {inv.created_at ? formatDate(inv.created_at) : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-mono">{formatCurrency(parseFloat(inv.total || 0))}</p>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  )} />

                  <ActivitySection title="Shopify Orders" items={profile.recent_activity.shopify_orders} renderItem={(order: any) => (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-xs font-medium">#{order.shopify_order_number || order.ecommerce_id}</p>
                        <p className="text-gray-500 text-[10px]">{order.placed_at ? formatDate(order.placed_at) : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-mono">{formatCurrency(parseFloat(order.total || 0))}</p>
                        <StatusBadge status={order.payment_status || order.status} />
                      </div>
                    </div>
                  )} />
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// --- Shared UI Components ---

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white/5 dark:bg-navy-800/50 rounded-xl p-4 border border-white/5">
    <h3 className="text-[10px] uppercase tracking-widest text-gold-500 font-bold mb-3">{title}</h3>
    {children}
  </div>
);

const InfoCard: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="bg-navy-900/50 dark:bg-navy-950/50 rounded-lg p-3 border border-white/5">
    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
    <p className={`text-sm font-bold ${highlight ? 'text-gold-500' : 'text-white'}`}>{value}</p>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-xs font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</span>
  </div>
);

const ChannelBadge: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
    active
      ? 'bg-green-500/10 text-green-400 border-green-500/30'
      : 'bg-gray-800 text-gray-500 border-gray-700'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-gray-600'}`} />
    {label}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase() || 'unknown';
  let style = 'bg-gray-500/20 text-gray-400';
  if (['completed', 'paid', 'delivered', 'posted', 'settled'].includes(s)) style = 'bg-green-500/20 text-green-400';
  else if (['pending', 'processing', 'in_transit'].includes(s)) style = 'bg-yellow-500/20 text-yellow-400';
  else if (['failed', 'cancelled', 'returned'].includes(s)) style = 'bg-red-500/20 text-red-400';

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${style}`}>
      {status || 'unknown'}
    </span>
  );
};

const ActivitySection: React.FC<{
  title: string;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
}> = ({ title, items, renderItem }) => {
  if (!items || items.length === 0) return null;
  return (
    <SectionCard title={title}>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, idx) => (
          <div key={idx} className="py-2 border-b border-white/5 last:border-0">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

// --- Main Admin Customers Component ---

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<(CustomerProfile & { kycStatus?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/customers?limit=100`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        const customerList = (data.data || data || []).map((c: any) => ({
          id: c.customer_id?.toString() || c.id,
          firstName: c.first_name || '',
          lastName: c.last_name || '',
          email: c.email || '',
          totalSpent: parseFloat(c.lifetime_buy_total || c.lifetime_value || '0'),
          lastActive: c.updated_at || c.created_at || '',
          billingAddress: { city: '', state: '' },
          contact_info: { emails: [c.email], phones: [c.phone || ''], known_names: [] },
          purchase_history: [],
          kycStatus: c.kyc_status || 'unverified',
        }));
        setCustomers(customerList);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setStatusMsg('Failed to load customers from API.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Derived stats from real data
  const verifiedCount = customers.filter(c => c.kycStatus?.toUpperCase() === 'VERIFIED').length;
  const unverifiedCount = customers.length - verifiedCount;

  // Filter customers by search
  const filteredCustomers = searchQuery
    ? customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 space-y-6">

      {/* Front Office Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex items-center justify-between">
              <div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Clients</div>
                  <div className="text-2xl font-bold text-navy-900 dark:text-white">{customers.length}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex items-center justify-between">
              <div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">KYC Verified</div>
                  <div className="text-2xl font-bold text-green-500">{verifiedCount}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex items-center justify-between">
              <div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Unverified KYC</div>
                  <div className="text-2xl font-bold text-red-500">{unverifiedCount}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Front Office (CRM)</h1>
            <p className="text-xs text-gray-500">Click a customer to view full profile with wallet, balances & Plaid status</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {statusMsg && (
          <div className="bg-navy-800 border border-gold-500/30 text-gold-500 p-3 rounded-lg text-sm text-center animate-fade-in">
              {statusMsg}
          </div>
      )}

      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden flex-1">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-navy-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-navy-700">
                      <tr>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">KYC Status</th>
                          <th className="px-6 py-4">Total Spent</th>
                          <th className="px-6 py-4 hidden md:table-cell">Last Active</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-navy-700 text-sm">
                      {filteredCustomers.length > 0 ? filteredCustomers.map((c) => {
                          const badge = kycBadge(c.kycStatus || 'unverified');
                          return (
                          <tr
                            key={c.id}
                            className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedCustomerId(c.id)}
                          >
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 text-xs font-bold flex-shrink-0">
                                      {(c.firstName?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-navy-900 dark:text-white">{c.firstName} {c.lastName}</div>
                                      <div className="text-xs text-gray-500">{c.email}</div>
                                    </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge.style}`}>
                                      {badge.label}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-mono font-bold text-navy-900 dark:text-white">${(c.totalSpent || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                              </td>
                              <td className="px-6 py-4 hidden md:table-cell text-gray-600 dark:text-gray-300 text-xs">
                                  {c.lastActive ? formatDate(c.lastActive) : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCustomerId(c.id);
                                    }}
                                    className="text-[10px] font-bold text-gold-500 hover:text-white border border-gold-500/30 hover:bg-gold-500/10 px-3 py-1.5 rounded transition-colors"
                                  >
                                      View Profile
                                  </button>
                              </td>
                          </tr>
                          );
                      }) : (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                  {searchQuery ? 'No customers match your search.' : 'No customer data found.'}
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Client Profile Detail Panel */}
      {selectedCustomerId && (
        <ClientProfilePanel
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
};

export default AdminCustomers;
