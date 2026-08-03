/**
 * ============================================================================
 *  ✏️  EDIT ME — WEDDING CONFIG
 * ============================================================================
 *  This is the ONE file you should need to touch to update the facts of the
 *  wedding (names, date, venue, colors, RSVP deadline).
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
  weddingDateISO: '2027-05-01T12:00:00-06:00',

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: Venue / location
  // `mapsQuery` is used to build the "Open in Google Maps" link.
  // ---------------------------------------------------------------------
  venue: {
    name: 'Ocua Loft',
    addressLine: 'Cd. Juárez, Chihuahua, México',
    // Using the exact coordinates given (instead of a text search) so the
    // "Open in Google Maps" link drops the pin precisely on the venue,
    // not on whatever a text search happens to resolve to.
    mapsQuery: '31.691243,-106.350304',
  },

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: RSVP deadline shown to guests (YYYY-MM-DD)
  // ---------------------------------------------------------------------
  rsvpDeadlineISO: '2027-04-01',

  // ---------------------------------------------------------------------
  // ✏️ EDIT ME: The day's itinerary, shown as a timeline. Add, remove, or
  // reorder events freely — the site renders whatever's in this array, in
  // this order. `time` is shown as-is (any format you like); `es`/`en` are
  // the event name in each language. `icon` picks the small icon shown
  // next to the event — available options: rings, book, cocktail, dinner,
  // music, toast, cake, disco, sparkle. Unknown/omitted values fall back
  // to a plain dot.
  // ---------------------------------------------------------------------
  itinerary: [
    { time: '12:00 PM', es: 'Ceremonia Civil', en: 'Civil Ceremony', icon: 'rings' },
    { time: '5:00 PM', es: 'Ceremonia Religiosa', en: 'Religious Ceremony', icon: 'church' },
    { time: '6:30 PM', es: 'Cóctel de Bienvenida', en: 'Welcome Cocktail', icon: 'cocktail' },
    { time: '8:30 PM', es: 'Primer Baile', en: 'First Dance', icon: 'music' },
    { time: '9:00 PM', es: 'Brindis', en: 'Toasts', icon: 'toast' },
    { time: '10:00 PM', es: 'Corte de Pastel', en: 'Cake Cutting', icon: 'cake' },
    { time: '10:30 PM', es: 'Fiesta y Baile', en: 'Party & Dancing', icon: 'disco' },
    { time: '12:00 AM', es: 'Despedida', en: 'Send Off', icon: 'sparkle' },
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
