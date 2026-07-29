/**
 * ============================================================================
 *  routes-admin.js — /api/admin/*
 * ============================================================================
 *  Everything in this file is already protected by adminAuth.js
 *  at the point it's mounted in server.js — no auth checks needed here.
 *
 *    GET    /api/admin/rsvps        list every RSVP response + a summary
 *    DELETE /api/admin/rsvps/:id    remove a single response (e.g. a test
 *                                   submission or duplicate)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { query } = require('./db-pool');

// GET /api/admin/rsvps — full guest list + attendance summary
router.get('/rsvps', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, email, attending, guest_count, meal_choice,
              song_request, message, language, submitted_at
       FROM rsvps
       ORDER BY submitted_at DESC`
    );

    const summary = rows.reduce(
      (acc, row) => {
        if (row.attending) {
          acc.attendingResponses += 1;
          acc.totalGuestsAttending += row.guest_count;
        } else {
          acc.declinedResponses += 1;
        }
        return acc;
      },
      { attendingResponses: 0, declinedResponses: 0, totalGuestsAttending: 0 }
    );

    res.json({ summary, responses: rows });
  } catch (err) {
    console.error('[admin] Failed to fetch RSVPs:', err.message);
    res.status(500).json({ error: 'Could not load RSVP responses.' });
  }
});

// DELETE /api/admin/rsvps/:id — remove a single response
router.delete('/rsvps/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid RSVP id.' });
  }

  try {
    const result = await query('DELETE FROM rsvps WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'RSVP not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[admin] Failed to delete RSVP:', err.message);
    res.status(500).json({ error: 'Could not delete RSVP.' });
  }
});

module.exports = router;
