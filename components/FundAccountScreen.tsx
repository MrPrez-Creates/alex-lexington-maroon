import React, { useState, useEffect } from 'react';
import { getWalletFundingInfo, FundingInfo } from '../services/apiClient';

interface FundAccountScreenProps {
  customerId: string;
  onBack: () => void;
  onLinkBank: () => void;
}

const FundAccountScreen: React.FC<FundAccountScreenProps> = ({
  customerId,
  onBack,
  onLinkBank,
}) => {
  const [fundingInfo, setFundingInfo] = useState<FundingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId || customerId === '0') return;
    setLoading(true);
    getWalletFundingInfo(customerId)
      .then(setFundingInfo)
      .catch((err) => setError(err.message || 'Failed to load funding info'))
      .finally(() => setLoading(false));
  }, [customerId]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading funding info...</p>
      </div>
    );
  }

  if (error || !fundingInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{error || 'Unable to load funding info'}</p>
        <button onClick={onBack} className="mt-4 text-gold-500 font-medium">Go Back</button>
      </div>
    );
  }

  const wire = fundingInfo.wire_instructions;

  const WireField = ({ label, value, fieldKey }: { label: string; value: string; fieldKey: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-medium text-navy-900 dark:text-white mt-0.5 truncate">{value}</p>
      </div>
      <button
        onClick={() => copyToClipboard(value, fieldKey)}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gold-500/10 transition-colors"
        title={`Copy ${label}`}
      >
        {copiedField === fieldKey ? (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto px-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 sticky top-0 bg-white dark:bg-navy-950 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-navy-900 dark:text-white">Fund Account</h1>
      </div>

      {/* AL Account Number Card */}
      {fundingInfo.al_account_number && (
        <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl p-5 mb-5 shadow-lg shadow-gold-500/20">
          <p className="text-gold-900/70 text-xs font-medium uppercase tracking-wider mb-1">Your AL Account Number</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-navy-900 tracking-wider font-mono">
              {fundingInfo.al_account_number}
            </span>
            <button
              onClick={() => copyToClipboard(fundingInfo.al_account_number!, 'al-number')}
              className="px-3 py-1.5 rounded-lg bg-navy-900/10 hover:bg-navy-900/20 transition-colors flex items-center gap-1.5"
            >
              {copiedField === 'al-number' ? (
                <>
                  <svg className="w-4 h-4 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-bold text-navy-900">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-bold text-navy-900">Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-navy-900/60 text-xs mt-2">Include this in your wire memo for automatic matching</p>
        </div>
      )}

      {/* Memo Callout */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 mb-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Important</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">{fundingInfo.memo_instructions}</p>
          </div>
        </div>
      </div>

      {/* Wire Instructions */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-white/5 p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">Wire Instructions</h2>
          <button
            onClick={() => {
              const allText = [
                `Bank: ${wire.bank_name}`,
                `Address: ${wire.bank_address}`,
                `Routing: ${wire.routing_number}`,
                `Account: ${wire.account_number}`,
                `Beneficiary: ${wire.beneficiary_name}`,
                `Beneficiary Address: ${wire.beneficiary_address}`,
                fundingInfo.al_account_number ? `Memo: ${fundingInfo.al_account_number}` : '',
              ].filter(Boolean).join('\n');
              copyToClipboard(allText, 'all');
            }}
            className="text-xs text-gold-500 font-medium hover:text-gold-400 flex items-center gap-1"
          >
            {copiedField === 'all' ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied All
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </>
            )}
          </button>
        </div>

        <WireField label="Bank Name" value={wire.bank_name} fieldKey="bank" />
        <WireField label="Bank Address" value={wire.bank_address} fieldKey="bank-addr" />
        <WireField label="Wire Routing Number" value={wire.routing_number} fieldKey="routing" />
        <WireField label="Account Number" value={wire.account_number} fieldKey="account" />
        <WireField label="Beneficiary Name" value={wire.beneficiary_name} fieldKey="beneficiary" />
        <WireField label="Beneficiary Address" value={wire.beneficiary_address} fieldKey="beneficiary-addr" />
      </div>

      {/* Timing Info */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-white/5 p-4 mb-5">
        <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-3">Transfer Timing</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900 dark:text-white">Wire Transfer</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fundingInfo.timing.wire}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900 dark:text-white">ACH Transfer</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fundingInfo.timing.ach}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ACH Alternative */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-white/5 p-4 mb-5">
        <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-2">Prefer ACH?</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Link your bank account to deposit funds directly via ACH transfer. No wire fees required.
        </p>
        <button
          onClick={onLinkBank}
          className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm transition-colors active:scale-[0.98]"
        >
          Fund via Bank Transfer
        </button>
      </div>

      {/* Balance Display */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">Current Available Balance</p>
        <p className="text-lg font-bold text-navy-900 dark:text-white">
          ${fundingInfo.balance.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        {fundingInfo.balance.pending > 0 && (
          <p className="text-xs text-gold-500">
            + ${fundingInfo.balance.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending
          </p>
        )}
      </div>
    </div>
  );
};

export default FundAccountScreen;
