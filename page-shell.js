/**
 * ============================================================================
 *  page-shell.js — shared HTML chrome for standalone pages
 * ============================================================================
 *  A few pages in this project can be reached WITHOUT the main site (and
 *  its styles.css) ever loading: the /admin login form, the "access
 *  denied" lockout page (both in adminAuth.js), and the public 404 page
 *  (server.js). All three need their own self-contained HTML + CSS, so
 *  rather than duplicate that CSS three times, they share this one
 *  pageShell() — a light hairline-bordered ribbon with the monogram at
 *  the top, on plain cream, using the same design tokens as styles.css
 *  (kept in sync by hand — small enough to not need a build step).
 *
 *  ✏️ EDIT ME: if you change the palette in wedding-config.js / styles.css,
 *  update the hex values below too.
 * ============================================================================
 */

function pageShell({ lang, title, bodyHtml, wide = false }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Jost:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f7f1e7;
      font-family: 'Jost', 'Segoe UI', sans-serif;
      text-align: center;
    }
    .ribbon {
      background: #f7f1e7;
      border-bottom: 1px solid rgba(60, 51, 43, 0.16);
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
      background: #fcf9f4;
      border: 1px solid rgba(60, 51, 43, 0.16);
      border-radius: 14px;
      box-shadow: 0 24px 60px -32px rgba(60, 51, 43, 0.35);
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
      border-radius: 10px;
      border: 1px solid rgba(60, 51, 43, 0.16);
      display: block;
    }
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-weight: 500;
      font-size: 1.8rem;
      color: #3c332b;
      margin: 0 0 0.5rem;
    }
    p {
      font-size: 0.95rem;
      color: #6e6156;
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
      color: #3c332b;
      margin-bottom: 0.3rem;
    }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      margin-bottom: 1.1rem;
      border: 1px solid rgba(60, 51, 43, 0.16);
      border-radius: 10px;
      font-family: inherit;
      font-size: 1rem;
      background: #fcf9f4;
      color: #3c332b;
    }
    input:focus-visible {
      outline: 2px solid #96603c;
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
      background: #96603c;
      color: #fcf9f4;
      text-decoration: none;
      border: 1px solid #96603c;
      border-radius: 999px;
      padding: 0.85rem 2rem;
      font-family: inherit;
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      cursor: pointer;
      text-align: center;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    button:hover,
    a.btn:hover {
      background: #3c332b;
      border-color: #3c332b;
      color: #fcf9f4;
    }
    a.link-secondary {
      display: inline-block;
      margin-top: 1rem;
      color: #6e6156;
      font-size: 0.8rem;
      text-decoration: underline;
      text-decoration-color: #bc8060;
      text-underline-offset: 3px;
    }
    a.link-secondary:hover {
      color: #3c332b;
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

module.exports = { pageShell };
