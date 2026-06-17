-- Stock count for non-unique products.
--
-- NULL    = untracked / unlimited. This is the default and matches today's
--           behavior: a non one-of-a-kind product without a stock value never
--           sells out.
-- a number = tracked inventory. The product is sold out once it reaches 0.
--
-- One-of-a-kind products ignore this column entirely (they use is_sold, set by
-- the Stripe webhook on purchase). Availability across the site is
-- "is_sold OR stock <= 0"; the webhook decrements stock on each paid order.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER;

COMMENT ON COLUMN products.stock IS
  'Remaining pieces for non one-of-a-kind products. NULL = untracked/unlimited. 0 = sold out. Decremented by the Stripe webhook on purchase.';
