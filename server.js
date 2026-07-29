/**
 * ============================================================================
 *  server.js — application entry point
 * ============================================================================
 *  FLAT LAYOUT NOTE: every file lives in this one root folder (no /public,
 *  /routes, /config subfolders) to make it easy to drag-and-drop into
 *  GitHub while testing. That means this server can't just blanket-serve
 *  "the whole folder" as static files the way a typical Express app would —
 *  that would let anyone download server.js, wedding-config.js, db-pool.js,
 *  etc. straight from the browser. Instead:
 *
 *    - BLOCKED_FILES below is an explicit list of server-side files that
 *      must NEVER be sent to the browser as a static file.
 *    - A tiny middleware checks every request against that list before the
 *      static file server ever runs, and returns 404 if it matches.
 *    - admin.html is double-protected: it's in BLOCKED_FILES (so it can't
 *      be fetched directly) AND only reachable through the explicit
 *      GET /admin route below, which requires admin login first.
 *    - Dotfiles (.env, .gitignore, .env.example) are never served by
 *      express.static by default, so those are already safe.
 *
 *  When you're ready to reorganize into folders later, move the backend
 *  files (server.js, *-pool.js, routes-*.js, adminAuth.js, wedding-config.js,
 *  schema.sql) into a non-public folder and you can delete this guard —
 *  express.static only serving that specific public folder becomes the
 *  guard at that point instead.
 *
 *  Boot order (what happens when you run `npm start`):
 *    1. Load environment variables from .env               (dotenv)
 *    2. Connect to the database + ensure the schema exists  (db-pool.js)
 *    3. Set up Express: JSON parsing, the file-blocking guard
 *    4. Mount routes:
 *         GET  /api/wedding-info    -> routes-info.js   (public)
 *         POST /api/rsvp            -> routes-rsvp.js   (public)
 *         GET  /admin               -> admin.html, behind adminAuth
 *         /api/admin/*              -> routes-admin.js, behind adminAuth
 *         everything else           -> static files (index.html, styles.css,
 *                                       main.js, i18n.js, rsvp-form.js,
 *                                       admin.css, admin.js)
 *    5. Start listening on process.env.PORT (Railway sets this for you)
 * ============================================================================
 */

require('dotenv').config();

const path = require('path');
const express = require('express');

const { initDb } = require('./db-pool');
const adminAuth = require('./adminAuth');

const infoRoutes = require('./routes-info');
const rsvpRoutes = require('./routes-rsvp');
const adminRoutes = require('./routes-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Files that must NEVER be sent to the browser, even though they live in
// the same folder as the public site files. Checked by filename only.
// ---------------------------------------------------------------------------
const BLOCKED_FILES = new Set([
  'server.js',
  'package.json',
  'package-lock.json',
  'wedding-config.js',
  'db-pool.js',
  'schema.sql',
  'adminAuth.js',
  'routes-info.js',
  'routes-rsvp.js',
  'routes-admin.js',
  'admin.html', // only reachable via the protected GET /admin route below
  'README.md',
]);

app.use((req, res, next) => {
  const filename = path.basename(req.path);
  if (BLOCKED_FILES.has(filename)) {
    return res.status(404).end();
  }
  next();
});

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(express.json()); // parses JSON request bodies (RSVP submissions)

// ---------------------------------------------------------------------------
// Public API routes
// ---------------------------------------------------------------------------
app.use('/api/wedding-info', infoRoutes);
app.use('/api/rsvp', rsvpRoutes);

// ---------------------------------------------------------------------------
// Admin: the HTML page and the API are both behind adminAuth. admin.css and
// admin.js aren't secret (no data in them) so they're served normally by
// the static handler below — only the page and the data need the login.
// ---------------------------------------------------------------------------
app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.use('/api/admin', adminAuth, adminRoutes);

// ---------------------------------------------------------------------------
// Public static site — everything left over (index.html, styles.css,
// main.js, i18n.js, rsvp-form.js, admin.css, admin.js). Comes after the
// BLOCKED_FILES guard and the routes above so those take priority.
// ---------------------------------------------------------------------------
app.use(express.static(__dirname));

// ---------------------------------------------------------------------------
// 404 handler — anything that reaches here matched no route or static file.
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ---------------------------------------------------------------------------
// Central error handler — catches anything thrown/passed via next(err)
// in the routes above so the server never crashes on a single bad request.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Boot: ensure the database schema exists, then start listening.
// ---------------------------------------------------------------------------
initDb().finally(() => {
  app.listen(PORT, () => {
    console.log(`[server] Wedding site running on port ${PORT}`);
  });
});
