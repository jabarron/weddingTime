# Ismeraí & Jesús — Wedding Website

A bilingual (Spanish/English) wedding website with a public site for guests
and a password-protected `/admin` dashboard to view RSVP responses, backed
by a PostgreSQL database.

---

## 1. What's in here

Every file lives in one root folder — no subfolders — to make it easy to
drag-and-drop into GitHub while you're testing. Move things into folders
later if you want; see the note in `server.js` for what that involves.

```
wedding-website/
├── server.js            Express app entry point — start here to understand
│                         the request flow.
├── wedding-config.js     ✏️ THE file to edit: names, date, venue, colors,
│                         RSVP deadline, meal options.
├── db-pool.js            PostgreSQL connection + schema init.
├── schema.sql            Table definition.
├── adminAuth.js          Password-protects /admin.
├── routes-info.js        GET  /api/wedding-info   (public)
├── routes-rsvp.js        POST /api/rsvp           (public)
├── routes-admin.js       /api/admin/*             (protected)
├── index.html            The public site.
├── styles.css            All styling + design tokens.
├── i18n.js               ✏️ Spanish/English text — story & dress-code
│                         paragraphs live here.
├── main.js               Language switching, countdown, etc.
├── rsvp-form.js          RSVP form submit handling.
├── admin.html            RSVP dashboard page (behind basic-auth).
├── admin.css             Dashboard styling.
└── admin.js              Dashboard data fetching/rendering.
```

**To customize the wedding details, you should only need to edit two
files:** `wedding-config.js` (facts: names, date, venue, colors, meal
choices) and `i18n.js` (the "Our story" and "Dress code" paragraphs). Both
are marked with `✏️ EDIT ME` comments.

### A note on the flat layout and security

Because everything sits in one folder, the server can't just blanket-serve
"the whole folder" the way a typical Express app would — that would let
anyone download `server.js`, `wedding-config.js`, `db-pool.js`, etc.
straight from a browser. `server.js` handles this with a small explicit
blocklist (`BLOCKED_FILES`) that returns a 404 for any request matching a
server-side filename, checked before the static file server runs.
`admin.html` gets extra protection: it's in that blocklist *and* only
reachable through a dedicated `GET /admin` route that requires login first.
Your `.env` file is safe regardless, since Express never serves dotfiles.

This is a fine setup to ship with. If you later reorganize into folders
(e.g. a `public/` folder for browser-facing files, everything else outside
it), you can delete the blocklist — pointing `express.static` at just the
`public/` folder becomes the guard at that point instead.

---

## 2. Running it locally

Requirements: [Node.js](https://nodejs.org) 18+, and a PostgreSQL database
(a free one from [Railway](https://railway.app) or
[Neon](https://neon.tech) works fine for local dev too).

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and fill in real values
cp .env.example .env
# then edit .env: set DATABASE_URL, ADMIN_USER, ADMIN_PASSWORD

# 3. Start the server
npm start
```

Visit:
- `http://localhost:3000` — the public site
- `http://localhost:3000/admin` — the RSVP dashboard (browser will prompt
  for the ADMIN_USER / ADMIN_PASSWORD you set in `.env`)

The database table is created automatically on first startup — no manual
migration step needed (see `db-pool.js` → `initDb()`).

---

## 3. Deploying to Railway (recommended)

1. Push this project to a GitHub repository.
2. In Railway, create a new project → **Deploy from GitHub repo** → select
   this repo.
3. Add a **PostgreSQL** plugin to the same Railway project. Railway
   automatically injects `DATABASE_URL` into your app's environment — you
   don't need to copy/paste a connection string yourself.
4. In your Railway service's **Variables** tab, add:
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `NODE_ENV` = `production`
5. Deploy. Railway runs `npm start` automatically and assigns a public URL.

---

## 4. How editing works (important fields)

| What you want to change              | Where to edit it                              |
|----------------------------------------|-----------------------------------------------|
| Names, wedding date/time, venue        | `wedding-config.js`                            |
| RSVP deadline                          | `wedding-config.js`                            |
| Meal choices                           | `wedding-config.js`                            |
| Colors                                 | `wedding-config.js` **and** the `:root` block at the top of `styles.css` (both must match — see comment in the config file) |
| "Our story" paragraph (ES & EN)        | `i18n.js`                                      |
| Dress code paragraph (ES & EN)         | `i18n.js`                                      |
| Interface button/label text            | `i18n.js`                                      |
| Engagement photo                       | Add an image file to this same root folder (e.g. `photo1.jpg`), then update the placeholder `<div class="story__photo">` in `index.html` with an `<img src="/photo1.jpg" alt="...">` tag (instructions are commented right above it) |
| Admin login credentials                | `.env` locally, or Railway's Variables tab in production — never commit these |

---

## 5. Notes on current setup

- **RSVP access:** the form is open to anyone with the site link — there is
  no guest-list validation. If you want to restrict who can submit later,
  that logic belongs in `routes-rsvp.js`.
- **Admin auth:** simple HTTP basic-auth (one shared username/password).
  Good enough for a small wedding admin panel; let me know if you'd rather
  have individual accounts later.
- **Language default:** Spanish, with an EN toggle in the header. The
  visitor's choice is remembered in their browser (`localStorage`) between
  visits.
