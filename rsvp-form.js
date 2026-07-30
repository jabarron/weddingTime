/**
 * ============================================================================
 *  rsvp-form.js — handles the RSVP form submission
 * ============================================================================
 *  Loaded after main.js (see index.html). Listens for the form's `submit`
 *  event, validates the required fields client-side (name, phone, attending
 *  — see REQUIRED_FIELD_IDS below), posts the data to POST /api/rsvp
 *  (routes-rsvp.js), and shows a success or error message in place without
 *  leaving the page.
 *
 *  Required-field UI: each required field's wrapping <div class="field">
 *  has an id (field-fullName, field-phone, field-attending). On a failed
 *  validation, this file adds the `field--invalid` class to the relevant
 *  wrapper(s) — styles.css uses that class to draw an outline around the
 *  field — and shows the general "please fill required fields" message.
 * ============================================================================
 */

(function () {
  const REQUIRED_FIELD_IDS = ['field-fullName', 'field-phone', 'field-attending'];

  function clearInvalidState() {
    REQUIRED_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('field--invalid');
    });
  }

  /**
   * Checks the three required fields. Returns true if all are filled in;
   * otherwise marks the empty ones with `field--invalid` and returns false.
   */
  function validateRequiredFields(form) {
    clearInvalidState();
    let isValid = true;

    if (!form.fullName.value.trim()) {
      document.getElementById('field-fullName').classList.add('field--invalid');
      isValid = false;
    }
    if (!form.phone.value.trim()) {
      document.getElementById('field-phone').classList.add('field--invalid');
      isValid = false;
    }
    if (!form.querySelector('input[name="attending"]:checked')) {
      document.getElementById('field-attending').classList.add('field--invalid');
      isValid = false;
    }

    return isValid;
  }

  function setupRsvpForm() {
    const form = document.querySelector('#rsvp-form');
    const statusEl = document.querySelector('.rsvp__status');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const lang = document.documentElement.lang || 'es';
      const dict = window.DICTIONARY[lang];
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!validateRequiredFields(form)) {
        statusEl.textContent = dict.rsvp_required_error;
        statusEl.dataset.state = 'required';
        return;
      }

      const attendingValue = form.querySelector('input[name="attending"]:checked');

      const payload = {
        fullName: form.fullName.value,
        phone: form.phone.value,
        attending: attendingValue.value === 'yes',
        guestCount: Number(form.guestCount.value) || 1,
        songRequest: form.songRequest.value || null,
        message: form.message.value || null,
      };

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
        clearInvalidState();
      } catch (err) {
        console.error('RSVP submission failed:', err);
        statusEl.textContent = dict.rsvp_error;
        statusEl.dataset.state = 'error';
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Clear the invalid highlight on a field as soon as the guest fixes it.
    form.addEventListener('input', (event) => {
      const field = event.target.closest('.field--invalid');
      if (!field) return;
      if (event.target.name === 'fullName' && form.fullName.value.trim()) {
        field.classList.remove('field--invalid');
      }
      if (event.target.name === 'phone' && form.phone.value.trim()) {
        field.classList.remove('field--invalid');
      }
    });
    form.addEventListener('change', (event) => {
      if (event.target.name === 'attending') {
        const field = document.getElementById('field-attending');
        if (field) field.classList.remove('field--invalid');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', setupRsvpForm);
})();
