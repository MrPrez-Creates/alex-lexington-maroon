import React, { useState, useEffect, useCallback } from 'react';
import PlaidBankLink from './PlaidBankLink';

interface FundingWalletProps {
  customerId: number;
  onFundingComplete?: () => void;
  onNavigateToFundAccount?: () => void;
  onWithdraw?: () => void;
  plaidAvailable?: boolean;
}

interface BankAccount {
  bank_account_id: number;
  institution_name: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  account_mask: string;
  is_primary: boolean;
}

interface FundingTransaction {
  transaction_id: number;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: string;
  description: string;
  initiated_at: string;
  completed_at: string | null;
  bank_account?: {
    institution_name: string;
    account_mask: string;
  };
}

interface BalanceData {
  available_balance: number;
  pending_deposits: number;
  total_balance: number;
  recent_transactions: FundingTransaction[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

const FundingWallet: React.FC<FundingWalletProps> = ({
  customerId,
  onFundingComplete,
  onNavigateToFundAccount,
  onWithdraw,
  plaidAvailable = true,
}) => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddBank, setShowAddBank] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Fetch balance and accounts
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [balanceRes, accountsRes] = await Promise.all([
        fetch(`${API_BASE}/api/plaid/balance/${customerId}`),
        fetch(`${API_BASE}/api/plaid/accounts/${customerId}`),
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setBankAccounts(accountsData.data || []);
        if (accountsData.data?.length > 0 && !selectedBankId) {
          setSelectedBankId(accountsData.data[0].bank_account_id);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [customerId, selectedBankId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || !selectedBankId) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10) {
      setError('Minimum deposit is $10');
      return;
    }
    if (amount > 50000) {
      setError('Maximum deposit is $50,000');
      return;
    }

    setIsDepositing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/plaid/transfer/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          bank_account_id: selectedBankId,
          amount,
          description: 'Account funding',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate deposit');
      }

      setDepositSuccess(true);
      setDepositAmount('');

      // Refresh data after short delay
      setTimeout(() => {
        fetchData();
        setShowDeposit(false);
        setDepositSuccess(false);
        onFundingComplete?.();
      }, 2000);
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err.message || 'Failed to initiate deposit');
    } finally {
      setIsDepositing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
      returned: 'bg-orange-500/20 text-orange-400',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-1/3 mb-4" />
        <div className="h-16 bg-slate-700 rounded mb-4" />
        <div className="h-10 bg-slate-700 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-40">

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-white">Funding Balance</h3>
          <button
            onClick={() => setShowDeposit(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-green-400 hover:to-green-500 transition-all"
          >
            + Add Funds
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Your cash balance for buying precious metals. Fund via ACH or wire, withdraw anytime.
        </p>

        {/* Balance display */}
        <div className="flex items-baseline gap-4 mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Available</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(balance?.available_balance || 0)}
            </p>
          </div>
          {(balance?.pending_deposits || 0) > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-xl font-semibold text-yellow-400">
                +{formatCurrency(balance?.pending_deposits || 0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fund Your Account — Two Options */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          Deposit Funds
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* ACH Bank Transfer */}
          <button
            onClick={() => {
              if (bankAccounts.length > 0) {
                setShowDeposit(true);
              } else {
                setShowAddBank(true);
              }
            }}
            className="bg-slate-800/80 rounded-2xl p-4 border border-white/10 hover:border-green-500/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">ACH Bank Transfer</p>
                <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider">No Fee</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Link your bank via Plaid and transfer funds directly. Takes 1-3 business days.
            </p>
            {bankAccounts.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                {bankAccounts.length} bank{bankAccounts.length > 1 ? 's' : ''} linked
              </div>
            )}
          </button>

          {/* Wire Transfer */}
          <button
            onClick={onNavigateToFundAccount}
            className="bg-slate-800/80 rounded-2xl p-4 border border-white/10 hover:border-gold-500/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Bank Wire Transfer</p>
                <p className="text-gold-500 text-[10px] font-bold uppercase tracking-wider">Same Day</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Send a wire directly to your Alex Lexington account. View wire instructions.
            </p>
          </button>
        </div>
      </div>

      {/* Plaid Unavailable Banner */}
      {!plaidAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-amber-400 text-sm font-medium mb-1">Bank connection temporarily unavailable</p>
              <p className="text-gray-400 text-xs">ACH deposits are paused. Use wire transfer to fund your account while we restore connections.</p>
              {onNavigateToFundAccount && (
                <button
                  onClick={onNavigateToFundAccount}
                  className="mt-2 text-xs text-amber-500 font-bold hover:text-amber-400 underline"
                >
                  View Wire Transfer Instructions
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Funds Section */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          Withdraw Funds
        </h4>
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            Withdraw your available balance back to your bank account. When you sell or liquidate metals, proceeds are added to your funding balance and can be withdrawn anytime.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-700/40 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ACH Withdrawal</p>
              <p className="text-white text-sm font-bold">Free</p>
              <p className="text-gray-500 text-[10px]">1-3 business days</p>
            </div>
            <div className="bg-slate-700/40 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Wire Withdrawal</p>
              <p className="text-white text-sm font-bold">$25 fee</p>
              <p className="text-gray-500 text-[10px]">Same day*</p>
            </div>
          </div>
          {onWithdraw && (
            <button
              onClick={onWithdraw}
              disabled={(balance?.available_balance || 0) <= 0}
              className="w-full py-2.5 rounded-xl border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              {(balance?.available_balance || 0) > 0
                ? `Withdraw ${formatCurrency(balance?.available_balance || 0)}`
                : 'No funds to withdraw'
              }
            </button>
          )}
        </div>
      </div>

      {/* Linked Bank Accounts */}
      {plaidAvailable && (
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-300">Linked Bank Accounts</h4>
          <button
            onClick={() => setShowAddBank(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + Add Bank
          </button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-1">No bank accounts linked</p>
            <p className="text-gray-500 text-xs mb-3">Link a bank to deposit and withdraw via ACH for free.</p>
            <button
              onClick={() => setShowAddBank(true)}
              className="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-400 transition-colors"
            >
              Link Bank Account
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {bankAccounts.map((account) => (
              <div
                key={account.bank_account_id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{account.institution_name}</p>
                    <p className="text-gray-400 text-xs capitalize">
                      {account.account_subtype} ****{account.account_mask}
                    </p>
                  </div>
                </div>
                {account.is_primary && (
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Primary</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* How It Works */}
      <div className="bg-slate-800/30 rounded-2xl p-4 border border-white/5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">How It Works</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-400 text-[10px] font-bold">1</span>
            </div>
            <div>
              <p className="text-white text-xs font-medium">Deposit funds via ACH or Wire</p>
              <p className="text-gray-500 text-[10px]">ACH is free (1-3 days). Wire is faster (same day).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gold-500 text-[10px] font-bold">2</span>
            </div>
            <div>
              <p className="text-white text-xs font-medium">Buy precious metals instantly</p>
              <p className="text-gray-500 text-[10px]">Use your balance to purchase gold, silver, or platinum at live prices.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-[10px] font-bold">3</span>
            </div>
            <div>
              <p className="text-white text-xs font-medium">Sell & withdraw anytime</p>
              <p className="text-gray-500 text-[10px]">Liquidate holdings and withdraw proceeds to your bank via ACH or wire.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {balance?.recent_transactions && balance.recent_transactions.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {balance.recent_transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.transaction_id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {tx.type === 'deposit' ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm">
                      {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      {tx.bank_account && (
                        <span className="text-gray-500 text-[10px] ml-1">
                          via {tx.bank_account.institution_name} ****{tx.bank_account.account_mask}
                        </span>
                      )}
                    </p>
                    <p className="text-gray-500 text-xs">{formatDate(tx.initiated_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {showAddBank && (
        <PlaidBankLink
          customerId={customerId}
          onSuccess={(accountInfo) => {
            setShowAddBank(false);
            fetchData();
          }}
          onExit={() => setShowAddBank(false)}
          onError={(error) => setError(error)}
        />
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Add Funds</h3>

            {depositSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-2">Deposit Initiated</p>
                <p className="text-gray-400 text-sm">
                  Funds will be available in 1-3 business days.
                </p>
              </div>
            ) : (
              <>
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">Link a bank account to add funds</p>
                    <button
                      onClick={() => {
                        setShowDeposit(false);
                        setShowAddBank(true);
                      }}
                      className="bg-blue-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-400 transition-colors"
                    >
                      Link Bank Account
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Bank Selection */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        From Bank Account
                      </label>
                      <select
                        value={selectedBankId || ''}
                        onChange={(e) => setSelectedBankId(parseInt(e.target.value))}
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-green-500 focus:outline-none"
                      >
                        {bankAccounts.map((account) => (
                          <option key={account.bank_account_id} value={account.bank_account_id}>
                            {account.institution_name} - {account.account_subtype} ****{account.account_mask}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.00"
                          min="10"
                          max="50000"
                          step="0.01"
                          className="w-full bg-slate-700 text-white text-lg px-4 py-3 pl-8 rounded-xl border border-white/10 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Min: $10 · Max: $50,000</p>
                    </div>

                    {/* Quick amounts */}
                    <div className="flex gap-2 mb-6">
                      {[100, 500, 1000, 5000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setDepositAmount(amount.toString())}
                          className="flex-1 bg-slate-700/50 text-gray-300 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                        >
                          ${amount.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {/* Error message */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/20 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Info */}
                    <div className="bg-slate-700/30 rounded-xl p-3 mb-6">
                      <p className="text-xs text-gray-400">
                        ACH transfers typically take 1-3 business days to complete. Once received, funds will be immediately available for purchasing precious metals.
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleDeposit}
                        disabled={isDepositing || !depositAmount || parseFloat(depositAmount) < 10}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-400 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDepositing ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                          </span>
                        ) : depositAmount ? (
                          `Deposit ${formatCurrency(parseFloat(depositAmount) || 0)}`
                        ) : (
                          'Enter Amount'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeposit(false);
                          setDepositAmount('');
                          setError(null);
                        }}
                        className="w-full text-gray-400 py-2 text-sm hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingWallet;
