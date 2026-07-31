/**
 * ============================================================================
 *  rateLimiter.js — simple in-memory rate limiting for public endpoints
 * ============================================================================
 *  Protects POST /api/rsvp from being spammed with fake submissions (the
 *  RSVP form is open to anyone with the link, with no guest-list check —
 *  see routes-rsvp.js — so this is the safety net against abuse instead).
 *
 *  Deliberately simple: no new npm dependency, just a Map of
 *  IP -> recent request timestamps, checked on every request. This is
 *  enough for a small wedding site with modest traffic over a few months;
 *  it is NOT meant to scale to a high-traffic public API. The Map isn't
 *  actively pruned of IPs that stop requesting — for this site's expected
 *  lifetime and traffic that's not worth the extra complexity, and it
 *  resets naturally on every deploy/restart anyway.
 *
 *  Usage: app.use('/api/rsvp', rsvpRateLimit, rsvpRoutes) — see server.js.
 * ============================================================================
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // per IP, per window — plenty for a real guest
// (even a family submitting a few times to fix a typo), not enough for a
// spam script to flood the table.

const requestLog = new Map(); // ip -> array of request timestamps (ms)

function rsvpRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  const recent = (requestLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many submissions from this connection. Please try again later.',
    });
  }

  recent.push(now);
  requestLog.set(ip, recent);
  next();
}

module.exports = rsvpRateLimit;
