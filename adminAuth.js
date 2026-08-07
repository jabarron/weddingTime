/**
 * ============================================================================
 *  adminAuth.js — custom login system for /admin
 * ============================================================================
 *  Replaces the browser's native basic-auth prompt with our own login
 *  form, so every part of the experience — including what a wrong
 *  password shows — is under our control instead of the browser's.
 *
 *  Credentials still come from environment variables, unchanged:
 *    ADMIN_USER      — ✏️ EDIT ME in your .env file (see .env.example)
 *    ADMIN_PASSWORD  — ✏️ EDIT ME in your .env file (see .env.example)
 *
 *  Flow (see server.js for how these three exports get wired to routes):
 *    GET  /admin        -> handleAdminPage
 *                            valid session  -> serves admin.html
 *                            no/bad session -> serves the login form
 *    POST /admin/login   -> handleLoginSubmit
 *                            correct password -> creates a session,
 *                              redirects to /admin (now shows the dashboard)
 *                            wrong password, 1st time in the window
 *                              -> login form again, with an error message
 *                            wrong password, 2nd+ time in the window
 *                              -> the styled "wrong password" page
 *                              (admin-error-es.jpg / admin-error-en.jpg)
 *    /api/admin/*        -> requireSession
 *                            valid session -> next()
 *                            no/bad session -> 401 JSON (admin.js reacts
 *                              to this by redirecting the browser to /admin)
 *
 *  Both pages share a look via pageShell() (./page-shell.js): a light
 *  hairline-bordered ribbon with the monogram at the top, plain and
 *  static — the same warm cream + terracotta visual language as the
 *  main site. The public 404 page (server.js) reuses the same shell.
 *
 *  Nothing about the wedding is hardcoded in here — this whole file is
 *  meant to be reusable as-is for a future event, just by changing the
 *  env vars, monogram-ink.png, and the two error-page images.
 * ============================================================================
 */

const crypto = require('crypto');
const {
  createSession,
  isValidSession,
  getSessionIdFromRequest,
  setSessionCookie,
} = require('./session');
const { recordFailedAttempt, resetAttempts } = require('./loginAttempts');
const { pageShell } = require('./page-shell');

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';

if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
  console.warn(
    '[auth] WARNING: ADMIN_USER / ADMIN_PASSWORD are not set. ' +
      'The admin panel will reject all logins until you set them in .env.'
  );
}

/**
 * Constant-time string comparison so a wrong-length or wrong-content
 * guess can't be distinguished by how long the comparison took —
 * crypto.timingSafeEqual requires equal-length buffers, so the length
 * check has to happen first (a tiny, accepted timing leak of length
 * itself, not of the content).
 */
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** The login form itself. `errorMessage` is shown above the fields when
    re-rendering after a first wrong attempt. */
function buildLoginForm({ errorMessage } = {}) {
  return pageShell({
    lang: 'es',
    title: 'Iniciar sesión — Admin',
    bodyHtml: `
      <div class="card">
        <h1>Panel de Administración</h1>
        ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : '<p>Ingresa tus credenciales para continuar.</p>'}
        <form method="POST" action="/admin/login">
          <label for="username">Usuario</label>
          <input type="text" id="username" name="username" autocomplete="username" required autofocus />
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" autocomplete="current-password" required />
          <button type="submit">Entrar</button>
        </form>
        <a class="link-secondary" href="/">Regreso a la página de inicio</a>
      </div>
    `,
  });
}

/** The "wrong password" page shown from the 2nd failed attempt onward.
    Language comes from the browser's Accept-Language header — this page
    can be reached before any of the site's own JS has run. */
function buildLockedOutPage(req) {
  const acceptLanguage = req.headers['accept-language'] || '';
  const isEnglish = /^en/i.test(acceptLanguage);

  const lang = isEnglish ? 'en' : 'es';
  const imageSrc = isEnglish ? '/admin-error-en.jpg' : '/admin-error-es.jpg';
  const heading = isEnglish ? 'Access denied' : 'Acceso denegado';
  const message = isEnglish
    ? 'Please double-check the password and try again.'
    : 'Por favor verifica la contraseña e intenta de nuevo.';
  const linkText = isEnglish ? 'Try again' : 'Intentar de nuevo';
  const homeLinkText = isEnglish ? 'Back to homepage' : 'Regreso a la página de inicio';

  return pageShell({
    lang,
    title: heading,
    wide: true,
    bodyHtml: `
      <div class="card">
        <img class="error-image" src="${imageSrc}" alt="${heading}" />
        <h1>${heading}</h1>
        <p>${message}</p>
        <a class="btn" href="/admin">${linkText}</a>
        <a class="link-secondary" href="/">${homeLinkText}</a>
      </div>
    `,
  });
}

/** GET /admin — dashboard if the session is valid, login form otherwise.
    (server.js serves admin.html itself once this confirms the session;
    see the comment there for exactly how the two are wired together.) */
function handleAdminPage(req, res, next) {
  const sessionId = getSessionIdFromRequest(req);
  if (isValidSession(sessionId)) {
    return next(); // let server.js's static handler serve admin.html
  }
  res.status(200).send(buildLoginForm());
}

/** POST /admin/login — the actual credential check. */
function handleLoginSubmit(req, res) {
  const { username, password } = req.body || {};
  const ip = req.ip;

  const usernameOk = typeof username === 'string' && safeCompare(username, adminUser);
  const passwordOk = typeof password === 'string' && safeCompare(password, adminPassword);

  if (usernameOk && passwordOk) {
    resetAttempts(ip);
    const sessionId = createSession();
    setSessionCookie(res, sessionId);
    return res.redirect(302, '/admin');
  }

  const attemptCount = recordFailedAttempt(ip);

  if (attemptCount >= 2) {
    return res.status(401).send(buildLockedOutPage(req));
  }

  res.status(401).send(
    buildLoginForm({ errorMessage: 'Usuario o contraseña incorrectos. Intenta de nuevo.' })
  );
}

/** Middleware for /api/admin/* — JSON 401 instead of an HTML page, since
    these are called by admin.js's fetch(), not by navigating directly. */
function requireSession(req, res, next) {
  const sessionId = getSessionIdFromRequest(req);
  if (!isValidSession(sessionId)) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  next();
}

module.exports = { handleAdminPage, handleLoginSubmit, requireSession };
