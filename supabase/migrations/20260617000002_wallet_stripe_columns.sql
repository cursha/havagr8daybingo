-- Add Stripe Checkout session tracking columns to wallet_transactions.
-- stripe_session_id: the Stripe Checkout session ID (cs_...)
-- status: 'pending' until the webhook confirms payment, then 'completed'

ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

CREATE UNIQUE INDEX IF NOT EXISTS wallet_txn_stripe_session_unique
  ON wallet_transactions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
