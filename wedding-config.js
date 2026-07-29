/**
 * ============================================================================
 *  ✏️  EDIT ME — WEDDING CONFIG
 * ============================================================================
 *  This is the ONE file you should need to touch to update the facts of the
 *  wedding (names, date, venue, colors, RSVP deadline, meal choices).
 *
 *  Everything in this file is loaded by the server and sent to the public
 *  website through the `GET /api/wedding-info` endpoint (see routes-info.js),
 *  so a change here updates the live site automatically — no HTML editing
 *  required for these values.
 *
 *  Anywhere else in the codebase that also needs a manual edit (translated
 *  paragraphs, dress code copy, etc.) is marked with the same "✏️ EDIT ME"
 *  banner, in i18n.js.
 * ============================================================================
 */

module.exports = {
  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: The couple
  // ---------------------------------------------------------------------
  couple: {
    partner1: 'Ismeraí',
    partner2: 'Jesús',
  },

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: Date & time of the wedding
  // Use ISO 8601 with the UTC offset for Ciudad Juárez, Chihuahua.
  // Cd. Juárez follows US Mountain Time (MST/MDT). May 1 falls under
  // Daylight Saving Time, so the offset below is -06:00 (MDT).
  // Double-check this offset closer to the date in case DST rules change.
  // ---------------------------------------------------------------------
  weddingDateISO: '2027-05-01T18:00:00-06:00',

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: Venue / location
  // `mapsQuery` is used to build the "Open in Google Maps" link.
  // ---------------------------------------------------------------------
  venue: {
    name: 'Jardín',
    addressLine: 'Cd. Juárez, Chihuahua, México',
    mapsQuery: 'Jardín, Ciudad Juárez, Chihuahua, México',
  },

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: RSVP deadline shown to guests (YYYY-MM-DD)
  // ---------------------------------------------------------------------
  rsvpDeadlineISO: '2027-04-01',

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: Meal choices offered on the RSVP form.
  // `value` is what gets stored in the database; `es` / `en` are the
  // labels shown to guests depending on the selected site language.
  // ---------------------------------------------------------------------
  mealOptions: [
    { value: 'beef', es: 'Res', en: 'Beef' },
    { value: 'chicken', es: 'Pollo', en: 'Chicken' },
    { value: 'vegetarian', es: 'Vegetariano', en: 'Vegetarian' },
  ],

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: Contact email shown in the footer / for guest questions
  // ---------------------------------------------------------------------
  contactEmail: 'ismerai.jesus.boda@example.com',

  // ---------------------------------------------------------------------
  // Color palette — pulled directly from the couple's chosen palette.
  // Used both by the frontend (via /api/wedding-info) and documented
  // here as the single source of truth. Change with care: these values
  // are threaded through styles.css as CSS custom properties
  // AND injected at runtime, so update BOTH places if you change a value
  // (see the :root block at the top of styles.css).
  // ---------------------------------------------------------------------
  colors: {
    wine: '#48011F', // deep wine — headers, nav, footer, primary text on light bg
    berry: '#9D3A56', // berry rose — links, secondary accents
    mauve: '#B06F6B', // dusty mauve — soft dividers, secondary buttons
    terracotta: '#C3634D', // terracotta — primary CTA buttons, highlights
    cream: '#DFD8C6', // warm cream — base background, cards
  },
};
