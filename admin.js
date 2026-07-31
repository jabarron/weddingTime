/**
 * ============================================================================
 *  admin.js — RSVP dashboard behavior
 * ============================================================================
 *  Fetches GET /api/admin/rsvps, fills in the summary stats, and renders
 *  one table row per response. The browser automatically attaches the
 *  basic-auth credentials it collected on page load to these fetch() calls,
 *  since they're same-origin requests — no extra auth code needed here.
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

  /** Applies the dictionary to every [data-i18n] element on the page. */
  function applyLanguage() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
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
    return new Date(isoString).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  /** Normal, read-only row. */
  function renderReadRow(r) {
    return `
      <tr data-id="${r.id}">
        <td>${escapeHtml(r.full_name)}</td>
        <td>${escapeHtml(r.phone)}</td>
        <td>${r.attending ? dict.admin_yes : dict.admin_no}</td>
        <td>${escapeHtml(r.guest_count)}</td>
        <td>${escapeHtml(r.song_request)}</td>
        <td>${escapeHtml(r.message)}</td>
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
        <td><input type="number" min="1" max="2" class="edit-guestCount" value="${escapeAttr(r.guest_count)}" /></td>
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
      const res = await fetch('/api/admin/rsvps');
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
      const res = await fetch(`/api/admin/rsvps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      loadRsvps();
    } catch (err) {
      console.error('Could not delete RSVP:', err);
      alert(dict.admin_delete_error);
    }
  }

  async function saveRsvp(id, rowEl) {
    const payload = {
      fullName: rowEl.querySelector('.edit-fullName').value,
      phone: rowEl.querySelector('.edit-phone').value,
      attending: rowEl.querySelector('.edit-attending').value === 'true',
      guestCount: Number(rowEl.querySelector('.edit-guestCount').value) || 1,
      songRequest: rowEl.querySelector('.edit-songRequest').value || null,
      message: rowEl.querySelector('.edit-message').value || null,
    };

    if (!payload.fullName.trim() || !payload.phone.trim()) {
      alert(dict.admin_required_alert);
      return;
    }

    try {
      const res = await fetch(`/api/admin/rsvps/${id}`, {
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

  refreshBtn.addEventListener('click', loadRsvps);

  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    loadRsvps();
  });
})();
