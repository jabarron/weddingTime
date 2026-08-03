/**
 * ============================================================================
 *  admin.js — RSVP dashboard behavior
 * ============================================================================
 *  Fetches GET /api/admin/rsvps, fills in the summary stats, and renders
 *  one table row per response. The browser automatically attaches the
 *  session cookie to these fetch() calls, since they're same-origin
 *  requests — no extra auth code needed here.
 *
 *  If any API call comes back 401 (no valid session — e.g. it expired
 *  because the browser was closed, or someone opened this page's URL
 *  directly without logging in), apiFetch below sends the browser to
 *  /admin, which shows the login form.
 *
 *  Language: this page has no toggle of its own. It reads the
 *  'site-language' key from localStorage — the same key main.js writes
 *  when the couple uses the ES/EN toggle on the public site — and renders
 *  in that language. Defaults to Spanish if that key was never set (e.g.
 *  the public site was never visited in this browser).
 *
 *  Inline editing: clicking "Edit" on a row swaps that row's read-only
 *  cells for input fields (see renderEditRow), and its buttons for
 *  Save/Cancel. Only one row can be in edit mode at a time — tracked by
 *  `editingId`. Save sends a PATCH to /api/admin/rsvps/:id (routes-admin.js)
 *  with the edited values; the same required-field rules as the public
 *  RSVP form apply (full name, phone, attending).
 * ============================================================================
 */

