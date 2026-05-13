-- Add customer name + phone to orders so Packeta packet creation can use
-- the real name instead of deriving it from the email address.
-- These fields are populated from Stripe session metadata on checkout.session.completed.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name  TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;
