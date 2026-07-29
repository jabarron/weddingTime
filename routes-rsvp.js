/**
 * ============================================================================
 *  routes-rsvp.js — POST /api/rsvp
 * ============================================================================
 *  Handles guest RSVP submissions from the public site (rsvp-form.js
 *  posts here). Validates the payload, then inserts a row into the `rsvps`
 *  table via db-pool.js.
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
  const {
    fullName,
    email,
    attending,
    guestCount,
    mealChoice,
    songRequest,
    message,
    language,
  } = req.body || {};

  // --- Validation -----------------------------------------------------
  // Keep this strict but simple: only full name and attending are truly
  // required to record a response.
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (typeof attending !== 'boolean') {
    return res
      .status(400)
      .json({ error: 'Attending must be true or false.' });
  }

  const safeGuestCount =
    Number.isInteger(guestCount) && guestCount > 0 ? guestCount : 1;
  const safeLanguage = language === 'en' ? 'en' : 'es';

  try {
    const result = await query(
      `INSERT INTO rsvps
        (full_name, email, attending, guest_count, meal_choice, song_request, message, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, submitted_at`,
      [
        fullName.trim(),
        email ? String(email).trim() : null,
        attending,
        safeGuestCount,
        mealChoice ? String(mealChoice).trim() : null,
        songRequest ? String(songRequest).trim() : null,
        message ? String(message).trim() : null,
        safeLanguage,
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
