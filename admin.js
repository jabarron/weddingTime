/**
 * ============================================================================
 *  admin.js — RSVP dashboard behavior
 * ============================================================================
 *  Fetches GET /api/admin/rsvps, fills in the summary stats, and renders
 *  one table row per response. The browser automatically attaches the
 *  basic-auth credentials it collected on page load to these fetch() calls,
 *  since they're same-origin requests — no extra auth code needed here.
 * ============================================================================
 */

(function () {
  const tableBody = document.getElementById('admin-table-body');
  const refreshBtn = document.getElementById('refresh-btn');

  function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatDate(isoString) {
    return new Date(isoString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  async function loadRsvps() {
    tableBody.innerHTML = '<tr><td colspan="10">Loading…</td></tr>';

    try {
      const res = await fetch('/api/admin/rsvps');
      if (!res.ok) throw new Error('Failed to load RSVPs');
      const { summary, responses } = await res.json();

      document.getElementById('stat-attending').textContent = summary.attendingResponses;
      document.getElementById('stat-guests').textContent = summary.totalGuestsAttending;
      document.getElementById('stat-declined').textContent = summary.declinedResponses;

      if (responses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10">No responses yet.</td></tr>';
        return;
      }

      tableBody.innerHTML = responses
        .map(
          (r) => `
        <tr data-id="${r.id}">
          <td>${escapeHtml(r.full_name)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${r.attending ? 'Yes' : 'No'}</td>
          <td>${escapeHtml(r.guest_count)}</td>
          <td>${escapeHtml(r.meal_choice)}</td>
          <td>${escapeHtml(r.song_request)}</td>
          <td>${escapeHtml(r.message)}</td>
          <td>${escapeHtml(r.language)}</td>
          <td>${formatDate(r.submitted_at)}</td>
          <td><button class="admin-delete-btn" data-id="${r.id}">Delete</button></td>
        </tr>`
        )
        .join('');
    } catch (err) {
      console.error('Could not load RSVPs:', err);
      tableBody.innerHTML =
        '<tr><td colspan="10">Could not load responses. Try refreshing.</td></tr>';
    }
  }

  async function deleteRsvp(id) {
    if (!confirm('Delete this RSVP response? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/rsvps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      loadRsvps();
    } catch (err) {
      console.error('Could not delete RSVP:', err);
      alert('Could not delete this response. Please try again.');
    }
  }

  tableBody.addEventListener('click', (event) => {
    const btn = event.target.closest('.admin-delete-btn');
    if (btn) deleteRsvp(btn.dataset.id);
  });

  refreshBtn.addEventListener('click', loadRsvps);

  document.addEventListener('DOMContentLoaded', loadRsvps);
})();
