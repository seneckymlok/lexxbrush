-- ─── Orders · Stripe invoice fields ─────────────────────────────────────────
--
-- Stripe generates an invoice for every checkout session (invoice_creation
-- is enabled in app/api/checkout/route.ts). Until now we fetched the PDF
-- in the webhook only to attach it to the customer email and threw it away.
--
-- These columns let the admin panel show "Invoice 0001-0042" with a "View"
-- link to Stripe's hosted page and a "PDF" link to download — no more
-- digging through the Stripe Dashboard to send a customer their invoice.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_invoice_id   text,
  ADD COLUMN IF NOT EXISTS invoice_number      text,
  ADD COLUMN IF NOT EXISTS invoice_hosted_url  text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url     text;

-- The pdf URL Stripe gives us is signed and rotates periodically (~30 days
-- by spec), but the hosted_url is stable. We store both so the admin has
-- the fastest possible download link while it's fresh, and a permanent
-- fallback. If the pdf link expires the admin can always re-download from
-- the hosted page or Stripe Dashboard via the invoice id.
