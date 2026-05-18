-- Site-wide settings (singleton row). Used by middleware.ts to gate public
-- traffic behind a lock screen, and by /admin/lock to manage it.
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  lock_enabled BOOLEAN NOT NULL DEFAULT false,
  lock_title_en TEXT NOT NULL DEFAULT 'BACK SOON.',
  lock_title_sk TEXT NOT NULL DEFAULT 'O CHVÍĽU.',
  lock_subtitle_en TEXT NOT NULL DEFAULT 'Putting on the finishing touches.',
  lock_subtitle_sk TEXT NOT NULL DEFAULT 'Dolaďujeme posledné detaily.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public + authenticated can read the lock state (middleware needs it).
DROP POLICY IF EXISTS "site_settings_anon_read" ON site_settings;
CREATE POLICY "site_settings_anon_read"
  ON site_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "site_settings_authenticated_read" ON site_settings;
CREATE POLICY "site_settings_authenticated_read"
  ON site_settings FOR SELECT TO authenticated USING (true);

-- Writes happen only via the admin API using the service role key,
-- which bypasses RLS - so no INSERT/UPDATE policy is needed.
