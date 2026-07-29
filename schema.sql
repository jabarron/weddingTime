-- ============================================================================
--  db/schema.sql — database structure
-- ============================================================================
--  Run automatically on server startup by db/pool.js (initDb). You can also
--  run it manually against your database, e.g.:
--    psql "$DATABASE_URL" -f db/schema.sql
--
--  IF_NOT_EXISTS makes this safe to run every time the server boots without
--  wiping existing guest responses.
-- ============================================================================

CREATE TABLE IF NOT EXISTS rsvps (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    attending     BOOLEAN NOT NULL,
    guest_count   INTEGER NOT NULL DEFAULT 1,
    meal_choice   VARCHAR(100),
    song_request  TEXT,
    message       TEXT,
    language      VARCHAR(5) NOT NULL DEFAULT 'es',
    submitted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Speeds up the admin dashboard's default "most recent first" sort.
CREATE INDEX IF NOT EXISTS idx_rsvps_submitted_at ON rsvps (submitted_at DESC);
