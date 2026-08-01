/**
 * ============================================================================
 *  loginAttempts.js — tracks failed /admin login attempts per IP
 * ============================================================================
 *  Purely about which PAGE a failed attempt sees, not about blocking
 *  access — there's no lockout here. A correct password always logs you
 *  in immediately, no matter how many times you got it wrong before.
 *
 *  Rule (decided in conversation, not guessed): the 1st failed attempt
 *  from an IP shows the login form again with an "incorrect" message;
 *  the 2nd (and any further) failed attempt within the same 10-minute
 *  window shows the styled error page instead. The count resets 10
 *  minutes after the FIRST failure in the current window — not 10
 *  minutes after the most recent one — so a burst of retries doesn't
 *  keep pushing the reset further away.
 *
 *  Same in-memory-Map pattern as rateLimiter.js, for the same reason:
 *  this is plenty for how much traffic /admin gets, and resets naturally
 *  on every deploy/restart.
 * ============================================================================
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const attempts = new Map(); // ip -> { count, windowStartedAt }

/**
 * Call this after a WRONG password. Returns the attempt count for the
 * current window (1 on a fresh window, 2+ after that).
 */
function recordFailedAttempt(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.windowStartedAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStartedAt: now });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

/** Call this after a CORRECT password — clears their slate. */
function resetAttempts(ip) {
  attempts.delete(ip);
}

module.exports = { recordFailedAttempt, resetAttempts };
