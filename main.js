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
    // Corte de Pastel — an actual tiered wedding cake with a topper.
    cake: '<rect x="7" y="15" width="10" height="6" rx="1"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M12 10V7"/><circle cx="12" cy="6" r="1"/>',
    // Fiesta y Baile — disco ball, refined with a hanging stand.
    // Fiesta y Baile — falling streamers + confetti (replaces an
    // earlier disco-ball version the couple didn't like).
    disco: '<path d="M6 4c2 2 0 4 2 6s0 4 2 6"/><path d="M12 3c2 2 0 4 2 6s0 4 2 6"/><path d="M18 5c1.5 1.5 0 3 1.5 4.5"/><circle cx="5" cy="18" r="1"/><circle cx="11" cy="20" r="1"/><circle cx="17" cy="17" r="1"/>',
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
          // Religious ceremony gets the navy accent instead of the usual
          // terracotta badge — a small, deliberate exception (see the
          // --color-navy comment in styles.css for why only this one).
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

  const FIREFLY_RGB = '255, 250, 243'; // --color-white, as an rgb triple

  /**
   * Fireflies on a section's background — a handful of warm dots that
   * fade in and out at fixed spots, each on its own independent (and
   * slightly randomized) cycle so they never blink in sync. No
   * movement, no connecting lines — stays firmly in the background
   * rather than competing with the text. Skipped for guests with
   * prefers-reduced-motion on.
   *
   * White, and deliberately small — was a terracotta/navy mix before,
   * but white reads more clearly as "firefly glow" against the wine
   * backgrounds; kept the dots themselves tiny so that extra visibility
   * doesn't turn into extra visual weight.
   *
   * Reusable across sections (hero, Details, Gifts) via options instead
   * of being hardcoded to the hero — each call gets its own count and
   * timing range.
   */
  function setupFireflies({
    canvasSelector,
    containerSelector,
    count,
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
      fireflies = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        // Was 1.3-2.5px — shrunk to keep the brighter white color from
        // reading as more prominent than the old terracotta version.
        radius: 0.8 + Math.random() * 0.7,
        // Each firefly has its own random starting point in the cycle and
        // its own slightly different cycle length, so they drift in and
        // out of sync with each other rather than blinking together.
        phase: Math.random() * Math.PI * 2,
        cycleMs: cycleMsRange[0] + Math.random() * (cycleMsRange[1] - cycleMsRange[0]),
        maxOpacity:
          maxOpacityRange[0] + Math.random() * (maxOpacityRange[1] - maxOpacityRange[0]),
      }));
    }

    function step(timestamp) {
      ctx.clearRect(0, 0, width, height);

      fireflies.forEach((f) => {
        const t = (timestamp / f.cycleMs) * Math.PI * 2 + f.phase;
        // (sin(t) + 1) / 2 oscillates smoothly between 0 and 1.
        const opacity = ((Math.sin(t) + 1) / 2) * f.maxOpacity;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${FIREFLY_RGB}, ${opacity})`;
        ctx.shadowColor = `rgba(${FIREFLY_RGB}, ${opacity})`;
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
    setupLanguageToggle();
    setupHeaderScroll();
    setupHeroScrollEffects();
    setupFireflies({
      canvasSelector: '.hero__constellation',
      containerSelector: '.hero',
      count: 14, // kept low on purpose — "no saturar el hero"
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
