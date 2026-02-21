-- Migration 0014: User-level merchant name → normalized merchant mappings
--
-- Stores user-defined mappings: merchant_name_key (LOWER TRIM of merchant_name)
-- → merchant_normalized. Applied at AI-extraction and manual-creation time to
-- override the AI-extracted merchant_normalized with the user's preference.
--
-- Matching is case-insensitive via pre-stored lowercase key (no LOWER() at query time).
-- One mapping per user per merchant_name_key (UPSERT on conflict).

CREATE TABLE IF NOT EXISTS fb_merchant_mappings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name_key   text        NOT NULL,   -- LOWER(TRIM(merchant_name))
  merchant_normalized text        NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, merchant_name_key)
);

-- Fast point-lookup by user + key
CREATE INDEX IF NOT EXISTS fb_merchant_mappings_user_key_idx
  ON fb_merchant_mappings(user_id, merchant_name_key);

-- RLS: each user can only read/write their own mappings
ALTER TABLE fb_merchant_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_mappings_select" ON fb_merchant_mappings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "merchant_mappings_insert" ON fb_merchant_mappings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "merchant_mappings_update" ON fb_merchant_mappings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "merchant_mappings_delete" ON fb_merchant_mappings
  FOR DELETE USING (user_id = auth.uid());
