-- Phase 2 Foundation: Create support_tickets, wallet tables, and AL account numbers
-- Created: Feb 5, 2026

-- 1. Support tickets table (used by supportService.ts)
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can read own tickets" ON support_tickets
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 2. Wallet transactions ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
    transaction_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('deposit', 'purchase', 'refund', 'withdrawal', 'adjustment', 'liquidation')),
    amount DECIMAL(14,2) NOT NULL,
    balance_before DECIMAL(14,2),
    balance_after DECIMAL(14,2),
    deposit_id INTEGER,
    invoice_id INTEGER,
    description VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer ON wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

-- 3. Wallet deposits (for Plaid matching)
CREATE TABLE IF NOT EXISTS wallet_deposits (
    deposit_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    expected_amount DECIMAL(14,2),
    actual_amount DECIMAL(14,2),
    plaid_transaction_id VARCHAR(100),
    sender_name VARCHAR(200),
    memo_text VARCHAR(500),
    match_method VARCHAR(50) CHECK (match_method IN ('al_number', 'name_amount', 'name_only', 'manual')),
    match_confidence DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'credited', 'failed', 'refunded')),
    credited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_deposits_customer ON wallet_deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_status ON wallet_deposits(status);

-- 4. Add AL account number column to customers (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'al_account_number'
    ) THEN
        ALTER TABLE customers ADD COLUMN al_account_number VARCHAR(20) UNIQUE;
    END IF;
END $$;
