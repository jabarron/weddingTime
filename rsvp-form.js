/**
 * ============================================================================
 *  rsvp-form.js — handles the RSVP form submission
 * ============================================================================
 *  Loaded after main.js (see index.html). Listens for the form's `submit`
 *  event, posts the data to POST /api/rsvp (routes-rsvp.js), and shows a
 *  success or error message in place without leaving the page.
 * ============================================================================
 */

(function () {
  function setupRsvpForm() {
    const form = document.querySelector('#rsvp-form');
    const statusEl = document.querySelector('.rsvp__status');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const lang = document.documentElement.lang || 'es';
      const dict = window.DICTIONARY[lang];
      const submitBtn = form.querySelector('button[type="submit"]');

      const attendingValue = form.querySelector('input[name="attending"]:checked');

      const payload = {
        fullName: form.fullName.value,
        email: form.email.value || null,
        attending: attendingValue ? attendingValue.value === 'yes' : null,
        guestCount: Number(form.guestCount.value) || 1,
        mealChoice: form.mealChoice.value || null,
        songRequest: form.songRequest.value || null,
        message: form.message.value || null,
        language: lang,
      };

      if (!payload.fullName || payload.attending === null) {
        statusEl.textContent = dict.rsvp_error;
        statusEl.dataset.state = 'error';
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = '';
      statusEl.removeAttribute('data-state');

      try {
        const res = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('RSVP request failed');

        statusEl.textContent = dict.rsvp_success;
        statusEl.dataset.state = 'success';
        form.reset();
      } catch (err) {
        console.error('RSVP submission failed:', err);
        statusEl.textContent = dict.rsvp_error;
        statusEl.dataset.state = 'error';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', setupRsvpForm);
})();
