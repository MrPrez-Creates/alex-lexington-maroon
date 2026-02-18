/**
 * CheckoutFlow Component
 *
 * Multi-step checkout for Maroon App — implements Option D tiered payments:
 * Tier 1: Pay with Balance (0% fee, instant)
 * Tier 2: Pay from Bank Account / ACH (0% fee)
 * Tier 3: Pay by Card via Stripe Elements (3.5% fee)
 *
 * Orders >$8K cannot pay full CC — must use 10% deposit + wire for remaining 90%.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getCheckoutMethods,
  checkoutWithBalance,
  createCheckoutOrder,
  createDepositCheckout,
  createStripeIntent,
  confirmStripePayment,
  type PaymentMethod,
  type CheckoutMethodsResponse,
  type BalanceCheckoutResponse,
  type DepositCheckoutResponse,
  type StripeIntentResponse,
  type StripeConfirmResponse,
  type WireInstructions,
  type CartItem,
} from '../services/checkoutService';
import StripeCardForm from './StripeCardForm';

// ============================================
// TYPES
// ============================================

type CheckoutStage = 'review' | 'payment' | 'processing' | 'card-payment' | 'success' | 'wire-instructions';

interface CheckoutFlowProps {
  customerId: number | string;
  customerName?: string;
  alAccountNumber?: string;
  cart: CartItem[];
  onComplete: (result: { order_id: string; order_number?: string }) => void;
  onCancel: () => void;
  onFundAccount: (deficit?: number) => void;
}

// ============================================
// COMPONENT
// ============================================

export default function CheckoutFlow({
  customerId,
  customerName,
  alAccountNumber,
  cart,
  onComplete,
  onCancel,
  onFundAccount,
}: CheckoutFlowProps) {
  // Stage management
  const [stage, setStage] = useState<CheckoutStage>('review');

  // Payment methods
  const [methodsData, setMethodsData] = useState<CheckoutMethodsResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [balanceResult, setBalanceResult] = useState<BalanceCheckoutResponse | null>(null);
  const [depositResult, setDepositResult] = useState<DepositCheckoutResponse | null>(null);

  // Stripe card payment
  const [stripeIntent, setStripeIntent] = useState<StripeIntentResponse | null>(null);
  const [stripeConfirmResult, setStripeConfirmResult] = useState<StripeConfirmResponse | null>(null);

  // Copy to clipboard
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.extended_price, 0);

  // ── Fetch payment methods when entering payment stage ──
  const fetchMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCheckoutMethods(customerId, cartTotal);
      setMethodsData(data);

      // Auto-select recommended method
      const recommended = data.methods.find((m) => m.recommended && m.sufficient);
      if (recommended) {
        setSelectedMethod(recommended.method);
        if (recommended.linked_bank) {
          setSelectedBankId(recommended.linked_bank.bank_account_id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment options');
    } finally {
      setLoading(false);
    }
  }, [customerId, cartTotal]);

  useEffect(() => {
    if (stage === 'payment') {
      fetchMethods();
    }
  }, [stage, fetchMethods]);

  // ── Copy helper ──
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Process payment ──
  const handlePay = async () => {
    if (!selectedMethod) return;
    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create order
      const orderResult = await createCheckoutOrder(customerId, cart, 'vault');
      setOrderId(orderResult.order_id);
      setOrderNumber(orderResult.order_number);
      setStage('processing');

      const method = methodsData?.methods.find((m) => m.method === selectedMethod);

      // Step 2: Process payment based on method
      if (selectedMethod === 'balance') {
        // Tier 1: Balance checkout
        const result = await checkoutWithBalance(orderResult.order_id, customerId);
        setBalanceResult(result);
        setStage('success');
      } else if (selectedMethod === 'ach') {
        // Tier 2: ACH
        if (!selectedBankId) {
          throw new Error('Please select a bank account');
        }
        const isDepositFlow = method?.is_deposit_flow;

        if (isDepositFlow) {
          // 10% ACH deposit + wire for remaining 90%
          const result = await createDepositCheckout(
            customerId,
            orderResult.order_id,
            cartTotal,
            'ach',
            selectedBankId
          );
          setDepositResult(result);

          if (result.ach_error) {
            setError(result.ach_error);
            setStage('payment');
          } else {
            setStage('wire-instructions');
          }
        } else {
          // Full ACH pull (order < $8K)
          const result = await createDepositCheckout(
            customerId,
            orderResult.order_id,
            cartTotal,
            'ach',
            selectedBankId
          );
          setDepositResult(result);

          if (result.ach_error) {
            setError(result.ach_error);
            setStage('payment');
          } else {
            setStage('success');
          }
        }
      } else if (selectedMethod === 'card') {
        // Tier 3: Card via Stripe Elements (embedded)
        const isDeposit = !!method?.is_deposit_only;
        const intentResult = await createStripeIntent(
          customerId,
          orderResult.order_id,
          isDeposit
        );
        setStripeIntent(intentResult);
        setStage('card-payment');
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
      setStage('payment');
    } finally {
      setProcessing(false);
    }
  };

  // ── Render based on stage ──

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 1: ORDER REVIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (stage === 'review') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">Review Order</h2>
        </div>

        {/* Cart Items */}
        <div className="bg-navy-800/50 rounded-xl p-4 border border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items</h3>

          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm mb-3 last:mb-0">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-white font-medium truncate">{item.description}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity}x &middot; {item.weight_ozt} ozt &middot; {item.metal_type}
                </p>
              </div>
              <span className="text-gray-400 font-mono text-sm">
                ${item.extended_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10">
            <span className="text-white font-bold">Order Total</span>
            <span className="text-gold-500 font-mono font-bold text-lg">
              ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-gray-500">
              Fulfillment: <span className="text-gray-400">Secure Vault Storage</span>
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => setStage('payment')}
          className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-500/20"
        >
          Continue to Payment
        </button>

        <button
          onClick={onCancel}
          className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Back to Shopping
        </button>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 2: PAYMENT SELECTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (stage === 'payment') {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-3 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm">Loading payment options...</p>
        </div>
      );
    }

    // Error loading methods — show retry
    if (error && !methodsData) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setStage('review')}
              className="px-4 py-2 border border-white/10 text-white rounded-lg text-sm transition-colors hover:bg-white/5"
            >
              Back
            </button>
            <button
              onClick={fetchMethods}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-lg text-sm font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    const methods = methodsData?.methods || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStage('review')} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">Choose Payment</h2>
          <span className="ml-auto text-gold-500 font-mono font-bold">
            ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Funding Nudge */}
        {methodsData?.needs_funding && methodsData.funding_shortfall > 0 && (
          <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gold-400 font-medium mb-1">Save on fees</p>
                <p className="text-xs text-gray-400 mb-3">
                  {methodsData.fund_prompt}
                </p>
                <button
                  onClick={() => onFundAccount(methodsData.funding_shortfall)}
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
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.method}
                method={method}
                isSelected={selectedMethod === method.method}
                cartTotal={cartTotal}
                onSelect={() => {
                  setSelectedMethod(method.method);
                  if (method.linked_bank) {
                    setSelectedBankId(method.linked_bank.bank_account_id);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStage('review')}
            disabled={processing}
            className="flex-1 py-4 border border-white/10 hover:bg-white/5 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handlePay}
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
              getPayButtonLabel(selectedMethod, methods, cartTotal)
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 3: PROCESSING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (stage === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-6" />
        <h2 className="text-lg font-bold text-white mb-2">Processing Payment</h2>
        <p className="text-sm text-gray-400 text-center">
          {selectedMethod === 'balance'
            ? 'Deducting from your balance...'
            : selectedMethod === 'ach'
            ? 'Initiating bank transfer...'
            : 'Preparing card payment...'}
        </p>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 3b: STRIPE CARD PAYMENT (embedded card form)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (stage === 'card-payment' && stripeIntent) {
    const breakdown = stripeIntent.charge_breakdown;
    const isDeposit = stripeIntent.is_deposit;

    const handleStripeSuccess = async (paymentIntentId: string) => {
      setProcessing(true);
      setError(null);
      try {
        const result = await confirmStripePayment(orderId!, paymentIntentId);
        setStripeConfirmResult(result);

        if (isDeposit) {
          // Build depositResult-compatible object for wire-instructions stage
          setDepositResult({
            success: true,
            price_lock_id: stripeIntent.price_lock_id || '',
            order_id: orderId!,
            payment_method: 'card',
            deposit_breakdown: result.deposit_breakdown || {
              order_total: breakdown.order_total,
              deposit_percent: 10,
              deposit_base: breakdown.deposit_base || breakdown.charge_base,
              cc_fee_percent: breakdown.cc_fee_percent,
              cc_fee_amount: breakdown.cc_fee_amount,
              deposit_total: breakdown.charge_total,
              wire_amount_due: breakdown.wire_amount_due || 0,
              wire_due_by: breakdown.wire_due_by || '',
            },
            wire_instructions: result.wire_instructions || {
              bank_name: '',
              bank_address: '',
              routing_number: '',
              account_number: '',
              beneficiary_name: '',
              beneficiary_address: '',
              memo: '',
            },
            al_account_number: result.al_account_number,
          });
          setStage('wire-instructions');
        } else {
          // Full card payment — go to success
          setBalanceResult(null);
          setStage('success');
        }
      } catch (err: any) {
        setError(err.message || 'Payment confirmation failed. Please contact support.');
      } finally {
        setProcessing(false);
      }
    };

    const handleStripeError = (message: string) => {
      setError(message);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => {
              setStripeIntent(null);
              setError(null);
              setStage('payment');
            }}
            className="text-gray-400 hover:text-white"
            disabled={processing}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">
            {isDeposit ? 'Pay Deposit by Card' : 'Pay by Card'}
          </h2>
        </div>

        {/* Charge Summary */}
        <div className="bg-navy-800/50 rounded-xl p-4 border border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {isDeposit ? 'Deposit Summary' : 'Payment Summary'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Order Total</span>
              <span className="text-white font-mono">
                ${breakdown.order_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {isDeposit && breakdown.deposit_base != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">10% Deposit</span>
                <span className="text-white font-mono">
                  ${breakdown.deposit_base.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {breakdown.cc_fee_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">{breakdown.cc_fee_percent}% Processing Fee</span>
                <span className="text-yellow-500/80 font-mono">
                  ${breakdown.cc_fee_amount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-white font-bold">
                {isDeposit ? 'Charge to Card' : 'Total Charge'}
              </span>
              <span className="text-gold-500 font-mono font-bold">
                ${breakdown.charge_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {isDeposit && breakdown.wire_amount_due != null && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Remaining via Wire (48h)</span>
                <span className="text-gray-400 font-mono">
                  ${breakdown.wire_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stripe Card Form */}
        <StripeCardForm
          clientSecret={stripeIntent.client_secret}
          chargeTotal={breakdown.charge_total}
          isDeposit={isDeposit}
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
          disabled={processing}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Processing overlay */}
        {processing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Confirming payment...</span>
          </div>
        )}
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 4a: SUCCESS (Balance / Full ACH / Full Card)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (stage === 'success') {
    const isACH = selectedMethod === 'ach';
    const isCard = selectedMethod === 'card';
    const fizConfirmation = stripeConfirmResult?.fiztrade?.confirmation;
    return (
      <div className="text-center py-8">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {isACH ? 'Transfer Initiated!' : 'Order Complete!'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isACH ? (
            <>
              ACH transfer of{' '}
              <span className="text-gold-500 font-mono font-bold">
                ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>{' '}
              initiated from {depositResult?.linked_bank?.institution_name || 'your bank'}
              {' '}(••{depositResult?.linked_bank?.account_mask || '****'}).
              Funds will clear in 2-3 business days.
            </>
          ) : isCard ? (
            <>
              Card payment of{' '}
              <span className="text-gold-500 font-mono font-bold">
                ${(stripeIntent?.charge_breakdown.charge_total || cartTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {' '}processed successfully.
            </>
          ) : (
            <>
              Thank you for your purchase of{' '}
              <span className="text-gold-500 font-mono font-bold">
                ${(balanceResult?.amount_paid || cartTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </>
          )}
        </p>

        {orderNumber && (
          <div className="bg-navy-800/50 rounded-xl p-4 mb-6 max-w-xs mx-auto">
            <div className="text-xs text-gray-500 mb-1">Order Number</div>
            <div className="text-lg font-mono text-white font-bold">{orderNumber}</div>
          </div>
        )}

        {fizConfirmation && (
          <div className="bg-navy-800/50 rounded-xl p-4 mb-6 max-w-xs mx-auto">
            <div className="text-xs text-gray-500 mb-1">Trade Confirmation</div>
            <div className="text-lg font-mono text-green-400 font-bold">{fizConfirmation}</div>
          </div>
        )}

        {balanceResult && (
          <div className="bg-navy-800/50 rounded-xl p-4 mb-6 max-w-xs mx-auto">
            <div className="text-xs text-gray-500 mb-1">New Balance</div>
            <div className="text-lg font-mono text-gold-500 font-bold">
              ${balanceResult.new_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}

        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-6 max-w-xs mx-auto">
          <p className="text-sm text-gold-400">
            Your metals have been added to your secure vault.
          </p>
        </div>

        <button
          onClick={() => onComplete({ order_id: orderId || '', order_number: orderNumber || undefined })}
          className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-full shadow-lg shadow-gold-500/20 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 4b: WIRE INSTRUCTIONS (Deposit flow — card or ACH deposit paid, wire remaining)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (stage === 'wire-instructions' && depositResult) {
    const breakdown = depositResult.deposit_breakdown;
    const wire = depositResult.wire_instructions;
    const isCardDeposit = depositResult.payment_method === 'card';
    const fizConfirmation = stripeConfirmResult?.fiztrade?.confirmation;

    const WireField = ({ label, value, fieldKey }: { label: string; value: string; fieldKey: string }) => (
      <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-sm font-medium text-white mt-0.5">{value}</p>
        </div>
        <button
          onClick={() => copyToClipboard(value, fieldKey)}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-gold-500/10 transition-colors"
        >
          {copiedField === fieldKey ? (
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </button>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Deposit Received — Wire Remaining Balance
          </h2>
          <p className="text-sm text-gray-400">
            Your price is locked. Wire the remaining balance within 48 hours.
          </p>
        </div>

        {/* Deposit Breakdown */}
        <div className="bg-navy-800/50 rounded-xl p-4 border border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Payment Summary
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Order Total</span>
              <span className="text-white font-mono">${breakdown.order_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                {breakdown.deposit_percent}% Deposit
                {breakdown.cc_fee_percent > 0 ? ` (+${breakdown.cc_fee_percent}% fee)` : ''}
              </span>
              <span className="text-green-400 font-mono">
                ${breakdown.deposit_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                {breakdown.cc_fee_amount > 0 && (
                  <span className="text-yellow-500/80 text-xs ml-1">(incl ${breakdown.cc_fee_amount.toFixed(2)} fee)</span>
                )}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-white font-bold">Wire Amount Due</span>
              <span className="text-gold-500 font-mono font-bold">
                ${breakdown.wire_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {breakdown.wire_due_by && (
              <div className="flex justify-between">
                <span className="text-gray-400">Due By</span>
                <span className="text-red-400 font-mono text-xs">
                  {new Date(breakdown.wire_due_by).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Deposit Confirmation */}
        {isCardDeposit && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-400 mb-2">Card Deposit Paid</h3>
            <p className="text-xs text-gray-400">
              Your {breakdown.deposit_percent}% deposit of ${breakdown.deposit_total.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been charged to your card.
              {fizConfirmation && (
                <> Trade confirmation: <span className="text-green-400 font-mono font-bold">{fizConfirmation}</span></>
              )}
            </p>
          </div>
        )}

        {/* ACH Deposit Confirmation */}
        {depositResult.payment_method === 'ach' && depositResult.ach_transfer_id && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-400 mb-2">ACH Deposit Initiated</h3>
            <p className="text-xs text-gray-400">
              ${breakdown.deposit_base.toLocaleString(undefined, { minimumFractionDigits: 2 })} ACH pull from{' '}
              {depositResult.linked_bank?.institution_name || 'your bank'} (••{depositResult.linked_bank?.account_mask || '****'}).
              {' '}Funds clear in 2-3 business days.
            </p>
          </div>
        )}

        {/* Wire Instructions */}
        {wire && (
          <div className="bg-navy-800/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Wire Instructions
            </h3>

            <WireField label="Bank" value={wire.bank_name} fieldKey="bank" />
            <WireField label="Routing Number" value={wire.routing_number} fieldKey="routing" />
            <WireField label="Account Number" value={wire.account_number} fieldKey="account" />
            <WireField label="Beneficiary" value={wire.beneficiary_name} fieldKey="beneficiary" />
            <WireField label="Address" value={wire.beneficiary_address} fieldKey="address" />

            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                  Memo / Reference (REQUIRED)
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-mono font-bold text-gold-500">
                    {depositResult.al_account_number || alAccountNumber || 'Your AL Account Number'}
                  </p>
                  <button
                    onClick={() => copyToClipboard(
                      depositResult.al_account_number || alAccountNumber || '',
                      'memo'
                    )}
                    className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center hover:bg-gold-500/30 transition-colors"
                  >
                    {copiedField === 'memo' ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timing */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-red-400 font-bold">48-Hour Deadline</p>
                <p className="text-xs text-gray-400 mt-1">
                  Wire the remaining ${breakdown.wire_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })} within 48 hours.
                  {' '}Same-day processing if sent before 4:00 PM ET.
                  {' '}If not received, your price lock will expire and the order may be cancelled.
                </p>
              </div>
            </div>
          </div>

        {/* Done Button */}
        <button
          onClick={() => onComplete({ order_id: orderId || '', order_number: orderNumber || undefined })}
          className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-500/20"
        >
          Done
        </button>
      </div>
    );
  }

  // Fallback
  return null;
}

// ============================================
// PAYMENT METHOD CARD (Sub-component)
// ============================================

function PaymentMethodCard({
  method,
  isSelected,
  cartTotal,
  onSelect,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  cartTotal: number;
  onSelect: () => void;
}) {
  // Method icons
  const getIcon = () => {
    switch (method.method) {
      case 'balance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'ach':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'card':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        isSelected
          ? 'bg-gold-500/10 border-gold-500 shadow-lg shadow-gold-500/10'
          : 'bg-navy-800/50 border-white/10 hover:border-white/30'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`${isSelected ? 'text-gold-500' : 'text-gray-400'}`}>
            {getIcon()}
          </span>
          <span className="text-white font-bold text-sm">{method.name}</span>

          {method.recommended && (
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

      {/* Balance info */}
      {method.available !== null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Available:</span>
          <span className={`text-xs font-mono ${method.sufficient ? 'text-green-400' : 'text-yellow-500'}`}>
            ${method.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {!method.sufficient && (
            <span className="text-xs text-yellow-500">(Insufficient)</span>
          )}
        </div>
      )}

      {/* Linked bank info */}
      {method.linked_bank && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">
            {method.linked_bank.institution_name} ••{method.linked_bank.account_mask}
          </span>
        </div>
      )}

      {/* Fee display */}
      {method.fee_percent > 0 && (
        <div className="text-xs text-yellow-500/80 mt-1">
          +{method.fee_percent}% processing fee = ${method.fee_amount.toFixed(2)}
        </div>
      )}

      {/* Deposit breakdown */}
      {method.deposit_breakdown && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="text-xs text-gray-500">
            <span className="text-gray-400">{method.deposit_breakdown.deposit_percent}% deposit:</span>{' '}
            <span className="font-mono">${method.deposit_breakdown.deposit_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            {' '}&rarr;{' '}
            <span className="text-gray-400">Wire:</span>{' '}
            <span className="font-mono">${method.deposit_breakdown.wire_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-gray-500"> (48h)</span>
          </div>
        </div>
      )}

      {/* Bank nudge for card */}
      {method.bank_nudge && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-xs text-gold-400">{method.bank_nudge}</p>
        </div>
      )}
    </button>
  );
}

// ============================================
// HELPERS
// ============================================

function getPayButtonLabel(
  selectedMethod: string | null,
  methods: PaymentMethod[],
  cartTotal: number
): string {
  if (!selectedMethod) return 'Select Payment Method';

  const method = methods.find((m) => m.method === selectedMethod);
  if (!method) return `Pay $${cartTotal.toLocaleString()}`;

  if (method.method === 'balance') {
    return `Pay $${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  if (method.deposit_breakdown) {
    return `Pay ${method.deposit_breakdown.deposit_percent}% Deposit — $${method.deposit_breakdown.deposit_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  if (method.fee_amount > 0) {
    return `Pay $${(cartTotal + method.fee_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  return `Pay $${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}
