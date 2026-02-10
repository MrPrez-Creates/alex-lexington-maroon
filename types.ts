
export enum MetalType {
  GOLD = 'gold',
  SILVER = 'silver',
  PLATINUM = 'platinum',
  PALLADIUM = 'palladium'
}

export enum AssetForm {
  COIN = 'Coin',
  BAR = 'Bar',
  ROUND = 'Round',
  JEWELRY = 'Jewelry'
}

export enum WeightUnit {
  TROY_OZ = 'oz',
  GRAMS = 'g',
  KILOGRAMS = 'kg'
}

export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum TransactionStatus {
  COMPLETED = 'Completed',
  PENDING_RECEIPT = 'Pending Receipt', // For physical items being mailed in
  PENDING_FUNDS = 'Pending Funds'
}

export interface BullionItem {
  id: string;
  name: string; // e.g., "1 oz Gold Bar PAMP Fortuna"
  metalType: string; // e.g. "gold"
  
  weightAmount: number; // e.g. 1
  weightUnit: string; // e.g. "oz"
  
  quantity: number; // Number of units
  purchasePrice: number; // Cost basis per lot
  
  currentValue?: number; // Snapshot of value
  sku?: string; // e.g. "gold-bar-pamp-1oz"
  acquiredAt: string; // ISO Date string (e.g. "2024-02-10")
  
  // Retained UI/Logic fields
  form: string; // e.g. AssetForm value
  purity?: string; // e.g. ".9999"
  mint?: string; // e.g. "US Mint"
  mintage?: string; // e.g. "150,000"
  notes?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  metal: string;
  itemName: string;
  amountOz: number;
  pricePerOz: number;
  totalValue: number;
  date: string;
  status: TransactionStatus;
  fee?: number;
  paymentMethod?: string;
  isRecurring?: boolean;
}

export interface SpotPrices {
  [key: string]: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export type ViewState = 'landing' | 'dashboard' | 'vault' | 'wallet' | 'fund-account' | 'add' | 'history' | 'documents' | 'customers' | 'payment-methods' | 'market' | 'contact-support' | 'admin-support' | 'admin-risk' | 'explore' | 'checkout';

export interface ProductTemplate {
  name: string;
  type: MetalType;
  form: AssetForm;
  defaultWeight: number;
  defaultUnit: WeightUnit;
  purity: string;
  mint: string;
}

export interface PriceAlert {
  id: string;
  metal: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

export interface StoredFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  path: string;
  notes?: string;
  aiSummary?: string;
}

export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface UserSettings {
  darkMode: boolean;
  currency?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'card' | 'apple_pay';
  institution: string; // "Chase", "Wells Fargo", "Visa", "Apple"
  name: string; // "Checking", "Personal Card", "Apple Pay"
  mask: string; // "1234"
  isDefault?: boolean;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

export interface RecurringOrder {
  id: string;
  metal: string;
  amountUsd: number;
  frequency: RecurringFrequency;
  nextRunDate: string;
  paymentMethodId: string;
  active: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  organization?: string;
  photoURL: string | null;
  createdAt: string;
  lastLogin: string;
  phoneNumber: string;
  kycStatus: string; // 'unverified' | 'pending' | 'verified'
  billingAddress: Address;
  cashBalance: number;
  settings?: UserSettings;
  isSyncedWithCustomerData?: boolean;
  paymentMethods?: PaymentMethod[];
  stripeCustomerId?: string;
  recurringOrders?: RecurringOrder[];
  customerId?: number; // Supabase customer_id for API integration
  fundingBalance?: number; // Available funds for purchases
  pendingDeposits?: number; // Deposits in transit
}

export interface PurchaseItem {
  name: string;
  sku: string;
  qty: number;
  price: number;
}

export interface PurchaseOrder {
  order_id: string;
  date: string;
  status: string;
  total: number;
  items: PurchaseItem[];
}

export interface ContactInfo {
  emails: string[];
  phones: string[];
  known_names: string[];
}

// WooCommerce Customer Import Type
export interface CustomerProfile {
  id: string; // Usually email or normalized phone
  contact_info: ContactInfo;
  purchase_history: PurchaseOrder[];
  // Legacy fields for backward compat or display
  firstName?: string;
  lastName?: string;
  email?: string; 
  totalSpent?: number;
  lastActive?: string;
  phone?: string;
  billingAddress?: Address;
  importedAt?: string;
}

export interface MarketHistoryRecord {
  date: string;
  XAU: number;
  XAG: number;
  XPT: number;
  XPD: number;
}

export type TicketStatus = 'open' | 'in-progress' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SHARED COLLECTIONS (Command Center Integration)
// ============================================================================

// Shared Customer record - links Maroon user to Command Center
export interface SharedCustomer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  type: 'RETAIL' | 'WHOLESALE' | 'INDUSTRY';
  kycStatus: 'VERIFIED' | 'PENDING' | 'FAILED' | 'unverified';
  maroonUserId: string; // Firebase Auth UID - links to Maroon app user
  cashBalance: number;
  fundingBalance?: number; // Balance available for purchases (0% fee)
  pendingDeposits?: number; // Deposits in transit
  alAccountNumber?: string; // AL-XXXXXX account identifier
  lifetimeBuyTotal: number;
  createdAt: string;
  updatedAt: string;
}

// Vault Holdings - precious metals held in vault for customer
export interface VaultHolding {
  id: string;
  customerId: string;
  metal: 'gold' | 'silver' | 'platinum' | 'palladium';
  weightOzt: number;
  costBasis?: number;
  purchasePricePerOzt?: number;
  currentValue?: number;
  sourceOrderId?: string;
  status: 'held' | 'pending_withdrawal' | 'withdrawn';
  depositedAt: string;
  updatedAt: string;
}

// Shared Transaction record - visible in Command Center
export interface SharedTransaction {
  id: string;
  customerId: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'transfer';
  metal?: string;
  weightOzt?: number;
  pricePerOzt?: number;
  amount: number;
  source: 'MAROON' | 'SHOPIFY' | 'POS' | 'ADMIN';
  status: string;
  fiztradeLockStatus?: 'pending' | 'locked' | 'filled' | 'expired';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

// Task for Command Center task queue
export interface SharedTask {
  id: string;
  type: string;
  label: string;
  detail: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  entityType?: string;
  entityId?: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}
