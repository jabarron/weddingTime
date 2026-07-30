/**
 * ============================================================================
 *  rsvp-form.js — handles the RSVP form submission
 * ============================================================================
 *  Loaded after main.js (see index.html). Two things happen here:
 *
 *    1. Guest count behavior tied to the attending radio buttons:
 *       - "No podré asistir" -> guest count field is disabled and set to 0
 *       - "Sí, ahí estaré"   -> guest count field is enabled; if it was just
 *         re-enabled (coming from "No"), it resets to 1
 *
 *    2. Form validation + submission. Required: name, phone, attending —
 *       plus guest count > 0, but ONLY when attending = yes (see
 *       validateForm). Each required field's wrapping <div class="field">
 *       has an id (field-fullName, field-phone, field-attending,
 *       field-guestCount) that gets the `field--invalid` class on a failed
 *       check — styles.css draws an outline around it.
 * ============================================================================
 */

(function () {
  const REQUIRED_FIELD_IDS = [
    'field-fullName',
    'field-phone',
    'field-attending',
    'field-guestCount',
  ];

  function clearInvalidState() {
    REQUIRED_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('field--invalid');
    });
  }

  /**
   * Validates the form. Returns { isValid, errorKey } where errorKey is the
   * i18n key of the message to show (or null if valid).
   */
  function validateForm(form) {
    clearInvalidState();

    let hasBasicError = false;
    if (!form.fullName.value.trim()) {
      document.getElementById('field-fullName').classList.add('field--invalid');
      hasBasicError = true;
    }
    if (!form.phone.value.trim()) {
      document.getElementById('field-phone').classList.add('field--invalid');
      hasBasicError = true;
    }
    const attendingChecked = form.querySelector('input[name="attending"]:checked');
    if (!attendingChecked) {
      document.getElementById('field-attending').classList.add('field--invalid');
      hasBasicError = true;
    }

    if (hasBasicError) {
      return { isValid: false, errorKey: 'rsvp_required_error' };
    }

    // Guest count only needs to be > 0 when the guest is actually coming.
    if (attendingChecked.value === 'yes') {
      const guestCountValue = Number(form.guestCount.value);
      if (!form.guestCount.value || !(guestCountValue > 0)) {
        document.getElementById('field-guestCount').classList.add('field--invalid');
        return { isValid: false, errorKey: 'rsvp_guest_count_error' };
      }
    }

    return { isValid: true, errorKey: null };
  }

  /** Wires the guest count field to the attending radio buttons. */
  function setupGuestCountToggle(form) {
    const guestCountInput = form.guestCount;
    const guestCountField = document.getElementById('field-guestCount');

    form.addEventListener('change', (event) => {
      if (event.target.name !== 'attending') return;

      if (event.target.value === 'no') {
        guestCountInput.value = '0';
        guestCountInput.disabled = true;
        if (guestCountField) guestCountField.classList.remove('field--invalid');
      } else if (event.target.value === 'yes') {
        // Only reset to 1 if it was just re-enabled (i.e. "No" was
        // selected before this) — leave an existing value alone otherwise.
        if (guestCountInput.disabled) {
          guestCountInput.value = '1';
        }
        guestCountInput.disabled = false;
      }
    });
  }

  function setupRsvpForm() {
    const form = document.querySelector('#rsvp-form');
    const statusEl = document.querySelector('.rsvp__status');
    if (!form) return;

    setupGuestCountToggle(form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const lang = document.documentElement.lang || 'es';
      const dict = window.DICTIONARY[lang];
      const submitBtn = form.querySelector('button[type="submit"]');

      const validation = validateForm(form);
      if (!validation.isValid) {
        statusEl.textContent = dict[validation.errorKey];
        statusEl.dataset.state = 'required';
        return;
      }

      const attendingValue = form.querySelector('input[name="attending"]:checked');

      const payload = {
        fullName: form.fullName.value,
        phone: form.phone.value,
        attending: attendingValue.value === 'yes',
        guestCount: Number(form.guestCount.value) || 0,
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
        form.guestCount.disabled = false;
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
      if (event.target.name === 'guestCount') {
        const value = Number(form.guestCount.value);
        if (form.guestCount.value && value > 0) {
          field.classList.remove('field--invalid');
        }
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
