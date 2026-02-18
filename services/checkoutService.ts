/**
 * Checkout Service for Maroon App
 * Handles payment method selection, balance checkout, deposit flows, and order creation.
 * All calls go through al-business-api.
 */

import { API_BASE } from './apiClient';

// ============================================
// TYPES
// ============================================

export interface LinkedBank {
  bank_account_id: string;
  institution_name: string;
  account_mask: string;
  account_type: string;
}

export interface DepositBreakdown {
  deposit_percent: number;
  deposit_base: number;
  deposit_fee: number;
  deposit_total: number;
  wire_amount_due: number;
  wire_deadline_hours: number;
}

export interface PaymentMethod {
  tier: number;
  method: 'balance' | 'ach' | 'card';
  name: string;
  description: string;
  available: number | null;
  sufficient: boolean;
  fee_percent: number;
  fee_amount: number;
  recommended: boolean;
  // Balance-specific
  funding_balance?: number;
  cash_balance?: number;
  // ACH-specific
  linked_bank?: LinkedBank;
  is_deposit_flow?: boolean;
  deposit_breakdown?: DepositBreakdown | null;
  // Card-specific
  is_deposit_only?: boolean;
  max_full_payment?: number;
  savings_with_bank?: number;
  bank_nudge?: string | null;
}

export interface CheckoutMethodsResponse {
  cart_total: number;
  methods: PaymentMethod[];
  has_linked_bank: boolean;
  linked_banks: LinkedBank[];
  needs_funding: boolean;
  funding_shortfall: number;
  al_account_number: string;
  kyc_status: string;
  fund_prompt: string | null;
}

export interface BalanceCheckoutResponse {
  success: boolean;
  order_id: string;
  order_number: string;
  amount_paid: number;
  payment_method: string;
  new_balance: number;
  transaction_id?: string;
  fulfillment: string;
  message: string;
}

export interface WireInstructions {
  bank_name: string;
  bank_address: string;
  routing_number: string;
  account_number: string;
  beneficiary_name: string;
  beneficiary_address: string;
  memo: string;
}

export interface DepositCheckoutResponse {
  success: boolean;
  price_lock_id: string;
  order_id: string;
  payment_method: 'card' | 'ach';
  deposit_breakdown: {
    order_total: number;
    deposit_percent: number;
    deposit_base: number;
    cc_fee_percent: number;
    cc_fee_amount: number;
    deposit_total: number;
    wire_amount_due: number;
    wire_due_by: string;
  };
  wire_instructions: WireInstructions;
  al_account_number: string;
  // Card-specific
  payment_link_url?: string;
  payment_link_id?: string;
  payment_link_error?: string;
  // ACH-specific
  ach_transfer_id?: string;
  ach_authorization_id?: string;
  ach_status?: string;
  ach_error?: string;
  ach_signal_score?: any;
  linked_bank?: { institution_name: string; account_mask: string };
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  order_number: string;
  total: number;
  status: string;
  fulfillment_type: string;
  item_count: number;
}

export interface CartItem {
  sku: string;
  description: string;
  metal_type: string;
  weight_ozt: number;
  quantity: number;
  unit_price: number;
  extended_price: number;
  product_id?: string;
  metal_id?: number;
  spot_at_order?: number;
}

// ============================================
// FETCH HELPER (same pattern as apiClient.ts)
// ============================================

async function checkoutFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((error as any).error || (error as any).message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// CHECKOUT METHODS
// ============================================

/**
 * Get available payment methods for checkout.
 * Returns tiered options: balance, ACH, card — with deposit breakdowns.
 */
export async function getCheckoutMethods(
  customerId: number | string,
  total: number
): Promise<CheckoutMethodsResponse> {
  return checkoutFetch(`/api/checkout/methods/${customerId}?total=${total}`);
}

// ============================================
// BALANCE CHECKOUT (Tier 1 — instant, 0% fee)
// ============================================

/**
 * Complete checkout using funded balance. Atomic deduction.
 */
export async function checkoutWithBalance(
  orderId: string,
  customerId: number | string,
  useCashBalance = false
): Promise<BalanceCheckoutResponse> {
  return checkoutFetch('/api/checkout/balance', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      customer_id: customerId,
      use_cash_balance: useCashBalance,
    }),
  });
}

