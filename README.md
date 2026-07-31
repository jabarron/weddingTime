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
│                         RSVP deadline.
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
files:** `wedding-config.js` (facts: names, date, venue, colors, RSVP
deadline) and `i18n.js` (the "Our story" and "Dress code" paragraphs). Both
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
| Itinerary (event list, times)          | `wedding-config.js` (`itinerary` array — add/remove/reorder freely) |
| Colors                                 | `wedding-config.js` **and** the `:root` block at the top of `styles.css` (both must match — see comment in the config file) |
| "Our story" paragraph (ES & EN)        | `i18n.js`                                      |
| Dress code paragraph (ES & EN)         | `i18n.js`                                      |
| Gifts / envelope box message (ES & EN) | `i18n.js`                                      |
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
- **Required fields:** name, phone, and attendance (yes/no) are required on
  the public RSVP form — marked with a `*` and enforced both client-side
  (instant feedback, no page reload) and server-side (`routes-rsvp.js`).
  Guest count, song request, and message stay optional.
- **Admin editing:** click "Edit" on any row in `/admin` to edit it inline;
  "Save" sends the changes to `PATCH /api/admin/rsvps/:id`, "Cancel"
  discards them. The same required-field rules apply.
- **Header shortcut:** the "I & J" monogram in the site header links to
  `/admin` (still requires the admin login) — a quick way in without typing
  the URL, without looking like a button.
- **Mobile nav:** below 900px wide, the header nav shows icons only (no
  text) so it fits on one line — the labels are still there for screen
  readers, and switch back to full text above 900px. Icons and section IDs
  live in `index.html`; if you reorder sections, update both the nav link
  `href`s and the matching `id` on each `<section>`.
- **Itinerary:** fully data-driven from the `itinerary` array in
  `wedding-config.js` — add, remove, or reorder events there and the
  timeline on the site updates automatically, no HTML editing needed.
- **Excel export:** the "Download Excel" button in `/admin` hits
  `GET /api/admin/rsvps/export` (protected by the same admin login) and
  streams a real `.xlsx` file built with the `exceljs` package — that's a
  new dependency added to `package.json`, so make sure `npm install` runs
  again (Railway does this automatically on deploy).
- **Link previews (Open Graph):** `og-image.jpg`, `favicon.png`,
  `favicon-32.png`, and `apple-touch-icon.png` were generated from the
  site's own colors/fonts (not real photos yet). When you have engagement
  photos, regenerate `og-image.jpg` with one of them for a more personal
  link preview on WhatsApp/iMessage — it should stay 1200×630px.
- **Color contrast:** `terracotta` and `mauve` are used as backgrounds/
  accents throughout, but are too light to pass WCAG AA as small text on
  their own. `styles.css` defines adjusted text-only variants
  (`--color-terracotta-on-light`, `--color-terracotta-on-dark`,
  `--color-mauve-text`, `--color-mauve-on-dark`) — always use one of these
  instead of the base color if you're setting a `color:` (text) property,
  not a `background`/`border`.
- **Form limits:** name (100 chars), phone (30), song request (150), and
  message (500) all have a `maxlength` in `index.html` and a matching
  server-side cap in `routes-rsvp.js` — adjust both together if you change
  one.
- **Responsive breakpoints:** Details cards, the Our Story intro grid, and
  both dotted timelines all switch to their wider layout at the same
  768px breakpoint (previously four different values — see the comment
  above it in `styles.css`). The header nav's icon→text switch stays a
  separate, wider breakpoint (900px) on purpose, since the full Spanish
  labels need more room than everything else.
- **Micro-interactions:** the ES/EN toggle buttons and every `/admin`
  action button (Edit, Save, Cancel, Delete, Download Excel) now have a
  hover state with a smooth color transition, matching the rest of the
  site's buttons.
- **Admin language:** `/admin` has no ES/EN toggle of its own — it just
  reads whichever language was last picked on the public site
  (`localStorage`, same-origin) and renders in that language.
- **Story timeline:** three more "chapters" below the main story intro,
  alternating photo/text sides on desktop. Content lives in `i18n.js`
  (`story_milestone1/2/3_heading/body`); add or remove a whole
  `.story-milestone` block in `index.html` to change the count.
- **Itinerary icons:** each event in the `itinerary` array
  (`wedding-config.js`) can have an `icon` key (rings, book, cocktail,
  dinner, music, toast, cake, party) — the actual icon artwork lives in
  `main.js` (`TIMELINE_ICONS`), so picking a different available icon name
  is a one-line change; adding a brand new icon means adding its SVG path
  there too.
- **Language default:** Spanish, with an EN toggle in the header. The
  visitor's choice is remembered in their browser (`localStorage`) between
  visits.
