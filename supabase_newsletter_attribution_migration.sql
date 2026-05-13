-- ─── Newsletter Phase 4 — attribution + segmentation ────────────────────────
--
-- Adds the recipient snapshot we need to attribute revenue to a campaign
-- correctly: it tells us EXACTLY which emails received the send (vs. just
-- "who's confirmed right now"). Without this column, attribution would
-- count post-send subscribers' orders as if they came from the campaign.

ALTER TABLE newsletter_campaigns
  ADD COLUMN IF NOT EXISTS recipient_emails TEXT[];

-- GIN index makes `recipient_emails @> ARRAY[lower(email)]::text[]` fast
-- on the orders attribution join.
CREATE INDEX IF NOT EXISTS newsletter_campaigns_recipient_emails_gin_idx
  ON newsletter_campaigns USING GIN (recipient_emails);
