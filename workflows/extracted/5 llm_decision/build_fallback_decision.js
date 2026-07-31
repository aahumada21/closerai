// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        build_fallback_decision
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const validation = $json;
const prepared = $('prepare_context_and_guardrail').first().json;

const context = prepared.context_packet || {};
const allowed = prepared.allowed_actions || [];
const state = context.state || {};
const conversation = context.conversation || {};
const text = String(conversation.latest_user_message || '').toLowerCase();

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function looksLikeAddress(rawText) {
  const t = normalize(rawText);
  if (t.length < 8) return false;

  const hasNumber = /\d{2,6}/.test(t);
  const words = [
    'calle',
    'avenida',
    'av',
    'pasaje',
    'camino',
    'condominio',
    'depto',
    'departamento',
    'casa',
    'block',
    'torre',
    'villa',
    'pje',
    'edificio',
    'porton',
    'portn'
  ];

  return hasNumber || words.some(w => t.includes(normalize(w)));
}

function getAvailabilityConfig(rawText) {
  const t = normalize(rawText);

  if (
    t.includes('proxima semana') ||
    t.includes('siguiente semana') ||
    t.includes('la otra semana') ||
    t.includes('otra semana')
  ) {
    return {
      availability_window: 'next_week',
      availability_label: 'la prxima semana',
      days_ahead: 7,
      start_offset_days: 7,
      max_slots: 5
    };
  }

  if (
    t.includes('mas adelante') ||
    t.includes('mas horarios') ||
    t.includes('otros horarios') ||
    t.includes('otros dias') ||
    t.includes('otras semanas')
  ) {
    return {
      availability_window: 'next_14_days',
      availability_label: 'las prximas dos semanas',
      days_ahead: 14,
      start_offset_days: 0,
      max_slots: 6
    };
  }

  if (
    t.includes('este mes') ||
    t.includes('durante el mes')
  ) {
    return {
      availability_window: 'next_30_days',
      availability_label: 'las prximas semanas',
      days_ahead: 30,
      start_offset_days: 0,
      max_slots: 8
    };
  }

  return {
    availability_window: 'this_week',
    availability_label: 'los proximos dias',
    days_ahead: 7,
    start_offset_days: 0,
    max_slots: 3
  };
}

const normalizedText = normalize(text);

const asksAvailability =
  normalizedText.includes('horario') ||
  normalizedText.includes('hora disponible') ||
  normalizedText.includes('disponible') ||
  normalizedText.includes('disponibilidad') ||
  normalizedText.includes('fecha') ||
  normalizedText.includes('agenda') ||
  normalizedText.includes('agendar') ||
  normalizedText.includes('proxima semana') ||
  normalizedText.includes('mas horarios') ||
  normalizedText.includes('otros dias');

const wantsCancel =
  normalizedText.includes('cancelar') ||
  normalizedText.includes('anular') ||
  normalizedText.includes('cancela') ||
  normalizedText.includes('no podre asistir') ||
  normalizedText.includes('no puedo asistir');

const wantsReschedule =
  normalizedText.includes('reagendar') ||
  normalizedText.includes('reprogramar') ||
  normalizedText.includes('cambiar la hora') ||
  normalizedText.includes('cambiar el horario') ||
  normalizedText.includes('otra hora') ||
  normalizedText.includes('otro dia') ||
  normalizedText.includes('no me sirve');

const waitingAddress =
  state.stage === 'collecting_address' ||
  state.next_goal === 'collect_address' ||
  state.last_bot_action === 'collect_address';

const hasBookingBasics =
  !!state.service_interest &&
  !!state.vehicle_type &&
  !!state.district;

const missingFields =
  Array.isArray(state.missing_fields)
    ? state.missing_fields
    : Array.isArray(context.context_hints?.priority_missing_fields)
      ? context.context_hints.priority_missing_fields
      : [];

let decision = null;

if (
  validation.validation_errors?.includes('confirm_booking_without_address') &&
  allowed.includes('collect_address')
) {
  decision = {
    action: 'collect_address',
    reason: 'Fallback seguro: el usuario confirm horario, pero falta direccion exacta antes de reservar.',
    message: 'Perfecto. Antes de confirmar la reserva, ¿me puedes enviar la direccion exacta donde seria el servicio?',
    state_update: {
      stage: 'collecting_address',
      next_goal: 'collect_address',
      intent_last: 'booking_confirmed_address_missing',
      last_bot_action: 'collect_address',
      missing_fields: ['address']
    },
    confidence: 0.2
  };
}

if (!decision && waitingAddress && looksLikeAddress(text) && allowed.includes('confirm_address')) {
  decision = {
    action: 'confirm_address',
    reason: 'Fallback seguro: el usuario entreg una direccion mientras el bot estaba esperando direccion.',
    message: '',
    state_update: {
      stage: 'address_confirmation',
      next_goal: 'validate_address',
      intent_last: 'address_provided',
      service_address: conversation.latest_user_message,
      address: conversation.latest_user_message,
      address_reference: conversation.latest_user_message,
      address_confirmed: false,
      last_bot_action: 'confirm_address_in_progress',
      missing_fields: []
    },
    confidence: 0.2
  };
}

