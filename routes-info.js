/**
 * ============================================================================
 *  routes-info.js — GET /api/wedding-info
 * ============================================================================
 *  Public, read-only endpoint. Serves the non-secret contents of
 *  wedding-config.js as JSON so the frontend (main.js) can
 *  render the names, date, venue, colors, and RSVP deadline
 *  without duplicating them inside the HTML.
 *
 *  This is intentionally the ONLY thing this route does — no database, no
 *  auth required, since none of this data is sensitive.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const weddingConfig = require('./wedding-config');

router.get('/', (req, res) => {
  res.json(weddingConfig);
});

module.exports = router;
