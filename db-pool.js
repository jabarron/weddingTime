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
  // Helps prevent idle connections from being silently dropped by the
  // network before pg's own idle timeout even kicks in.
  keepAlive: true,
});

pool.on('error', (err) => {
  // Catches errors on idle clients in the pool so they don't crash the
  // whole process (the default behavior of the `pg` library).
  console.error('[db] Unexpected error on idle client', err);
});

// Connection-related error codes/messages worth ONE automatic retry.
// These are typically transient — e.g. the pool's last connection had
// gone idle (closed automatically after ~10s of inactivity) and the
// first attempt to open a fresh one hit a momentary network hiccup —
// not a problem with the query itself. Retrying almost always succeeds
// immediately, which is exactly the "works on the second click" pattern
// this fixes: now the retry happens automatically, invisibly to the guest.
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', '57P01']);

function isRetryableError(err) {
  return RETRYABLE_CODES.has(err.code) || /connection/i.test(err.message || '');
}

/**
 * Runs a SQL query against the pool. Thin wrapper kept in one place so
 * routes don't each need to import `pg` directly. Automatically retries
 * once, after a short pause, on a connection-related failure — see
 * isRetryableError above for what qualifies.
 */
async function query(text, params, _isRetry = false) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (!_isRetry && isRetryableError(err)) {
      console.warn('[db] Query failed on a connection error, retrying once:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 250));
      return query(text, params, true);
    }
    throw err;
  }
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
    // Uses query() (not pool.query() directly) so the very first
    // connection attempt at server boot gets the same automatic retry
    // as every other query — this is actually the MOST likely place to
    // hit a cold-start connection hiccup, since it's the first-ever
    // connection this process makes.
    await query(schemaSql);
    console.log('[db] Schema ready (rsvps table present).');
  } catch (err) {
    console.error('[db] Failed to initialize schema:', err.message);
  }
}

module.exports = { query, initDb, pool };
