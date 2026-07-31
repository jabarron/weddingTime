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

-- gen_random_uuid() is built into Postgres 13+ core, but this makes sure
-- it's available regardless of exact version — harmless no-op if it
-- already is.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS rsvps (
    id            SERIAL PRIMARY KEY,
    public_id     VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
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

-- ----------------------------------------------------------------------------
-- Migration: add public_id to a table that already existed before this
-- column was introduced. A no-op on a fresh database, where CREATE TABLE
-- above already created it with the DEFAULT in place. Being a column on
-- the same row, deleting an RSVP (DELETE FROM rsvps WHERE id = ...)
-- automatically deletes its public_id too — nothing extra to clean up.
-- ----------------------------------------------------------------------------
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS public_id VARCHAR(36);
UPDATE rsvps SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE rsvps ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE rsvps ALTER COLUMN public_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rsvps_public_id_key'
  ) THEN
    ALTER TABLE rsvps ADD CONSTRAINT rsvps_public_id_key UNIQUE (public_id);
  END IF;
END $$;
