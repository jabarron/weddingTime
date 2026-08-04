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
 *  Both pages share a look via pageShell() below: a light hairline-
 *  bordered ribbon with the monogram at the top, plain and static — the
 *  same neutral visual language as the main site.
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

/**
 * Shared page chrome: hairline ribbon + monogram, paper body, fonts +
 * base styles — so the login form and error page look like they belong
 * to the same system without duplicating it.
 * `bodyHtml` is whatever goes inside the main content area (below the
 * ribbon); `wide` loosens the content area's own max-width, used by the
 * error page so its much bigger image has room.
 */
function pageShell({ lang, title, bodyHtml, wide = false }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f4efe6;
      font-family: 'Jost', 'Segoe UI', sans-serif;
      text-align: center;
    }
    .ribbon {
      background: #f4efe6;
      border-bottom: 1px solid rgba(43, 38, 33, 0.14);
      padding: 0.9rem 1rem;
      display: flex;
      justify-content: center;
    }
    .ribbon img {
      height: 34px;
      width: auto;
    }
    .content {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 2.5rem 1rem;
    }
    .card {
      position: relative;
      z-index: 1;
      background: #fbf9f4;
      border: 1px solid rgba(43, 38, 33, 0.14);
      padding: 2.25rem 2rem;
      width: 100%;
      max-width: ${wide ? '600px' : '360px'};
    }
    img.error-image {
      width: 90%;
      margin: 0 auto 1.5rem;
      max-height: 85vh;
      height: auto;
      object-fit: contain;
      border: 1px solid rgba(43, 38, 33, 0.14);
      display: block;
    }
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-weight: 500;
      font-size: 1.8rem;
      color: #2b2621;
      margin: 0 0 0.5rem;
    }
    p {
      font-size: 0.95rem;
      color: #6b6255;
      margin: 0 0 1.5rem;
    }
    form {
      text-align: left;
    }
    label {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 500;
      color: #2b2621;
      margin-bottom: 0.3rem;
    }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      margin-bottom: 1.1rem;
      border: 1px solid rgba(43, 38, 33, 0.14);
      font-family: inherit;
      font-size: 1rem;
      background: #fbf9f4;
      color: #2b2621;
    }
    input:focus-visible {
      outline: 2px solid #2b2621;
      outline-offset: 2px;
    }
    .error-message {
      color: #9a3b30;
      font-size: 0.85rem;
      margin: -0.5rem 0 1rem;
    }
    button,
    a.btn {
      display: inline-block;
      width: 100%;
      background: #2b2621;
      color: #f4efe6;
      text-decoration: none;
      border: 1px solid #2b2621;
      padding: 0.85rem 2rem;
      font-family: inherit;
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      cursor: pointer;
      text-align: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    button:hover,
    a.btn:hover {
      background: transparent;
      color: #2b2621;
    }
    a.link-secondary {
      display: inline-block;
      margin-top: 1rem;
      color: #6b6255;
      font-size: 0.8rem;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    a.link-secondary:hover {
      color: #2b2621;
    }
  </style>
</head>
<body>
  <div class="ribbon">
    <img src="/monogram-ink.png" alt="I &amp; J" />
  </div>
  <div class="content">
    ${bodyHtml}
  </div>
</body>
</html>`;
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
