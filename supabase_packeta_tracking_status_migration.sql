-- Persist Packeta tracking sync state on orders.
-- packeta_status_code:     latest numeric statusCode returned by packetStatus
-- packeta_status_text:     latest human-readable status text
-- packeta_last_synced_at:  when the cron last touched this order
-- shipped_at / delivered_at: transition timestamps, used to avoid duplicate emails
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS packeta_status_code   INTEGER,
  ADD COLUMN IF NOT EXISTS packeta_status_text   TEXT,
  ADD COLUMN IF NOT EXISTS packeta_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at          TIMESTAMPTZ;

-- Cron query filters on (packeta_packet_id IS NOT NULL) AND status IN ('paid','shipped');
-- partial index keeps it tight as the orders table grows.
CREATE INDEX IF NOT EXISTS orders_packeta_sync_idx
  ON orders (packeta_last_synced_at NULLS FIRST)
  WHERE packeta_packet_id IS NOT NULL
    AND status IN ('paid', 'shipped');
