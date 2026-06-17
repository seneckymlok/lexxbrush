-- Scheduled drops: a release timestamp on products.
--
-- NULL            → visible immediately (every existing product is unaffected).
-- future timestamp → hidden from all public listings and its detail page until
--                    that moment, then it appears automatically (within the
--                    homepage/detail ISR window, ~60s).
--
-- Filtering happens in lib/products.ts (the public anon read path); the admin
-- uses the service-role API and always sees scheduled products.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

COMMENT ON COLUMN products.released_at IS
  'Scheduled drop time (UTC). NULL = live now. A future value hides the product from the public site until then.';

-- Speeds up the "released_at IS NULL OR released_at <= now()" filter once there
-- are many products. Harmless on small tables.
CREATE INDEX IF NOT EXISTS products_released_at_idx ON products (released_at);
