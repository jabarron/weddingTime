/**
 * ============================================================================
 *  routes-rsvp.js — POST /api/rsvp
 * ============================================================================
 *  Handles guest RSVP submissions from the public site (rsvp-form.js posts
 *  here). Validates the payload, then inserts a row into the `rsvps` table
 *  via db-pool.js.
 *
 *  Required fields: fullName, phone, attending. Everything else is optional.
 *  This mirrors the required-field check done client-side in rsvp-form.js —
 *  that one gives the guest instant feedback, this one is the safety net
 *  in case the request didn't come through the form (or JS was bypassed).
 *
 *  Access model: open to anyone with the link (no guest-list validation),
 *  per the site's current requirements. If you later want to restrict who
 *  can submit, this is the file to add that check to.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { query } = require('./db-pool');

router.post('/', async (req, res) => {
  const { fullName, phone, attending, guestCount, songRequest, message } =
    req.body || {};

  // --- Validation -----------------------------------------------------
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (typeof phone !== 'string' || phone.trim().length === 0) {
    return res.status(400).json({ error: 'Phone is required.' });
  }
  if (typeof attending !== 'boolean') {
    return res
      .status(400)
      .json({ error: 'Attending must be true or false.' });
  }

  const safeGuestCount =
    Number.isInteger(guestCount) && guestCount > 0 ? guestCount : 1;

  try {
    const result = await query(
      `INSERT INTO rsvps
        (full_name, phone, attending, guest_count, song_request, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, submitted_at`,
      [
        fullName.trim(),
        phone.trim(),
        attending,
        safeGuestCount,
        songRequest ? String(songRequest).trim() : null,
        message ? String(message).trim() : null,
      ]
    );

    return res.status(201).json({
      success: true,
      id: result.rows[0].id,
      submittedAt: result.rows[0].submitted_at,
    });
  } catch (err) {
    console.error('[rsvp] Failed to save RSVP:', err.message);
    return res
      .status(500)
      .json({ error: 'Something went wrong saving your RSVP. Please try again.' });
  }
});

module.exports = router;
