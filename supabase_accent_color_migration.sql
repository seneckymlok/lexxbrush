-- Add accent gradient colors to products
-- Two hex columns for the CTA button gradient (from → to).
-- Both nullable — products without values fall back to brand purple / blue in the UI.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS accent_color           TEXT,
  ADD COLUMN IF NOT EXISTS accent_color_secondary TEXT;

COMMENT ON COLUMN products.accent_color IS
  'Gradient start hex (#RRGGBB). Auto-extracted from the first product image on upload, admin-editable.';
COMMENT ON COLUMN products.accent_color_secondary IS
  'Gradient end hex (#RRGGBB). Extracted as a hue-distant second accent. Falls back to a triadic shift of accent_color.';
