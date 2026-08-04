/**
 * ============================================================================
 *  main.js — page behavior for the public site
 * ============================================================================
 *  Load order (see index.html <script> tags at the bottom of <body>):
 *    1. i18n.js          defines window.DICTIONARY
 *    2. main.js          (this file) fetches wedding facts, wires up
 *                         language switching and the countdown
 *    3. rsvp-form.js      handles the RSVP form specifically
 *
 *  Responsibilities of this file:
 *    - fetch /api/wedding-info and fill in names/date/venue/colors
 *    - apply the selected language across every [data-i18n] element
 *    - run the live countdown to the wedding date
 * ============================================================================
 */

(function () {
  let weddingInfo = null;
  let currentLanguage = localStorage.getItem('site-language') || 'es';

  // Small line-icon set for the itinerary timeline, keyed by the `icon`
  // value in wedding-config.js -> itinerary. Same thin-stroke style as the
  // header nav icons — more detailed/specific than before (per the
  // couple's reference photo of hand-drawn wedding doodles), but kept in
  // this same clean-line style rather than copying that hand-drawn look,
  // so they still match the rest of the site instead of feeling like a
  // different sub-site. `dot` is the fallback for an unknown/omitted icon.
  const TIMELINE_ICONS = {
    // Ceremonia Civil — interlocked wedding rings with a small gem accent.
    rings: '<circle cx="8.5" cy="15" r="4.5"/><circle cx="15.5" cy="15" r="4.5"/><path d="M15 4l2 2.5-2 2.5-2-2.5z"/>',
    // Ceremonia Religiosa — a small church (cross, peaked roof, door).
    // Renamed from "book" to "church" for clarity — see wedding-config.js
    // and the timeline__icon--accent check below, both updated to match.
    church: '<path d="M12 2v3"/><path d="M10.5 3.5h3"/><path d="M5 21V11L12 5l7 6v10"/><path d="M9.5 21v-5.5h5v5.5"/>',
    // Cóctel de Bienvenida — a single cocktail glass with a garnish line
    // (distinct from "toast" below, which is two glasses specifically
    // for the clinking/toasting moment).
    cocktail: '<path d="M5 4h14l-7 8v7"/><path d="M9 19h6"/><path d="M8 6.5h8"/>',
    // Primer Baile — kept music-themed (a proper pair of beamed eighth
    // notes) since the event is literally about the first dance's music.
    music: '<circle cx="7" cy="18" r="3"/><circle cx="15" cy="14" r="3"/><path d="M10 18V5l8-2v11"/>',
    // Brindis — two champagne flutes clinking together.
    toast: '<path d="M7 3h3l-.6 8.2a1.4 1.4 0 0 1-1.8 0L7 3z"/><path d="M8.5 11.2V18M6 18h5"/><path d="M14 6h3l-.5 6a1.4 1.4 0 0 1-2 0L14 6z"/><path d="M15.5 12v6M13 18h5"/>',
    // Corte de Pastel — round-topped single-tier cake with a wavy
    // decorative line, matching the couple's reference image.
    // Corte de Pastel — a simple cake slice (was a whole round-top
    // cake in the previous version).
    cake: '<path d="M4 19h16"/><path d="M6 19 12 6l6 13z"/><path d="M8.5 14h7"/><circle cx="12" cy="4" r="1"/>',
    // Fiesta y Baile — disco ball with a sparkle accent, matching the
    // couple's reference image (2nd redesign — an earlier version used
    // falling streamers/confetti instead).
    disco: '<circle cx="10" cy="12" r="6"/><path d="M4 12h12M10 6v12"/><path d="M6 8l8 8M14 8l-8 8"/><path d="M19 5.5l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z"/>',
    // Despedida — a single elegant sparkle/firework burst for the
    // midnight send-off, with two small trailing accent dots.
    sparkle: '<path d="M12 4l1.5 5.5L19 11l-5.5 1.5L12 18l-1.5-5.5L5 11l5.5-1.5z"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="18" r="1"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
  };

  /** Fetches the public wedding facts from the backend. */
  async function loadWeddingInfo() {
    try {
      const res = await fetch('/api/wedding-info');
      if (!res.ok) throw new Error('Request failed');
      weddingInfo = await res.json();
    } catch (err) {
      console.error('Could not load wedding info:', err);
      // Fall back to nothing rendered rather than breaking the page —
      // the static copy in index.html's data-i18n labels still shows.
    }
  }

  /** Applies the dictionary for `lang` to every element with data-i18n. */
  function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('site-language', lang);
    document.documentElement.lang = lang;

    const dict = window.DICTIONARY[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('.lang-toggle button').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang);
    });

    renderWeddingFacts(lang);
  }

  /** Fills in names, formatted date, venue, and RSVP deadline. */
  function renderWeddingFacts(lang) {
    if (!weddingInfo) return;

    const { couple, weddingDateISO, venue, rsvpDeadlineISO, itinerary } = weddingInfo;

    document.querySelectorAll('[data-field="partner1"]').forEach((el) => {
      el.textContent = couple.partner1;
    });
    document.querySelectorAll('[data-field="partner2"]').forEach((el) => {
      el.textContent = couple.partner2;
    });

    const weddingDate = new Date(weddingDateISO);
    const dateFormatter = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    document.querySelectorAll('[data-field="wedding-date-full"]').forEach((el) => {
      el.textContent = `${dateFormatter.format(weddingDate)} · ${timeFormatter.format(weddingDate)}`;
    });
    document.querySelectorAll('[data-field="wedding-date-short"]').forEach((el) => {
      el.textContent = dateFormatter.format(weddingDate);
    });

    document.querySelectorAll('[data-field="venue-name"]').forEach((el) => {
      el.textContent = venue.name;
    });
    document.querySelectorAll('[data-field="venue-address"]').forEach((el) => {
      el.textContent = venue.addressLine;
    });

    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.mapsQuery)}`;
    document.querySelectorAll('[data-field="venue-maps-link"]').forEach((el) => {
      el.href = mapsLink;
    });

    const rsvpDeadline = new Date(`${rsvpDeadlineISO}T00:00:00`);
    document.querySelectorAll('[data-field="rsvp-deadline"]').forEach((el) => {
      el.textContent = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(rsvpDeadline);
    });

    // Itinerary timeline — one <li> per event in wedding-config.js.
    // The `timeline__item--left`/`--right` class only matters at the
    // desktop breakpoint (see styles.css), where the line is centered and
    // items alternate sides; on mobile it's ignored (single column).
    const itineraryList = document.querySelector('[data-field="itinerary-list"]');
    if (itineraryList && Array.isArray(itinerary)) {
      itineraryList.innerHTML = itinerary
        .map((event, index) => {
          const iconPath = TIMELINE_ICONS[event.icon] || TIMELINE_ICONS.dot;
          const side = index % 2 === 0 ? 'left' : 'right';
          // Religious ceremony gets a slightly stronger ring than the
          // other icons — the one deliberate accent in an otherwise
          // monochrome itinerary (see .timeline__icon--accent in
          // styles.css).
          const accent = event.icon === 'church' ? ' timeline__icon--accent' : '';
          return `
        <li class="timeline__item timeline__item--${side}">
          <span class="timeline__icon${accent}" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
          </span>
          <span class="timeline__content">
            <span class="timeline__time">${event.time}</span>
            <span class="timeline__title">${event[lang]}</span>
          </span>
        </li>`;
        })
        .join('');
    }
  }

  /** Live countdown to the wedding date, updates once per second. */
  function startCountdown() {
    const daysEl = document.querySelector('[data-countdown="days"]');
    const hoursEl = document.querySelector('[data-countdown="hours"]');
    const minutesEl = document.querySelector('[data-countdown="minutes"]');
    const secondsEl = document.querySelector('[data-countdown="seconds"]');
    if (!daysEl || !weddingInfo) return;

    function tick() {
      const now = new Date().getTime();
      const target = new Date(weddingInfo.weddingDateISO).getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      daysEl.textContent = String(days);
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    tick();
    setInterval(tick, 1000);
  }

  /** Adds a background to the fixed header once the page scrolls. */
  /** Wires up the ES/EN buttons in the header. */
  function setupLanguageToggle() {
    document.querySelectorAll('.lang-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });
  }

  async function init() {
    await loadWeddingInfo();
    setupLanguageToggle();
    applyLanguage(currentLanguage);
    startCountdown();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
