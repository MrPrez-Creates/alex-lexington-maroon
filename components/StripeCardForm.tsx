/**
 * StripeCardForm — Embedded card payment form for Maroon checkout.
 *
 * Uses Stripe Elements (CardElement) for PCI-compliant card capture.
 * Styled to match Maroon's dark navy/gold theme.
 */

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Singleton Stripe instance — loaded once
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// ============================================
// TYPES
// ============================================

interface StripeCardFormProps {
  clientSecret: string;
  chargeTotal: number;
  isDeposit: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

// ============================================
// CARD ELEMENT APPEARANCE
// ============================================

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#e2e8f0',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#64748b',
      },
      iconColor: '#d4a843',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

// ============================================
// INNER FORM (needs Stripe context)
// ============================================

function CardForm({
  clientSecret,
  chargeTotal,
  isDeposit,
  onSuccess,
  onError,
  disabled,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded. Please refresh and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card form not found. Please refresh and try again.');
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardElement } }
      );

      if (error) {
        setCardError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        setCardError('Payment was not completed. Please try again.');
        onError('Payment was not completed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred';
      setCardError(msg);
      onError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Input */}
      <div className="bg-navy-800/80 border border-white/10 rounded-xl p-4">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Card Details
        </label>
        <div className="bg-navy-900/60 rounded-lg p-3 border border-white/5">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(e.complete);
              setCardError(e.error ? e.error.message : null);
            }}
          />
        </div>
      </div>

      {/* Error */}
      {cardError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-red-300">{cardError}</p>
        </div>
      )}

      {/* Fee Notice */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
        <p className="text-xs text-yellow-400/80">
          A 3.5% processing fee is included in the charge amount.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || !cardComplete || processing || disabled}
        className={`
          w-full py-4 rounded-lg font-bold text-sm transition-all
          ${processing
            ? 'bg-gray-600 text-gray-300 cursor-wait'
            : !stripe || !cardComplete || disabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-lg shadow-gold-500/20 active:scale-[0.98]'
          }
        `}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          <>
            {isDeposit ? 'Pay Deposit' : 'Pay'} ${chargeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </>
        )}
      </button>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe — your card details never touch our servers
      </div>
    </form>
  );
}

// ============================================
// WRAPPER (provides Stripe Elements context)
// ============================================

export default function StripeCardForm(props: StripeCardFormProps) {
  if (!stripePromise) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
        <p className="text-sm text-red-300">Card payments are not configured. Please contact support.</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#d4a843',
            colorBackground: '#0f172a',
            colorText: '#e2e8f0',
            colorDanger: '#ef4444',
            fontFamily: '"Inter", system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CardForm {...props} />
    </Elements>
  );
}
