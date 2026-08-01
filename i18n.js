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
    nav_dress: 'Vestimenta',
    nav_gifts: 'Regalos',
    nav_rsvp: 'Asistencia',

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

    // ✏️ EDIT ME: three more "chapters" of your story, shown below the intro
    // above with alternating photo/text. Replace freely — add or remove
    // pairs of *_heading/*_body keys if you want more or fewer than 3 (and
    // update index.html to match, see the story-milestones comment there).
    story_milestone1_heading: 'Cómo nos conocimos',
    story_milestone1_body:
      'Nuestro primer encuentro fue casi por accidente, pero desde ese momento supimos que había algo especial. Fue el inicio de una amistad que, sin darnos cuenta, se convirtió en algo mucho más grande.',
    story_milestone2_heading: 'Primera cita',
    story_milestone2_body:
      'Nuestra primera cita oficial fue una tarde llena de risas y nervios. Hablamos durante horas como si nos conociéramos de toda la vida, y supimos que queríamos seguir escribiendo esta historia juntos.',
    story_milestone3_heading: 'La propuesta',
    story_milestone3_body:
      'Después de tantos momentos compartidos, llegó el día en que decidimos dar el siguiente paso. Entre lágrimas y una gran sonrisa, dijimos que sí a pasar el resto de nuestras vidas juntos.',
    story_milestone4_heading: 'Simplemente nosotros',
    story_milestone4_body:
      'De todos los momentos, los favoritos siguen siendo los más simples — un café, una plática sin prisa, y la certeza de estar exactamente donde queremos estar.',

    // ✏️ EDIT ME: your chosen verse — swap for a different one/translation
    // any time. quote_source is optional — leave it empty ('') if you
    // don't want a citation line under it.
    quote_text:
      'La verdad, más valen dos que uno, porque sacan más provecho de lo que hacen. Además, si uno de ellos se tropieza, el otro puede levantarlo. Pero ¡pobre del que cae y no tiene quien lo ayude a levantarse!',
    quote_source: 'TLA Eclesiastés 4:9-10',

    details_eyebrow: 'Detalles',
    details_heading: 'Cuándo y dónde',
    details_date_label: 'Fecha',
    details_venue_label: 'Lugar',
    details_venue_cta: 'Ver en el mapa',
    details_rsvp_label: 'Confirmar antes del',

    itinerary_eyebrow: 'Itinerario',
    itinerary_heading: 'Cronología de nuestra boda',

    dress_eyebrow: 'Código de Vestimenta',
    dress_heading: 'Formal / Elegante',
    // ✏️ EDIT ME: replace with your real dress code guidance.
    dress_body:
      'Nos encantaría que nos acompañaran con un atuendo formal para celebrar este día tan especial. ¡Estamos seguros de que lucirán increíbles!',
    // ✏️ EDIT ME: adjust the wording if you'd like.
    dress_avoid_white: 'Respetuosamente, les pedimos que eviten el color blanco.',

    gifts_eyebrow: 'Regalos',
    gifts_heading: 'Su compañía es el regalo más hermoso.',
    gifts_body:
      'Nos sentimos profundamente agradecidos de poder compartir este momento con ustedes. Si desean hacernos un obsequio, tendremos preparado un buzón para sobres durante la recepción.',

    rsvp_eyebrow: 'RSVP',
    rsvp_heading: 'Confirma tu asistencia',
    rsvp_intro: '¡Ya queremos verte ahí!',
    rsvp_name: 'Familia / Nombre completo',
    rsvp_phone: 'Teléfono',
    rsvp_attending: '¿Podrás acompañarnos?',
    rsvp_attending_yes: 'Sí, ahí estaré',
    rsvp_attending_no: 'No podré asistir',
    rsvp_guest_count: 'Número de personas',
    rsvp_song: 'Una canción que no puede faltar',
    rsvp_message: 'Mensaje para los novios',
    rsvp_submit: 'Enviar confirmación',
    rsvp_success: '¡Gracias! Tu confirmación fue recibida.',
    rsvp_error: 'Hubo un problema al enviar tu confirmación. Intenta de nuevo.',
    rsvp_required_error: 'Por favor completa los campos obligatorios: nombre, teléfono y confirmación de asistencia.',
    rsvp_guest_count_error: 'Agrega un número de invitados entre 1 y 2',

    footer_contact: 'Si tienes dudas, por favor contáctanos.',

    // ✏️ Admin dashboard (/admin) — inherits whichever language was last
    // selected on the public site (see admin.js), no separate toggle.
    admin_title: 'Panel de RSVP',
    admin_export_btn: 'Descargar Excel',
    admin_refresh_btn: 'Actualizar',
    admin_scroll_hint: 'Desliza izquierda/derecha para ver más columnas →',
    admin_stat_attending: 'Respuestas confirmadas',
    admin_stat_guests: 'Total de asistentes',
    admin_stat_declined: 'Respuestas declinadas',
    admin_th_name: 'Nombre',
    admin_th_phone: 'Teléfono',
    admin_th_attending: 'Asiste',
    admin_th_guests: 'Invitados',
    admin_th_song: 'Canción',
    admin_th_message: 'Mensaje',
    admin_th_submitted: 'Enviado',
    admin_th_actions: 'Acciones',
    admin_yes: 'Sí',
    admin_no: 'No',
    admin_edit_btn: 'Editar',
    admin_delete_btn: 'Eliminar',
    admin_save_btn: 'Guardar',
    admin_cancel_btn: 'Cancelar',
    admin_loading: 'Cargando…',
    admin_empty: 'Aún no hay respuestas.',
    admin_load_error: 'No se pudieron cargar las respuestas. Intenta actualizar.',
    admin_delete_confirm: '¿Eliminar esta respuesta de RSVP? Esta acción no se puede deshacer.',
    admin_delete_error: 'No se pudo eliminar esta respuesta. Intenta de nuevo.',
    admin_save_error: 'No se pudieron guardar los cambios. Intenta de nuevo.',
    admin_required_alert: 'Nombre y teléfono son obligatorios.',
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

    // ✏️ EDIT ME: three more "chapters" of your story, shown below the intro
    // above with alternating photo/text.
    story_milestone1_heading: 'How we met',
    story_milestone1_body:
      "Our first meeting was almost by accident, but from that moment we knew there was something special. It was the start of a friendship that, before we knew it, became something much bigger.",
    story_milestone2_heading: 'First date',
    story_milestone2_body:
      "Our first official date was an afternoon full of laughter and nerves. We talked for hours as if we'd known each other forever, and we knew we wanted to keep writing this story together.",
    story_milestone3_heading: 'The proposal',
    story_milestone3_body:
      "After so many moments shared together, the day came to take the next step. Between tears and a huge smile, we said yes to spending the rest of our lives together.",
    story_milestone4_heading: 'Simply us',
    story_milestone4_body:
      "Of all the moments, our favorites are still the simplest ones — a coffee, an unhurried conversation, and the certainty of being exactly where we want to be.",

    // ✏️ EDIT ME: your chosen verse — swap for a different one/translation
    // any time.
    quote_text:
      'Two are better than one, because they have a good return for their labor. If either of them falls down, one can help the other up. But pity anyone who falls and has no one to help them up.',
    quote_source: 'NIV Ecclesiastes 4:9-10',

    details_eyebrow: 'Details',
    details_heading: 'When & where',
    details_date_label: 'Date',
    details_venue_label: 'Venue',
    details_venue_cta: 'Open in Maps',
    details_rsvp_label: 'RSVP by',

    itinerary_eyebrow: 'Itinerary',
    itinerary_heading: 'Wedding Day Timeline',

    dress_eyebrow: 'Dress Code',
    dress_heading: 'Formal / Elegant',
    // ✏️ EDIT ME: replace with your real dress code guidance.
    dress_body:
      "We'd love for you to join us in formal attire to celebrate this special day. We're sure you'll look amazing!",
    // ✏️ EDIT ME: adjust the wording if you'd like.
    dress_avoid_white: 'We kindly ask that you avoid wearing white.',

    gifts_eyebrow: 'Gifts',
    gifts_heading: 'Your company is the most beautiful gift.',
    gifts_body:
      "We feel deeply grateful to be able to share this moment with you. If you'd like to give us a gift, we'll have an envelope box ready during the reception.",

    rsvp_eyebrow: 'RSVP',
    rsvp_heading: 'Confirm your attendance',
    rsvp_intro: "We can't wait to see you there!",
    rsvp_name: 'Family / Full name',
    rsvp_phone: 'Phone number',
    rsvp_attending: 'Will you be joining us?',
    rsvp_attending_yes: "Yes, I'll be there",
    rsvp_attending_no: "I can't make it",
    rsvp_guest_count: 'Number of guests',
    rsvp_song: "A song that has to be played",
    rsvp_message: 'Message for the couple',
    rsvp_submit: 'Send RSVP',
    rsvp_success: 'Thank you! Your RSVP has been received.',
    rsvp_error: 'Something went wrong sending your RSVP. Please try again.',
    rsvp_required_error: 'Please fill in the required fields: name, phone, and attendance confirmation.',
    rsvp_guest_count_error: 'Please add a number of guests between 1 and 2',

    footer_contact: 'If you have any questions, please reach out to us.',

    admin_title: 'RSVP Dashboard',
    admin_export_btn: 'Download Excel',
    admin_refresh_btn: 'Refresh',
    admin_scroll_hint: 'Swipe left/right to see more columns →',
    admin_stat_attending: 'Attending responses',
    admin_stat_guests: 'Total guests attending',
    admin_stat_declined: 'Declined responses',
    admin_th_name: 'Name',
    admin_th_phone: 'Phone',
    admin_th_attending: 'Attending',
    admin_th_guests: 'Guests',
    admin_th_song: 'Song',
    admin_th_message: 'Message',
    admin_th_submitted: 'Submitted',
    admin_th_actions: 'Actions',
    admin_yes: 'Yes',
    admin_no: 'No',
    admin_edit_btn: 'Edit',
    admin_delete_btn: 'Delete',
    admin_save_btn: 'Save',
    admin_cancel_btn: 'Cancel',
    admin_loading: 'Loading…',
    admin_empty: 'No responses yet.',
    admin_load_error: 'Could not load responses. Try refreshing.',
    admin_delete_confirm: 'Delete this RSVP response? This cannot be undone.',
    admin_delete_error: 'Could not delete this response. Please try again.',
    admin_save_error: 'Could not save changes. Please try again.',
    admin_required_alert: 'Name and phone are required.',
  },
};

// Exposed as a global so main.js and rsvp-form.js (loaded as plain <script>
// tags, no build step) can read it directly.
window.DICTIONARY = DICTIONARY;
