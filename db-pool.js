/**
 * ============================================================================
 *  db-pool.js — PostgreSQL connection pool
 * ============================================================================
 *  Every other file that needs to talk to the database imports `query()`
 *  from here rather than creating its own connection. This keeps a single
 *  shared pool of connections instead of opening a new one per request.
 *
 *  Connection order in the app:
 *    server.js
 *      -> requires db-pool.js         (this file, sets up the pool)
 *      -> calls initDb()              (creates the rsvps table if missing)
 *      -> mounts routes-*.js          (routes call `query()` from here)
 *
 *  Railway note: when you attach a PostgreSQL plugin on Railway, it injects
 *  a DATABASE_URL environment variable automatically — nothing to configure
 *  by hand. Locally, set DATABASE_URL in your .env file (see .env.example).
 * ============================================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Railway (and most hosts) provide a single DATABASE_URL connection string.
// Locally, fall back to individual PG* variables if DATABASE_URL isn't set.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // We don't crash here — the server can still boot and serve the public
  // pages even if the database isn't configured yet. RSVP submissions and
  // the admin dashboard will simply fail with a clear error until it is.
  console.warn(
    '[db] WARNING: DATABASE_URL is not set. RSVP storage will not work ' +
      'until you configure a PostgreSQL database (see .env.example).'
  );
}

const pool = new Pool({
  connectionString,
  // Railway's managed Postgres requires SSL in production but not always
  // locally, so we only enable it when NODE_ENV is production.
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', (err) => {
  // Catches errors on idle clients in the pool so they don't crash the
  // whole process (the default behavior of the `pg` library).
  console.error('[db] Unexpected error on idle client', err);
});

/**
 * Runs a SQL query against the pool. Thin wrapper kept in one place so
 * routes don't each need to import `pg` directly.
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Creates the `rsvps` table if it doesn't already exist. Safe to run on
 * every server startup — CREATE TABLE IF NOT EXISTS is idempotent.
 */
async function initDb() {
  if (!connectionString) return; // nothing to do without a connection

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schemaSql);
    console.log('[db] Schema ready (rsvps table present).');
  } catch (err) {
    console.error('[db] Failed to initialize schema:', err.message);
  }
}

module.exports = { query, initDb, pool };
