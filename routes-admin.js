/**
 * ============================================================================
 *  routes-admin.js — /api/admin/*
 * ============================================================================
 *  Everything in this file is already protected by adminAuth.js at the
 *  point it's mounted in server.js — no auth checks needed here.
 *
 *    GET    /api/admin/rsvps          list every RSVP response + a summary
 *    GET    /api/admin/rsvps/export   download all responses as an .xlsx
 *                                     file (used by the "Download Excel"
 *                                     button in admin.html)
 *    PATCH  /api/admin/rsvps/:id      edit a single response (used by the
 *                                     inline "Edit" button in admin.js)
 *    DELETE /api/admin/rsvps/:id      remove a single response (e.g. a test
 *                                     submission or duplicate)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { query } = require('./db-pool');

// GET /api/admin/rsvps — full guest list + attendance summary
router.get('/rsvps', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, phone, attending, guest_count,
              song_request, message, submitted_at
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

// GET /api/admin/rsvps/export — download every response as an .xlsx file.
// NOTE: this is defined with GET, so it can never collide with the
// PATCH/DELETE '/rsvps/:id' routes below even though the path looks
// similar — Express matches routes per HTTP method, and there's no other
// GET '/rsvps/:id' route in this file to conflict with.
router.get('/rsvps/export', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT full_name, phone, attending, guest_count,
              song_request, message, submitted_at
       FROM rsvps
       ORDER BY submitted_at DESC`
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ismeraí & Jesús Wedding Site';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('RSVPs');
    sheet.columns = [
      { header: 'Full Name', key: 'full_name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Attending', key: 'attending', width: 12 },
      { header: 'Guests', key: 'guest_count', width: 10 },
      { header: 'Song Request', key: 'song_request', width: 30 },
      { header: 'Message', key: 'message', width: 40 },
      { header: 'Submitted At', key: 'submitted_at', width: 22 },
    ];
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF48011F' }, // wine, matches the site palette
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((r) => {
      sheet.addRow({
        full_name: r.full_name,
        phone: r.phone,
        attending: r.attending ? 'Yes' : 'No',
        guest_count: r.guest_count,
        song_request: r.song_request || '',
        message: r.message || '',
        submitted_at: new Date(r.submitted_at).toLocaleString(),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rsvps-${new Date().toISOString().slice(0, 10)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[admin] Failed to export RSVPs:', err.message);
    res.status(500).json({ error: 'Could not export RSVPs.' });
  }
});

// PATCH /api/admin/rsvps/:id — edit a single response
// Same required-field rules as the public form: full name, phone, attending.
router.patch('/rsvps/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid RSVP id.' });
  }

  const { fullName, phone, attending, guestCount, songRequest, message } =
    req.body || {};

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

  // Same rule as routes-rsvp.js: 0 when not attending, must be an integer
  // between 1 and 2 when attending.
  let safeGuestCount;
  if (!attending) {
    safeGuestCount = 0;
  } else if (Number.isInteger(guestCount) && guestCount > 0 && guestCount <= 2) {
    safeGuestCount = guestCount;
  } else {
    return res
      .status(400)
      .json({ error: 'Guest count must be between 1 and 2 when attending.' });
  }

  try {
    const result = await query(
      `UPDATE rsvps
       SET full_name = $1, phone = $2, attending = $3, guest_count = $4,
           song_request = $5, message = $6
       WHERE id = $7
       RETURNING id, full_name, phone, attending, guest_count, song_request, message, submitted_at`,
      [
        fullName.trim(),
        phone.trim(),
        attending,
        safeGuestCount,
        songRequest ? String(songRequest).trim() : null,
        message ? String(message).trim() : null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'RSVP not found.' });
    }
    res.json({ success: true, response: result.rows[0] });
  } catch (err) {
    console.error('[admin] Failed to update RSVP:', err.message);
    res.status(500).json({ error: 'Could not update RSVP.' });
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
