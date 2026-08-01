/**
 * ============================================================================
 *  session.js — simple in-memory session store for /admin
 * ============================================================================
 *  Deliberately minimal: no npm dependency (no express-session, no
 *  cookie-parser) — just a Map of random session IDs, plus small helpers
 *  to read/write the session cookie by hand. Sessions live only in this
 *  process's memory, so a server restart (e.g. every deploy) logs
 *  everyone out — an accepted trade-off for how small this admin panel
 *  is; see the README for the full reasoning.
 *
 *  Session lifetime: the cookie itself has no Max-Age/Expires, which
 *  makes it a browser "session cookie" — it disappears on its own when
 *  the browser closes. We don't separately expire sessions server-side;
 *  the browser closing (and discarding the cookie) is what ends it.
 *
 *  Session IDs are 256 bits of randomness (crypto.randomBytes), which is
 *  unguessable in practice — that's what makes this safe without also
 *  needing to cryptographically sign the cookie.
 * ============================================================================
 */

const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'admin_session';

// sessionId -> { createdAt }. The stored value isn't used for anything
// yet, but keeping it as an object (not just a Set) leaves room to add
// things later (e.g. "which admin", last-active time) without changing
// the shape everywhere that reads it.
const sessions = new Map();

/** Creates a new session and returns its ID (to be set as a cookie). */
function createSession() {
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { createdAt: Date.now() });
  return sessionId;
}

/** True if this session ID exists (was created by us and never destroyed). */
function isValidSession(sessionId) {
  return Boolean(sessionId) && sessions.has(sessionId);
}

/** Removes a session — not called anywhere yet (no logout button), but
    here so it's ready if that's added later. */
function destroySession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * Parses the raw Cookie header into a plain object. Hand-rolled instead
 * of pulling in the `cookie` package — this app only ever needs to read
 * one cookie, so a full parser would be more code than it saves.
 */
function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

/** Reads the session ID from the request's cookies, if present. */
function getSessionIdFromRequest(req) {
  return parseCookies(req)[SESSION_COOKIE_NAME];
}

/**
 * Sets the session cookie on the response. HttpOnly (JS on the page can't
 * read it — blocks a common attack vector), Secure in production only
 * (requires HTTPS; Railway provides this, but localhost dev doesn't),
 * SameSite=Lax (sane default, still allows the normal top-level
 * navigation this app uses). No Max-Age/Expires on purpose — see the
 * file header comment on session lifetime.
 */
function setSessionCookie(res, sessionId) {
  const parts = [`${SESSION_COOKIE_NAME}=${sessionId}`, 'HttpOnly', 'Path=/', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

module.exports = {
  createSession,
  isValidSession,
  destroySession,
  getSessionIdFromRequest,
  setSessionCookie,
};
