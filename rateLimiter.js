/**
 * ============================================================================
 *  rateLimiter.js — simple in-memory rate limiting, reusable per-route
 * ============================================================================
 *  A small factory instead of one hardcoded limiter, so both the public
 *  RSVP endpoint and the admin login endpoint can each get their own
 *  independent limit without duplicating this logic.
 *
 *  Deliberately simple: no new npm dependency, just a Map of
 *  IP -> recent request timestamps, checked on every request. This is
 *  enough for a small wedding site with modest traffic over a few months;
 *  it is NOT meant to scale to a high-traffic public API. The Map isn't
 *  actively pruned of IPs that stop requesting — for this site's expected
 *  lifetime and traffic that's not worth the extra complexity, and it
 *  resets naturally on every deploy/restart anyway.
 * ============================================================================
 */

function createRateLimiter({ windowMs, maxRequests, message }) {
  const requestLog = new Map(); // ip -> array of request timestamps (ms)

  return function rateLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();

    const recent = (requestLog.get(ip) || []).filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      return res.status(429).json({ error: message });
    }

    recent.push(now);
    requestLog.set(ip, recent);
    next();
  };
}

// Protects POST /api/rsvp from being spammed with fake submissions (the
// RSVP form is open to anyone with the link, with no guest-list check —
// see routes-rsvp.js — so this is the safety net against abuse instead).
const rsvpRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // per IP, per window — plenty for a real guest (even a
  // family submitting a few times to fix a typo), not enough for a spam
  // script to flood the table.
  message: 'Too many submissions from this connection. Please try again later.',
});

// A second, separate line of defense on POST /admin/login, on top of the
// "2nd wrong attempt shows the error page" logic in adminAuth.js — that
// one is about what a HUMAN sees when they mistype; this one is about
// stopping a SCRIPT from hammering the endpoint at high frequency.
const loginRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes — matches the login-attempts window
  maxRequests: 10,
  message: 'Too many login attempts from this connection. Please try again later.',
});

module.exports = { rsvpRateLimit, loginRateLimit };
