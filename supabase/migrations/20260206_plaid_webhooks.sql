-- Phase 2.5: Plaid Webhook + Auto-Match Deposits
-- Created: Feb 6, 2026

-- 1. Webhook idempotency table (prevents duplicate processing)
CREATE TABLE IF NOT EXISTS plaid_webhook_events (
    webhook_id VARCHAR(100) PRIMARY KEY,
    transfer_id VARCHAR(100),
    webhook_type VARCHAR(50),
    webhook_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_transfer ON plaid_webhook_events(transfer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON plaid_webhook_events(processed_at DESC);

-- 2. Trigger to process matched deposits into funding_transactions
-- When wallet_deposits.status changes to 'credited', create a funding_transaction
CREATE OR REPLACE FUNCTION process_matched_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes TO 'credited'
    IF NEW.status = 'credited' AND (OLD.status IS NULL OR OLD.status != 'credited') THEN
        -- Insert into funding_transactions (which triggers balance update via existing trigger)
        INSERT INTO funding_transactions (
            customer_id,
            type,
            amount,
            status,
            plaid_transfer_id,
            description,
            initiated_at,
            completed_at
        ) VALUES (
            NEW.customer_id,
            'deposit',
            NEW.actual_amount,
            'completed',
            NEW.plaid_transaction_id,
            'Wire deposit matched by ' || COALESCE(NEW.match_method, 'manual'),
            NOW(),
            NOW()
        );

        -- Update credited_at timestamp
        NEW.credited_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (BEFORE UPDATE so we can modify credited_at)
DROP TRIGGER IF EXISTS trg_process_matched_deposit ON wallet_deposits;
CREATE TRIGGER trg_process_matched_deposit
    BEFORE UPDATE ON wallet_deposits
    FOR EACH ROW
    EXECUTE FUNCTION process_matched_deposit();

-- 3. Add RLS policies for plaid_webhook_events (service role only)
ALTER TABLE plaid_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events (no user access)
CREATE POLICY "Service role only" ON plaid_webhook_events
    FOR ALL USING (auth.role() = 'service_role');
