/**
 * ============================================================================
 *  main.js — page behavior for the public site
 * ============================================================================
 *  Load order (see index.html <script> tags at the bottom of <body>):
 *    1. i18n.js          defines window.DICTIONARY
 *    2. main.js          (this file) fetches wedding facts, wires up
 *                         language switching, countdown, header scroll
 *    3. rsvp-form.js      handles the RSVP form specifically
 *
 *  Responsibilities of this file:
 *    - fetch /api/wedding-info and fill in names/date/venue/colors
 *    - apply the selected language across every [data-i18n] element
 *    - run the live countdown to the wedding date
 *    - toggle the header background once the page is scrolled
 * ============================================================================
 */

(function () {
  let weddingInfo = null;
  let currentLanguage = localStorage.getItem('site-language') || 'es';

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
    const itineraryList = document.querySelector('[data-field="itinerary-list"]');
    if (itineraryList && Array.isArray(itinerary)) {
      itineraryList.innerHTML = itinerary
        .map(
          (event) => `
        <li class="timeline__item">
          <span class="timeline__time">${event.time}</span>
          <span class="timeline__title">${event[lang]}</span>
        </li>`
        )
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
  function setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const toggle = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
  }

  /** Wires up the ES/EN buttons in the header. */
  function setupLanguageToggle() {
    document.querySelectorAll('.lang-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });
  }

  async function init() {
    await loadWeddingInfo();
    setupLanguageToggle();
    setupHeaderScroll();
    applyLanguage(currentLanguage);
    startCountdown();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
