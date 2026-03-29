-- Add Packeta delivery columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS packeta_packet_id TEXT,
  ADD COLUMN IF NOT EXISTS packeta_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'pickup';
