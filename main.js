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

  // Small line-icon set for the itinerary timeline, keyed by the `icon`
  // value in wedding-config.js -> itinerary. Same thin-stroke style as the
  // header nav icons. `dot` is the fallback for an unknown/omitted icon.
  const TIMELINE_ICONS = {
    rings: '<circle cx="8" cy="14" r="5"/><circle cx="14" cy="14" r="5"/>',
    book: '<path d="M4 5c2-1 5-1 8 1 3-2 6-2 8-1v13c-2-1-5-1-8 1-3-2-6-2-8-1V5z"/><path d="M12 6v13"/>',
    cocktail: '<path d="M5 4h14l-7 8v7"/><path d="M9 19h6"/>',
    dinner: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    music: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    toast: '<path d="M6 3h4l-1 8a1 1 0 0 1-2 0L6 3z"/><path d="M14 5h4l-.8 6a1 1 0 0 1-2 0L14 5z"/><path d="M8 11v8M17 11v8"/>',
    cake: '<path d="M4 20l8-12 8 12z"/><path d="M4 20h16"/><circle cx="12" cy="7" r="1"/>',
    disco: '<circle cx="12" cy="10" r="6"/><path d="M6 10h12M12 4v12M8.3 6.3l7.4 7.4M15.7 6.3l-7.4 7.4"/><path d="M12 16v5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
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
          // Religious ceremony gets the navy accent instead of the usual
          // terracotta badge — a small, deliberate exception (see the
          // --color-navy comment in styles.css for why only this one).
          const accent = event.icon === 'book' ? ' timeline__icon--accent' : '';
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

  /**
   * Measures the actual scrollbar width and exposes it as a CSS
   * variable (--scrollbar-width). Needed because .site-header is
   * position:fixed (its 100% width is the full viewport, scrollbar
   * included) while .hero/.section/.site-footer are normal document
   * flow (their 100% excludes the scrollbar) — without correcting for
   * that difference, the header comes out a few pixels wider than the
   * sections below it, just enough to visibly misalign their rounded
   * corners once the header becomes solid on scroll. 0 on touch/overlay
   * -scrollbar devices (most phones), where there's nothing to correct
   * for anyway.
   */
  function setScrollbarWidthVar() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
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

  /**
   * Hero fades to a maximum of 10% transparent as the guest scrolls
   * through it, tied to scroll progress across the hero's own height —
   * by the time it's fully scrolled past (out of view), the value stops
   * mattering visually, so there's no need to extend the effect further.
   *
   * Smoothed two ways: a CSS transition on .hero's opacity (see
   * styles.css) interpolates between updates instead of jumping, and
   * requestAnimationFrame avoids piling up redundant work on scroll.
   *
   * Skipped entirely for guests with prefers-reduced-motion on — the
   * hero just stays fully opaque and static for them instead.
   */
  function setupHeroScrollEffects() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    function updateFade() {
      const heroHeight = hero.offsetHeight;
      const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
      // Fade: 1 (fully opaque) down to 0.9 (10% transparent) — never past that.
      hero.style.opacity = String(1 - progress * 0.1);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateFade);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateFade();
  }

  const TERRACOTTA_RGB = '195, 99, 77';
  const NAVY_RGB = '31, 46, 77';

  /**
   * Fireflies on a section's background — a handful of warm dots that
   * fade in and out at fixed spots, each on its own independent (and
   * slightly randomized) cycle so they never blink in sync. No
   * movement, no connecting lines — stays firmly in the background
   * rather than competing with the text. Skipped for guests with
   * prefers-reduced-motion on.
   *
   * Reusable across sections (hero, Details, Gifts) via options instead
   * of being hardcoded to the hero — each call gets its own count,
   * timing range, and (for the hero) a few navy fireflies mixed in with
   * the usual terracotta ones, per the couple's request for "a touch of
   * blue in each section".
   */
  function setupFireflies({
    canvasSelector,
    containerSelector,
    count,
    blueCount = 0,
    cycleMsRange = [3500, 6500],
    maxOpacityRange = [0.35, 0.6],
  }) {
    const canvas = document.querySelector(canvasSelector);
    const container = document.querySelector(containerSelector);
    if (!canvas || !container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let fireflies = [];
    let width = 0;
    let height = 0;

    function resize() {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function createFireflies() {
      fireflies = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.3 + Math.random() * 1.2,
        // Each firefly has its own random starting point in the cycle and
        // its own slightly different cycle length, so they drift in and
        // out of sync with each other rather than blinking together.
        phase: Math.random() * Math.PI * 2,
        cycleMs: cycleMsRange[0] + Math.random() * (cycleMsRange[1] - cycleMsRange[0]),
        maxOpacity:
          maxOpacityRange[0] + Math.random() * (maxOpacityRange[1] - maxOpacityRange[0]),
        // The first `blueCount` fireflies (of otherwise-random position)
        // are navy; the rest stay the usual terracotta.
        color: i < blueCount ? NAVY_RGB : TERRACOTTA_RGB,
      }));
    }

    function step(timestamp) {
      ctx.clearRect(0, 0, width, height);

      fireflies.forEach((f) => {
        const t = (timestamp / f.cycleMs) * Math.PI * 2 + f.phase;
        // (sin(t) + 1) / 2 oscillates smoothly between 0 and 1.
        const opacity = ((Math.sin(t) + 1) / 2) * f.maxOpacity;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${f.color}, ${opacity})`;
        ctx.shadowColor = `rgba(${f.color}, ${opacity})`;
        ctx.shadowBlur = 6;
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(step);
    }

    resize();
    createFireflies();
    requestAnimationFrame(step);

    let resizeTimeout;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          resize();
          createFireflies();
        }, 200);
      },
      { passive: true }
    );
  }

  /** Wires up the ES/EN buttons in the header. */
  function setupLanguageToggle() {
    document.querySelectorAll('.lang-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });
  }

  async function init() {
    await loadWeddingInfo();
    setScrollbarWidthVar();
    window.addEventListener('resize', setScrollbarWidthVar, { passive: true });
    setupLanguageToggle();
    setupHeaderScroll();
    setupHeroScrollEffects();
    setupFireflies({
      canvasSelector: '.hero__constellation',
      containerSelector: '.hero',
      count: 14, // kept low on purpose — "no saturar el hero"
      blueCount: 2, // a few navy ones mixed in with the terracotta, per the couple's request
    });
    // Details and Gifts: sparser and dimmer than the hero ("tenues y
    // esporádicas, que no vayan a saturar") — fewer fireflies, a wider/
    // slower cycle range so they feel occasional rather than a constant
    // ambient presence, and a lower opacity ceiling.
    setupFireflies({
      canvasSelector: '.details__fireflies',
      containerSelector: '.details',
      count: 6,
      cycleMsRange: [4000, 9000],
      maxOpacityRange: [0.2, 0.4],
    });
    setupFireflies({
      canvasSelector: '.gifts__fireflies',
      containerSelector: '.gifts',
      count: 6,
      cycleMsRange: [4000, 9000],
      maxOpacityRange: [0.2, 0.4],
    });
    applyLanguage(currentLanguage);
    startCountdown();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
