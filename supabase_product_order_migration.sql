-- Manual product ordering for the admin panel.
--
-- sort_order drives the order products appear in, lowest first. Existing rows
-- are backfilled to match their current display order (created_at DESC), so the
-- shop looks identical until the admin drags something. NULL = unpositioned and
-- floats to the top as "newest" (that's where freshly added products land until
-- they're placed).
--
-- Ordering is applied in lib/products.ts (public) and the admin list; the admin
-- writes new positions via /api/admin/reorder.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Backfill only rows that don't have a position yet, preserving today's order.
UPDATE products p
SET sort_order = sub.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1) AS rn
  FROM products
) sub
WHERE p.id = sub.id
  AND p.sort_order IS NULL;

COMMENT ON COLUMN products.sort_order IS
  'Manual catalog position, lowest first. NULL floats to the top (newest). Set via the admin reorder UI.';

CREATE INDEX IF NOT EXISTS products_sort_order_idx ON products (sort_order);