if (!decision && wantsCancel && allowed.includes('cancel_booking')) {
  decision = {
    action: 'cancel_booking',
    reason: 'Fallback seguro: el usuario pidi cancelar una reserva.',
    message: '',
    state_update: {
      stage: 'cancelling',
      next_goal: 'cancel_active_booking',
      intent_last: 'cancel_booking_requested',
      last_bot_action: 'cancel_booking_in_progress',
      missing_fields: []
    },
    confidence: 0.2
  };
}

if (!decision && wantsReschedule && allowed.includes('reschedule_booking')) {
  decision = {
    action: 'reschedule_booking',
    reason: 'Fallback seguro: el usuario pidi cambiar da u hora de su reserva.',
    message: '',
    state_update: {
      stage: 'reschedule',
      next_goal: 'collect_new_slot',
      intent_last: 'reschedule_booking_requested',
      last_bot_action: 'reschedule_booking_in_progress',
      missing_fields: []
    },
    confidence: 0.2
  };
}

if (!decision && asksAvailability && hasBookingBasics && allowed.includes('offer_available_slots')) {
  const availability = getAvailabilityConfig(text);

  decision = {
    action: 'offer_available_slots',
    reason: 'Fallback seguro: el usuario pidi disponibilidad y existen los datos mnimos para consultar horarios reales.',
    message: '',
    state_update: {
      stage: 'booking_selection',
      next_goal: 'send_available_slots',
      intent_last: 'availability_requested',
      ...availability,
      last_bot_action: 'offer_available_slots',
      missing_fields: []
    },
    confidence: 0.2
  };
}

if (!decision && missingFields.length > 0 && allowed.includes('ask_missing_data')) {
  const firstMissing = missingFields[0];

  let message = 'Perfecto. Para avanzar, necesito un dato mas. ¿me lo puedes indicar?';
  let nextGoal = 'collect_missing_data';

  if (firstMissing === 'district') {
    message = 'Perfecto. Para ayudarte bien, en que comuna estas?';
    nextGoal = 'collect_district';
  }

  if (firstMissing === 'vehicle_type') {
    message = "Perfecto. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon.";
    nextGoal = 'collect_vehicle_type';
  }

  if (firstMissing === 'service_interest') {
    message = "Gracias por escribir a Ahumada Detailing. Te ayudo a elegir el servicio ideal para tu auto.\n\nTenemos 3 opciones:\n1. Lavado basico: mantencion rapida para dejarlo limpio por dentro y fuera.\n2. Lavado premium: limpieza mas completa y detallada, ideal si viene bien sucio o quieres un resultado mas pro.\n3. Encerado full: proteccion y brillo para la pintura.\n\nCual te interesa? Si no estas seguro, cuentame como esta tu auto y te recomiendo uno.";
    nextGoal = 'collect_service_interest';
  }

  if (firstMissing === 'address') {
    message = 'Perfecto. Para dejar la reserva bien registrada, ¿me puedes enviar la direccion exacta donde seria el servicio?';
    nextGoal = 'collect_address';
  }

  decision = {
    action: 'ask_missing_data',
    reason: 'Fallback seguro orientado a recopilar el siguiente dato crtico.',
    message,
    state_update: {
      stage: state.stage || 'new_lead',
      next_goal: nextGoal,
      intent_last: state.intent_last || null,
      last_bot_action: 'ask_missing_data',
      missing_fields: missingFields
    },
    confidence: 0.2
  };
}

if (!decision && allowed.includes('answer_question')) {
  decision = {
    action: 'answer_question',
    reason: 'Fallback conservador para mantener conversacin segura.',
    message: 'Gracias por tu mensaje. ¿me puedes dar un poco mas de detalle para responderte bien?',
    state_update: {
      stage: state.stage || null,
      next_goal: state.next_goal || null,
      intent_last: state.intent_last || null,
      last_bot_action: 'answer_question',
      missing_fields: missingFields
    },
    confidence: 0.2
  };
}

if (!decision && allowed.includes('handoff_human')) {
  decision = {
    action: 'handoff_human',
    reason: 'Fallback a humano por imposibilidad de validar una decisin segura.',
    message: 'Gracias por escribir. Voy a derivar tu caso para que te ayuden directamente.',
    state_update: {
      stage: 'human_handoff',
      next_goal: 'human_review',
      intent_last: 'handoff_required',
      human_handoff: true,
      last_bot_action: 'handoff_human',
      missing_fields: []
    },
    confidence: 0.2
  };
}

if (!decision) {
  decision = {
    action: allowed[0] || 'handoff_human',
    reason: 'Fallback final usando primera accin permitida.',
    message: '',
    state_update: {
      last_bot_action: allowed[0] || 'handoff_human',
      missing_fields: missingFields
    },
    confidence: 0.2
  };
}

return [{
  json: {
    valid: true,
    fallback_used: true,
    original_validation_errors: validation.validation_errors || [],
    original_validation_warnings: validation.validation_warnings || [],
    decision
  }
}];