(function () {
  const tableBody = document.getElementById('admin-table-body');
  const refreshBtn = document.getElementById('refresh-btn');

  const lang = localStorage.getItem('site-language') || 'es';
  const dict = window.DICTIONARY[lang];

  let currentData = []; // last-loaded responses, cached so re-rendering
                         // during edit mode doesn't require another fetch
  let editingId = null; // id of the row currently being edited, or null

  /**
   * Wraps fetch() for every /api/admin/* call in this file. On a 401
   * (session missing/expired), redirects to /admin instead of letting
   * the caller try to handle a response it was never designed for — and
   * throws, so the calling code's own catch block stops there rather
   * than continuing to work with data that will never arrive.
   */
  async function apiFetch(url, options) {
    const res = await fetch(url, options);
    if (res.status === 401) {
      window.location.href = '/admin';
      throw new Error('Session expired — redirecting to /admin');
    }
    return res;
  }

  /** Applies the dictionary to every [data-i18n] element on the page. */
  function applyLanguage() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    // Icon-only buttons (no visible text) — translates the accessible
    // name instead of any on-screen text, since there isn't any.
    document.querySelectorAll('[data-i18n-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-label');
      if (dict[key]) el.setAttribute('aria-label', dict[key]);
    });
  }

  function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Same as escapeHtml but also escapes quotes, for safe use inside a
  // value="..." HTML attribute.
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }

  function formatDate(isoString) {
    // Numeric date only, no time, per request — the database itself
    // still stores the full timestamp (submitted_at) unchanged; this
    // only affects how it's displayed here.
    return new Date(isoString).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  }

  /** Normal, read-only row. */
  function renderReadRow(r) {
    return `
      <tr data-id="${r.id}" class="${r.attending ? '' : 'is-declined'}">
        <td>${escapeHtml(r.full_name)}</td>
        <td>${escapeHtml(r.phone)}</td>
        <td>${r.attending ? dict.admin_yes : dict.admin_no}</td>
        <td>${escapeHtml(r.guest_count)}</td>
        <td>${escapeHtml(r.song_request)}</td>
        <td>${r.message ? `<span class="admin-message-cell" tabindex="0">${escapeHtml(r.message)}</span>` : ''}</td>
        <td>${formatDate(r.submitted_at)}</td>
        <td class="admin-actions">
          <button class="admin-edit-btn" data-id="${r.id}">${dict.admin_edit_btn}</button>
          <button class="admin-delete-btn" data-id="${r.id}">${dict.admin_delete_btn}</button>
        </td>
      </tr>`;
  }

  /** Row in edit mode — inputs pre-filled with the current values. */
  function renderEditRow(r) {
    return `
      <tr data-id="${r.id}" class="is-editing">
        <td><input type="text" class="edit-fullName" value="${escapeAttr(r.full_name)}" /></td>
        <td><input type="tel" class="edit-phone" value="${escapeAttr(r.phone)}" /></td>
        <td>
          <select class="edit-attending">
            <option value="true" ${r.attending ? 'selected' : ''}>${dict.admin_yes}</option>
            <option value="false" ${!r.attending ? 'selected' : ''}>${dict.admin_no}</option>
          </select>
        </td>
        <td><input type="number" min="0" max="2" class="edit-guestCount" value="${escapeAttr(r.guest_count)}" /></td>
        <td><input type="text" class="edit-songRequest" value="${escapeAttr(r.song_request || '')}" /></td>
        <td><input type="text" class="edit-message" value="${escapeAttr(r.message || '')}" /></td>
        <td>${formatDate(r.submitted_at)}</td>
        <td class="admin-actions">
          <button class="admin-save-btn" data-id="${r.id}">${dict.admin_save_btn}</button>
          <button class="admin-cancel-btn" data-id="${r.id}">${dict.admin_cancel_btn}</button>
        </td>
      </tr>`;
  }

  /** Re-renders the whole table body from `currentData` + `editingId`. */
  function renderTable() {
    if (currentData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8">${dict.admin_empty}</td></tr>`;
      return;
    }
    tableBody.innerHTML = currentData
      .map((r) => (r.id === editingId ? renderEditRow(r) : renderReadRow(r)))
      .join('');
  }

  async function loadRsvps() {
    tableBody.innerHTML = `<tr><td colspan="8">${dict.admin_loading}</td></tr>`;
    editingId = null;

    try {
      const res = await apiFetch('/api/admin/rsvps');
      if (!res.ok) throw new Error('Failed to load RSVPs');
      const { summary, responses } = await res.json();

      document.getElementById('stat-attending').textContent = summary.attendingResponses;
      document.getElementById('stat-guests').textContent = summary.totalGuestsAttending;
      document.getElementById('stat-declined').textContent = summary.declinedResponses;

      currentData = responses;
      renderTable();
    } catch (err) {
      console.error('Could not load RSVPs:', err);
      tableBody.innerHTML = `<tr><td colspan="8">${dict.admin_load_error}</td></tr>`;
    }
  }

  async function deleteRsvp(id) {
    if (!confirm(dict.admin_delete_confirm)) return;
    try {
      const res = await apiFetch(`/api/admin/rsvps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      loadRsvps();
    } catch (err) {
      console.error('Could not delete RSVP:', err);
      alert(dict.admin_delete_error);
    }
  }

  async function saveRsvp(id, rowEl) {
    const attending = rowEl.querySelector('.edit-attending').value === 'true';
    const guestCountRaw = Number(rowEl.querySelector('.edit-guestCount').value);
    const payload = {
      fullName: rowEl.querySelector('.edit-fullName').value,
      phone: rowEl.querySelector('.edit-phone').value,
      attending,
      // 0 is a valid, intentional value when not attending — only fall
      // back to 1 for a genuinely empty/invalid field.
      guestCount: Number.isInteger(guestCountRaw) ? guestCountRaw : 1,
      songRequest: rowEl.querySelector('.edit-songRequest').value || null,
      message: rowEl.querySelector('.edit-message').value || null,
    };

    if (!payload.fullName.trim() || !payload.phone.trim()) {
      alert(dict.admin_required_alert);
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/rsvps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      editingId = null;
      loadRsvps();
    } catch (err) {
      console.error('Could not update RSVP:', err);
      alert(dict.admin_save_error);
    }
  }

  tableBody.addEventListener('click', (event) => {
    const editBtn = event.target.closest('.admin-edit-btn');
    const deleteBtn = event.target.closest('.admin-delete-btn');
    const saveBtn = event.target.closest('.admin-save-btn');
    const cancelBtn = event.target.closest('.admin-cancel-btn');

    if (editBtn) {
      editingId = Number(editBtn.dataset.id);
      renderTable();
    } else if (deleteBtn) {
      deleteRsvp(deleteBtn.dataset.id);
    } else if (saveBtn) {
      saveRsvp(Number(saveBtn.dataset.id), saveBtn.closest('tr'));
    } else if (cancelBtn) {
      editingId = null;
      renderTable();
    }
  });

  // Keep the guest count field in sync with the attending dropdown while
  // editing — same behavior as the public RSVP form: switching to "No"
  // zeroes it out and locks it, switching to "Yes" restores it to 1.
  // Purely visual here; the server enforces the real rule on save either
  // way (see routes-admin.js), this just avoids a confusing mismatch
  // between what the row shows and what gets saved.
  tableBody.addEventListener('change', (event) => {
    if (!event.target.classList.contains('edit-attending')) return;
    const row = event.target.closest('tr');
    const guestCountInput = row.querySelector('.edit-guestCount');
    if (!guestCountInput) return;

    if (event.target.value === 'false') {
      guestCountInput.value = '0';
      guestCountInput.disabled = true;
    } else {
      if (guestCountInput.disabled) {
        guestCountInput.value = '1';
      }
      guestCountInput.disabled = false;
    }
  });

  refreshBtn.addEventListener('click', loadRsvps);

  /**
   * Full-text popup for truncated message cells (.admin-message-cell,
   * added in renderReadRow). One reusable popup element (#message-popup
   * in admin.html) that JS repositions and refills rather than creating
   * a new one per row — cheaper, and there's only ever one open at a
   * time anyway.
   *
   * Positioned with getBoundingClientRect() + position:fixed instead of
   * living inside the table cell itself, because .admin-table-wrap has
   * overflow-x:auto for the horizontal scroll on mobile — a popup
   * nested inside would get clipped by that instead of floating freely
   * above the table.
   *
   * Interaction differs by input type, detected via the CSS
   * (hover: none) media feature (more reliable than checking for touch
   * event support, which some hybrid laptop/tablet devices report even
   * with a mouse attached):
   *   - Devices that can hover (desktop/trackpad): mouseover/mouseout,
   *     matching how a tooltip normally behaves.
   *   - Devices that can't (phones/tablets): tap to open, tap anywhere
   *     outside to close — hover has no real equivalent on touch, and a
   *     tap-to-toggle is the standard, expected pattern there.
   */
  function setupMessagePopup() {
    const popup = document.getElementById('message-popup');
    const tableBody = document.getElementById('admin-table-body');
    if (!popup || !tableBody) return;

    const canHover = window.matchMedia('(hover: hover)').matches;

    function positionPopup(target) {
      const rect = target.getBoundingClientRect();
      const margin = 8;
      popup.style.maxWidth = `min(320px, ${window.innerWidth - margin * 2}px)`;
      // Show first (but invisible) so its real height can be measured —
      // needed to decide whether it fits below the cell or should flip
      // above it instead.
      popup.style.visibility = 'hidden';
      popup.classList.add('is-open');
      const popupHeight = popup.offsetHeight;
      const popupWidth = popup.offsetWidth;

      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow > popupHeight + margin
          ? rect.bottom + margin
          : rect.top - popupHeight - margin;

      let left = rect.left;
      left = Math.min(left, window.innerWidth - popupWidth - margin);
      left = Math.max(left, margin);

      popup.style.top = `${Math.max(top, margin)}px`;
      popup.style.left = `${left}px`;
      popup.style.visibility = 'visible';
    }

    function openPopup(target) {
      popup.textContent = target.textContent;
      positionPopup(target);
    }

    function closePopup() {
      popup.classList.remove('is-open');
    }

    if (canHover) {
      tableBody.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('.admin-message-cell');
        if (cell) openPopup(cell);
      });
      tableBody.addEventListener('mouseout', (e) => {
        const cell = e.target.closest('.admin-message-cell');
        if (cell) closePopup();
      });
    } else {
      tableBody.addEventListener('click', (e) => {
        const cell = e.target.closest('.admin-message-cell');
        if (!cell) return;
        e.stopPropagation();
        if (popup.classList.contains('is-open')) {
          closePopup();
        } else {
          openPopup(cell);
        }
      });
      document.addEventListener('click', (e) => {
        if (!popup.contains(e.target)) closePopup();
      });
    }

    // Scrolling/resizing while a popup is open could leave it pointing
    // at the wrong spot — simplest fix is just closing it, rather than
    // trying to keep repositioning it live.
    window.addEventListener('scroll', closePopup, { passive: true, capture: true });
    window.addEventListener('resize', closePopup, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    loadRsvps();
    setupMessagePopup();
  });
})();
