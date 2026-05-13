-- ─── Newsletter (drop list) — Phase 1 ────────────────────────────────────────
--
-- Stores subscribers with GDPR-compliant double opt-in. Resend is used only
-- as a transport — the canonical list lives here.
--
-- Statuses:
--   pending       → waiting for confirm-link click (created at signup)
--   confirmed     → opted in, will receive campaigns
--   unsubscribed  → opted out via one-click link
--   bounced       → Resend reported a hard bounce
--   complained    → Resend reported a spam complaint (treated as forever-unsub)

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  locale           TEXT NOT NULL DEFAULT 'en',
  status           TEXT NOT NULL DEFAULT 'pending',
  source           TEXT,
  confirm_token    TEXT NOT NULL,
  unsub_token      TEXT NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_ip       TEXT,
  consent_source   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at     TIMESTAMPTZ,
  unsubscribed_at  TIMESTAMPTZ,
  last_event_at    TIMESTAMPTZ,
  last_event_note  TEXT,
  CONSTRAINT newsletter_subscribers_email_lower_unique UNIQUE (email),
  CONSTRAINT newsletter_subscribers_status_check
    CHECK (status IN ('pending','confirmed','unsubscribed','bounced','complained'))
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx
  ON newsletter_subscribers (status);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON newsletter_subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_unsub_token_idx
  ON newsletter_subscribers (unsub_token);

-- Lowercase email on write so future lookups are case-insensitive without an
-- expression index. Trigger keeps emails normalized.
CREATE OR REPLACE FUNCTION newsletter_subscribers_normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS newsletter_subscribers_normalize_email_trg ON newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_normalize_email_trg
  BEFORE INSERT OR UPDATE OF email ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION newsletter_subscribers_normalize_email();

-- ─── Campaigns ──────────────────────────────────────────────────────────────
--
-- Every send is recorded. Prevents accidental double-sends and powers
-- the admin "history" view + per-campaign stats from Resend webhooks.

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject           TEXT NOT NULL,
  preheader         TEXT,
  html              TEXT NOT NULL,
  audience_filter   JSONB NOT NULL DEFAULT '{"status":"confirmed"}'::JSONB,
  sent_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'draft',
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  delivered_count   INTEGER NOT NULL DEFAULT 0,
  opened_count      INTEGER NOT NULL DEFAULT 0,
  clicked_count     INTEGER NOT NULL DEFAULT 0,
  bounced_count     INTEGER NOT NULL DEFAULT 0,
  complained_count  INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at           TIMESTAMPTZ,
  CONSTRAINT newsletter_campaigns_status_check
    CHECK (status IN ('draft','sending','sent','failed'))
);

CREATE INDEX IF NOT EXISTS newsletter_campaigns_sent_at_idx
  ON newsletter_campaigns (sent_at DESC);

-- ─── Row Level Security ─────────────────────────────────────────────────────
--
-- Subscribers and campaigns are admin-only. The public-facing flows
-- (signup, confirm, unsubscribe) all go through API routes that use the
-- service-role key, so we lock the tables down completely from the anon key.

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns   ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon role → fully locked.
-- The service role bypasses RLS by design.
