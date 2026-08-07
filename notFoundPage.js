/**
 * ============================================================================
 *  notFoundPage.js — styled public 404 page
 * ============================================================================
 *  V2 had no visual 404 at all (server.js just sent bare JSON for any
 *  unmatched route). This gives the public site a styled one, reusing
 *  the same pageShell() as the admin login/lockout pages so all three
 *  "you ended up somewhere unexpected" pages share one visual system.
 *
 *  Only wired up for non-API paths — see server.js: a request to an
 *  unmatched /api/* route still gets a plain JSON 404, since that's a
 *  program (not a person) on the other end.
 *
 *  Language comes from the browser's Accept-Language header, same
 *  approach as adminAuth.js's buildLockedOutPage — this page can be
 *  reached before any of the site's own JS (and its localStorage
 *  language choice) has ever run.
 *
 *  Reuses an existing project photo (no dedicated "not found" image
 *  exists yet) — swap PHOTO_SRC for a custom one later if you'd like.
 * ============================================================================
 */

const { pageShell } = require('./page-shell');

const PHOTO_SRC = '/photos/nosotrosEnPeluche.jpg';

function buildNotFoundPage(req) {
  const acceptLanguage = req.headers['accept-language'] || '';
  const isEnglish = /^en/i.test(acceptLanguage);

  const lang = isEnglish ? 'en' : 'es';
  const heading = isEnglish ? "This page didn't make it down the aisle" : 'Esta página no llegó al altar';
  const message = isEnglish
    ? "The link you followed doesn't exist or moved."
    : 'El enlace que buscas no existe o cambió de dirección.';
  const homeLinkText = isEnglish ? 'Back to homepage' : 'Regreso a la página de inicio';

  return pageShell({
    lang,
    title: isEnglish ? 'Page not found' : 'Página no encontrada',
    wide: true,
    bodyHtml: `
      <div class="card">
        <img class="error-image" src="${PHOTO_SRC}" alt="" />
        <h1>${heading}</h1>
        <p>${message}</p>
        <a class="btn" href="/">${homeLinkText}</a>
      </div>
    `,
  });
}

module.exports = { buildNotFoundPage };
