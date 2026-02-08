/**
 * BalanceCheckout Component
 *
 * Payment method selection and checkout UI for completing purchases
 * using the customer's funded balance (0% fee) or other payment methods.
 */

import React, { useState, useEffect } from 'react';

interface PaymentMethodOption {
  method: string;
  name: string;
  description: string;
  available: number | null;
  sufficient: boolean;
  fee_percent: number;
  recommended?: boolean;
  max_amount?: number;
  requires_deposit?: boolean;
  deposit_percent?: number;
}

interface CheckoutMethodsResponse {
  cart_total: number;
  methods: PaymentMethodOption[];
  needs_funding: boolean;
  funding_shortfall: number;
  al_account_number: string | null;
  fund_prompt: string | null;
}

interface BalanceCheckoutProps {
  orderId: string;
  customerId: string;
  orderTotal: number;
  orderDetails?: {
    items: Array<{
      name: string;
      quantity: number;
      weight_ozt: number;
      price: number;
    }>;
    fulfillment: 'vault' | 'shipping' | 'pickup';
  };
  onSuccess: (result: { order_id: string; transaction_id?: string }) => void;
  onCancel: () => void;
  onFundAccount: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

export default function BalanceCheckout({
  orderId,
  customerId,
  orderTotal,
  orderDetails,
  onSuccess,
  onCancel,
  onFundAccount,
}: BalanceCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [needsFunding, setNeedsFunding] = useState(false);
  const [fundingShortfall, setFundingShortfall] = useState(0);
  const [fundPrompt, setFundPrompt] = useState<string | null>(null);

  // Fetch available payment methods
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/api/checkout/methods/${customerId}?total=${orderTotal}`
        );
        const data: CheckoutMethodsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.fund_prompt || 'Failed to load payment options');
        }

        setMethods(data.methods || []);
        setNeedsFunding(data.needs_funding);
        setFundingShortfall(data.funding_shortfall);
        setFundPrompt(data.fund_prompt);

        // Auto-select recommended method
        const recommended = data.methods.find(m => m.recommended && m.sufficient);
        if (recommended) {
          setSelectedMethod(recommended.method);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load payment options');
      } finally {
        setLoading(false);
      }
    };

    if (customerId && orderTotal > 0) {
      fetchMethods();
    }
  }, [customerId, orderTotal]);

  // Process checkout with selected method
  const handleCheckout = async () => {
    if (!selectedMethod) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/checkout/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          customer_id: customerId,
          use_cash_balance: selectedMethod === 'cash_balance',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'BALANCE_CHANGED') {
          setError('Your balance changed during checkout. Please try again.');
          // Refresh methods
          window.location.reload();
          return;
        }
        throw new Error(data.error || 'Checkout failed');
      }

      onSuccess({
        order_id: data.order_id,
        transaction_id: data.transaction_id,
      });
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading payment options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-navy-800/50 rounded-xl p-4 border border-white/5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Order Summary
        </h3>

        {orderDetails?.items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-sm mb-2">
            <span className="text-white">
              {item.quantity}x {item.name}
            </span>
            <span className="text-gray-400 font-mono">
              ${item.price.toLocaleString()}
            </span>
          </div>
        ))}

        <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10">
          <span className="text-white font-bold">Total</span>
          <span className="text-gold-500 font-mono font-bold text-lg">
            ${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {orderDetails?.fulfillment && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-gray-500">
              Fulfillment:{' '}
              <span className="text-gray-400 capitalize">
                {orderDetails.fulfillment === 'vault' ? 'Secure Vault Storage' : orderDetails.fulfillment}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Funding Prompt (if insufficient balance) */}
      {needsFunding && fundPrompt && (
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gold-400 font-medium mb-1">
                Fund your account for 0% fees
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Add ${fundingShortfall.toLocaleString()} to complete this purchase without any processing fees.
              </p>
              <button
                onClick={onFundAccount}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-lg text-xs font-bold transition-colors"
              >
                Fund Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Payment Method
        </h3>

        <div className="space-y-2">
          {methods.map((method) => {
            const isSelected = selectedMethod === method.method;
            const isDisabled = !method.sufficient;

            return (
              <button
                key={method.method}
                onClick={() => method.sufficient && setSelectedMethod(method.method)}
                disabled={isDisabled}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gold-500/10 border-gold-500 shadow-lg shadow-gold-500/10'
                    : isDisabled
                    ? 'bg-navy-800/30 border-white/5 opacity-50 cursor-not-allowed'
                    : 'bg-navy-800/50 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{method.name}</span>
                    {method.recommended && method.sufficient && (
                      <span className="px-2 py-0.5 bg-gold-500 text-navy-900 text-[9px] font-bold rounded-full uppercase">
                        Recommended
                      </span>
                    )}
                    {method.fee_percent === 0 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-bold rounded-full">
                        0% Fee
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-gold-500 bg-gold-500' : 'border-gray-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-navy-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-2">{method.description}</p>

                {method.available !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Available:</span>
                    <span className={`text-xs font-mono ${method.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                      ${method.available.toLocaleString()}
                    </span>
                    {!method.sufficient && (
                      <span className="text-xs text-red-400">(Insufficient)</span>
                    )}
                  </div>
                )}

                {method.fee_percent > 0 && (
                  <div className="text-xs text-yellow-500/80 mt-1">
                    +{method.fee_percent}% processing fee = ${((orderTotal * method.fee_percent) / 100).toFixed(2)}
                  </div>
                )}

                {method.max_amount && orderTotal > method.max_amount && (
                  <div className="text-xs text-red-400 mt-1">
                    Max ${method.max_amount.toLocaleString()} per transaction
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-4 border border-white/10 hover:bg-white/5 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCheckout}
          disabled={!selectedMethod || processing}
          className={`flex-[2] py-4 rounded-lg font-bold text-sm transition-all ${
            !selectedMethod || processing
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-lg shadow-gold-500/20'
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            `Pay $${orderTotal.toLocaleString()}`
          )}
        </button>
      </div>

      {/* Security Note */}
      <p className="text-center text-xs text-gray-500">
        <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secure transaction powered by Alex Lexington
      </p>
    </div>
  );
}

/**
 * CheckoutSuccess Component
 * Shown after successful checkout
 */
export function CheckoutSuccess({
  orderNumber,
  amount,
  fulfillment,
  onClose,
}: {
  orderNumber: string;
  amount: number;
  fulfillment: 'vault' | 'shipping' | 'pickup';
  onClose: () => void;
}) {
  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Order Complete!</h2>
      <p className="text-gray-400 mb-6">
        Thank you for your purchase of{' '}
        <span className="text-gold-500 font-mono font-bold">
          ${amount.toLocaleString()}
        </span>
      </p>

      <div className="bg-navy-800/50 rounded-xl p-4 mb-6 max-w-xs mx-auto">
        <div className="text-xs text-gray-500 mb-1">Order Number</div>
        <div className="text-lg font-mono text-white font-bold">{orderNumber}</div>
      </div>

      <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-6 max-w-xs mx-auto">
        <p className="text-sm text-gold-400">
          {fulfillment === 'vault'
            ? 'Your metals have been added to your secure vault.'
            : fulfillment === 'shipping'
            ? 'Your order will ship within 1-2 business days.'
            : 'Your order is ready for pickup at our Atlanta location.'}
        </p>
      </div>

      <button
        onClick={onClose}
        className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-full shadow-lg shadow-gold-500/20 transition-colors"
      >
        Done
      </button>
    </div>
  );
}