// ============================================
// ORDER CREATION
// ============================================

/**
 * Create a pending order from cart items. Must be called before payment.
 */
export async function createCheckoutOrder(
  customerId: number | string,
  items: CartItem[],
  fulfillmentType = 'vault'
): Promise<CreateOrderResponse> {
  return checkoutFetch('/api/checkout/create-order', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customerId,
      items,
      fulfillment_type: fulfillmentType,
    }),
  });
}

// ============================================
// DEPOSIT CHECKOUT (Tier 2 ACH / Tier 3 Card)
// ============================================

/**
 * Initiate a 10% deposit checkout.
 * Card: generates Podium payment link (3.5% fee added by Podium).
 * ACH: initiates Plaid ACH pull (0% fee).
 */
export async function createDepositCheckout(
  customerId: number | string,
  orderId: string,
  orderTotal: number,
  paymentMethod: 'card' | 'ach',
  bankAccountId?: string
): Promise<DepositCheckoutResponse> {
  return checkoutFetch('/api/checkout/deposit', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customerId,
      order_id: orderId,
      order_total: orderTotal,
      payment_method: paymentMethod,
      bank_account_id: bankAccountId,
    }),
  });
}

// ============================================
// STRIPE CARD PAYMENT (Tier 3 — embedded card form)
// ============================================

export interface StripeIntentResponse {
  success: boolean;
  client_secret: string;
  payment_intent_id: string;
  order_id: string;
  order_number: string;
  price_lock_id: string | null;
  is_deposit: boolean;
  charge_breakdown: {
    order_total: number;
    charge_base: number;
    cc_fee_percent: number;
    cc_fee_amount: number;
    charge_total: number;
    deposit_base: number | null;
    wire_amount_due: number | null;
    wire_due_by: string | null;
  };
}

export interface StripeConfirmResponse {
  success: boolean;
  order_id: string;
  payment_intent_id: string;
  is_deposit: boolean;
  al_account_number: string;
  already_processed?: boolean;
  deposit_breakdown?: {
    order_total: number;
    deposit_percent: number;
    deposit_base: number;
    cc_fee_percent: number;
    cc_fee_amount: number;
    deposit_total: number;
    wire_amount_due: number;
    wire_due_by: string;
  };
  wire_instructions?: WireInstructions;
  fiztrade?: {
    confirmation?: string;
    status: string;
    error?: string;
    busted_items?: string[];
  };
}

/**
 * Create a Stripe PaymentIntent for card checkout.
 * Returns client_secret for Stripe.js to confirm on the frontend.
 */
export async function createStripeIntent(
  customerId: number | string,
  orderId: string,
  isDeposit: boolean
): Promise<StripeIntentResponse> {
  return checkoutFetch('/api/checkout/stripe-intent', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customerId,
      order_id: orderId,
      is_deposit: isDeposit,
    }),
  });
}

/**
 * Confirm a Stripe payment after client-side card confirmation.
 * Verifies with Stripe, marks order paid, executes FizTrade, returns wire instructions.
 */
export async function confirmStripePayment(
  orderId: string,
  paymentIntentId: string
): Promise<StripeConfirmResponse> {
  return checkoutFetch('/api/checkout/stripe-confirm', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      payment_intent_id: paymentIntentId,
    }),
  });
}

// ============================================
// LINKED BANK ACCOUNTS (for ACH selection)
// ============================================

/**
 * Get customer's linked bank accounts via Plaid.
 */
export async function getLinkedBankAccounts(
  customerId: number | string
): Promise<{ data: LinkedBank[] }> {
  return checkoutFetch(`/api/plaid/accounts/${customerId}`);
}

// ============================================
// FUNDING INFO (wire instructions)
// ============================================

/**
 * Get wire instructions and funding balance for a customer.
 */
export async function getFundingInfo(customerId: number | string): Promise<{
  al_account_number: string;
  customer_name: string;
  balance: { available: number; pending: number; cash: number };
  wire_instructions: WireInstructions;
  memo_instructions: string;
  timing: { wire: string; ach: string };
}> {
  return checkoutFetch(`/api/funding/info/${customerId}`);
}
