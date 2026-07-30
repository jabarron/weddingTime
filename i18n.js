/**
 * ============================================================================
 *  i18n.js — bilingual text dictionary (Spanish / English)
 * ============================================================================
 *  Every piece of copy on the page reads from this file through the
 *  `data-i18n="key"` attribute (see main.js -> applyLanguage()).
 *
 *  ✏️ EDIT ME: "Our story" and "Dress code" paragraphs below are placeholder
 *  copy — replace them with your own words. Everything else is interface
 *  labels (buttons, headings) that most couples won't need to touch.
 *
 *  Facts like names/date/venue do NOT live here — those come from
 *  wedding-config.js on the server and are merged in by main.js.
 * ============================================================================
 */

const DICTIONARY = {
  es: {
    nav_story: 'Nuestra Historia',
    nav_details: 'Detalles',
    nav_itinerary: 'Itinerario',
    nav_dress: 'Código de Vestimenta',
    nav_gifts: 'Regalos',
    nav_rsvp: 'Confirmar Asistencia',

    hero_eyebrow: 'Nos Casamos',
    hero_cta: 'Confirmar Asistencia',

    countdown_days: 'Días',
    countdown_hours: 'Horas',
    countdown_minutes: 'Min',
    countdown_seconds: 'Seg',

    story_eyebrow: 'Nuestra Historia',
    story_heading: 'Cómo empezó todo',
    // ✏️ EDIT ME: replace with your real story.
    story_body:
      'Lo que comenzó como una casualidad se convirtió en la certeza de querer construir una vida juntos. Entre risas, viajes y una que otra taza de café, hoy estamos listos para dar el siguiente paso — y no imaginamos mejor manera de hacerlo que rodeados de las personas que más queremos.',

    details_eyebrow: 'Detalles',
    details_heading: 'Cuándo y dónde',
    details_date_label: 'Fecha',
    details_venue_label: 'Lugar',
    details_venue_cta: 'Ver en el mapa',
    details_rsvp_label: 'Confirmar antes del',

    itinerary_eyebrow: 'Itinerario',
    itinerary_heading: 'El día se vivirá así',

    dress_eyebrow: 'Código de Vestimenta',
    dress_heading: 'Formal / Elegante',
    // ✏️ EDIT ME: replace with your real dress code guidance.
    dress_body:
      'Nos encantaría que nos acompañaran con un atuendo formal. Estos son los tonos de nuestra paleta — siéntanse libres de inspirarse en ellos, aunque no es obligatorio.',

    gifts_eyebrow: 'Regalos',
    gifts_heading: 'Su presencia es nuestro mejor regalo',
    // ✏️ EDIT ME: replace with your real message about gifts / the envelope box.
    gifts_body:
      'Contar con ustedes ese día ya es un regalo enorme. Si desean obsequiarnos algo más, tendremos un buzón para sobres durante la recepción.',

    rsvp_eyebrow: 'RSVP',
    rsvp_heading: 'Confirma tu asistencia',
    rsvp_intro: 'Por favor confirma antes de la fecha límite. ¡Nos hace muy felices contar contigo!',
    rsvp_name: 'Nombre completo',
    rsvp_phone: 'Teléfono',
    rsvp_attending: '¿Podrás acompañarnos?',
    rsvp_attending_yes: 'Sí, ahí estaré',
    rsvp_attending_no: 'No podré asistir',
    rsvp_guest_count: 'Número de personas (incluyéndote)',
    rsvp_song: 'Una canción que no puede faltar (opcional)',
    rsvp_message: 'Mensaje para los novios (opcional)',
    rsvp_submit: 'Enviar confirmación',
    rsvp_success: '¡Gracias! Tu confirmación fue recibida.',
    rsvp_error: 'Hubo un problema al enviar tu confirmación. Intenta de nuevo.',
    rsvp_required_error: 'Por favor completa los campos obligatorios: nombre, teléfono y confirmación de asistencia.',

    footer_contact: 'Preguntas',
  },

  en: {
    nav_story: 'Our Story',
    nav_details: 'Details',
    nav_itinerary: 'Itinerary',
    nav_dress: 'Dress Code',
    nav_gifts: 'Gifts',
    nav_rsvp: 'RSVP',

    hero_eyebrow: "We're Getting Married",
    hero_cta: 'RSVP',

    countdown_days: 'Days',
    countdown_hours: 'Hours',
    countdown_minutes: 'Min',
    countdown_seconds: 'Sec',

    story_eyebrow: 'Our Story',
    story_heading: 'How it all began',
    // ✏️ EDIT ME: replace with your real story.
    story_body:
      "What started as a chance meeting turned into the certainty that we wanted to build a life together. Between laughs, trips, and a coffee or two, we're ready to take the next step — and we can't imagine a better way to do it than surrounded by the people we love most.",

    details_eyebrow: 'Details',
    details_heading: 'When & where',
    details_date_label: 'Date',
    details_venue_label: 'Venue',
    details_venue_cta: 'Open in Maps',
    details_rsvp_label: 'RSVP by',

    itinerary_eyebrow: 'Itinerary',
    itinerary_heading: "Here's how the day will go",

    dress_eyebrow: 'Dress Code',
    dress_heading: 'Formal / Elegant',
    // ✏️ EDIT ME: replace with your real dress code guidance.
    dress_body:
      "We'd love for you to join us in formal attire. Here are the tones from our palette — feel free to draw inspiration from them, though it isn't required.",

    gifts_eyebrow: 'Gifts',
    gifts_heading: 'Your presence is our favorite gift',
    // ✏️ EDIT ME: replace with your real message about gifts / the envelope box.
    gifts_body:
      "Having you there means everything to us. If you'd like to give us something more, we'll have an envelope box available during the reception.",

    rsvp_eyebrow: 'RSVP',
    rsvp_heading: 'Confirm your attendance',
    rsvp_intro: "Please respond by the date below. We can't wait to celebrate with you!",
    rsvp_name: 'Full name',
    rsvp_phone: 'Phone number',
    rsvp_attending: 'Will you be joining us?',
    rsvp_attending_yes: "Yes, I'll be there",
    rsvp_attending_no: "I can't make it",
    rsvp_guest_count: 'Number of guests (including you)',
    rsvp_song: "A song that has to be played (optional)",
    rsvp_message: 'Message for the couple (optional)',
    rsvp_submit: 'Send RSVP',
    rsvp_success: 'Thank you! Your RSVP has been received.',
    rsvp_error: 'Something went wrong sending your RSVP. Please try again.',
    rsvp_required_error: 'Please fill in the required fields: name, phone, and attendance confirmation.',

    footer_contact: 'Questions',
  },
};

// Exposed as a global so main.js and rsvp-form.js (loaded as plain <script>
// tags, no build step) can read it directly.
window.DICTIONARY = DICTIONARY;
