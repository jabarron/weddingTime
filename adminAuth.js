/**
 * ============================================================================
 *  adminAuth.js — protects the admin panel
 * ============================================================================
 *  Wraps express-basic-auth so anything mounted behind this middleware asks
 *  the browser for a username + password before it lets the request through.
 *
 *  Credentials come from environment variables (never hard-code them):
 *    ADMIN_USER      — ✏️ EDIT ME in your .env file (see .env.example)
 *    ADMIN_PASSWORD  — ✏️ EDIT ME in your .env file (see .env.example)
 *
 *  Used by server.js to protect both:
 *    - the /admin static pages   (admin.html)
 *    - the /api/admin/* routes   (routes-admin.js)
 * ============================================================================
 */

const basicAuth = require('express-basic-auth');

const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUser || !adminPassword) {
  console.warn(
    '[auth] WARNING: ADMIN_USER / ADMIN_PASSWORD are not set. ' +
      'The admin panel will reject all logins until you set them in .env.'
  );
}

const adminAuth = basicAuth({
  users: { [adminUser || 'admin']: adminPassword || 'change-me' },
  challenge: true, // triggers the browser's built-in login prompt
  realm: 'Wedding Admin',
  unauthorizedResponse: () => ({
    error: 'Invalid credentials.',
  }),
});

module.exports = adminAuth;
