-- ============================================================================
--  schema.sql — database structure
-- ============================================================================
--  Run automatically on server startup by db-pool.js (initDb). You can also
--  run it manually against your database, e.g.:
--    psql "$DATABASE_URL" -f schema.sql
--
--  Safe to run every time the server boots — CREATE TABLE IF NOT EXISTS
--  doesn't wipe existing guest responses, and the migration block below
--  only acts if the old columns are still present.
-- ============================================================================

CREATE TABLE IF NOT EXISTS rsvps (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    attending     BOOLEAN NOT NULL,
    guest_count   INTEGER NOT NULL DEFAULT 1,
    song_request  TEXT,
    message       TEXT,
    submitted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rsvps_submitted_at ON rsvps (submitted_at DESC);

-- ----------------------------------------------------------------------------
-- Migration: earlier versions of this table had `email`, `meal_choice`, and
-- `language` columns instead of `phone`. This block only runs its actions
-- when those old columns still exist, so it's a no-op on a fresh database
-- (where CREATE TABLE above already created the table with `phone`).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Rename email -> phone, but only if email exists and phone doesn't yet
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvps' AND column_name = 'email'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvps' AND column_name = 'phone'
  ) THEN
    ALTER TABLE rsvps RENAME COLUMN email TO phone;
  END IF;
END $$;

-- Meal choice and language are no longer collected — drop if present.
ALTER TABLE rsvps DROP COLUMN IF EXISTS meal_choice;
ALTER TABLE rsvps DROP COLUMN IF EXISTS language;
