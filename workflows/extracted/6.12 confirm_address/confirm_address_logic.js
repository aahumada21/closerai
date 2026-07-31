// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.12 confirm_address  (workflow id 65759df4-4c07-45f3-88f5-e972faf3304f)
// Nodo:        confirm_address_logic
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback = {}) {
  if (value && typeof value === "object") return value;

  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function cleanText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

const executionContext = parseMaybeJson($json.execution_context, $json.execution_context || {});
const contextPacket = parseMaybeJson($json.context_packet, $json.context_packet || {});
const decision = parseMaybeJson($json.decision, $json.decision || {});
const stateUpdateInput = parseMaybeJson($json.state_update, $json.state_update || {});
const executionMeta = parseMaybeJson($json.execution_meta, $json.execution_meta || {});

const state = contextPacket.state || {};
const lead = contextPacket.lead || {};
const conversation = contextPacket.conversation || {};

const leadId = firstValue(
  $json.lead_id,
  executionContext.lead_id,
  lead.id,
  state.lead_id
);

const channel = firstValue(
  $json.channel,
  executionContext.channel,
  lead.channel,
  "whatsapp"
);

const phone = firstValue(
  $json.phone,
  executionContext.phone,
  lead.phone
);

const rawAddress = firstValue(
  $json.address,
  $json.service_address,
  executionContext.address,
  executionContext.service_address,
  decision.address,
  decision.state_update?.address,
  decision.state_update?.service_address,
  stateUpdateInput.address,
  stateUpdateInput.service_address,
  state.service_address,
  state.address,
  conversation.latest_user_message
);

const normalizedAddress = cleanText(rawAddress);

let addressReference = firstValue(
  $json.address_reference,
  executionContext.address_reference,
  decision.address_reference,
  decision.state_update?.address_reference,
  stateUpdateInput.address_reference,
  state.address_reference
);

addressReference = cleanText(addressReference);

// Evita guardar la misma direccion como referencia
if (
  addressReference &&
  normalizedAddress &&
  addressReference.toLowerCase() === normalizedAddress.toLowerCase()
) {
  addressReference = null;
}

const district = firstValue(
  $json.district,
  executionContext.district,
  decision.state_update?.district,
  stateUpdateInput.district,
  state.district
);

const serviceInterest = firstValue(
  $json.service_interest,
  executionContext.service_interest,
  state.service_interest
);

const vehicleType = firstValue(
  $json.vehicle_type,
  executionContext.vehicle_type,
  state.vehicle_type
);

const bookingDate = firstValue(
  executionContext.booking_date,
  stateUpdateInput.booking_date,
  decision.state_update?.booking_date,
  state.booking_date,
  $json.booking_date
);

const bookingTime = firstValue(
  executionContext.booking_time,
  stateUpdateInput.booking_time,
  decision.state_update?.booking_time,
  state.booking_time,
  $json.booking_time
);

const slotId = firstValue(
  executionContext.slot_id,
  stateUpdateInput.slot_id,
  decision.state_update?.slot_id,
  state.slot_id,
  bookingDate && bookingTime ? `${bookingDate}_${bookingTime}` : null
);

const availabilityConfirmed =
  executionContext.availability_confirmed ??
  stateUpdateInput.availability_confirmed ??
  decision.state_update?.availability_confirmed ??
  state.availability_confirmed ??
  true;

const durationMinutes = Number(
  executionContext.duration_minutes ||
  stateUpdateInput.duration_minutes ||
  state.duration_minutes ||
  120
);

const calendarId = firstValue(
  executionContext.calendar_id,
  stateUpdateInput.calendar_id,
  state.calendar_id,
  $json.calendar_id
);

if (!leadId) {
  throw new Error("Missing lead_id in confirm_address");
}

if (!normalizedAddress || normalizedAddress.length < 8) {
  return [{
    lead_id: leadId,
    channel,
    phone,

    message_to_send:
      "Perfecto. Para dejar la reserva bien registrada, me puedes enviar la direccion exacta donde seria el servicio?",

    db_operations: ["messages", "lead_state"],

    state_update: {
      ...stateUpdateInput,
      stage: "collecting_address",
      missing_fields: ["service_address"],
      next_goal: "collect_address",
      last_bot_action: "collect_address",

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,
      availability_confirmed: availabilityConfirmed,
      duration_minutes: durationMinutes,
      calendar_id: calendarId
    },

    execution_context: {
      ...executionContext,
      lead_id: leadId,
      channel,
      phone,
      action: "collect_address",

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,
      availability_confirmed: availabilityConfirmed,
      duration_minutes: durationMinutes,
      calendar_id: calendarId
    },

    context_packet: contextPacket,
    decision,
    execution_meta: executionMeta,

    execution_result: {
      success: true,
      action: "collect_address",
      message_sent: false,
      state_updated: true,
      db_records_created: ["messages", "lead_state"],
      notes: ["missing_service_address"]
    },

    notes: ["missing_service_address"]
  }];
}

if (!district) {
  return [{
    lead_id: leadId,
    channel,
    phone,

    message_to_send:
      "Gracias. Me confirmas la comuna donde seria el servicio?",

    db_operations: ["messages", "lead_state"],

    state_update: {
      ...stateUpdateInput,
      stage: "collecting_address",
      service_address: normalizedAddress,
      address_reference: addressReference,
      address_confirmed: false,
      missing_fields: ["district"],
      next_goal: "confirm_district",
      last_bot_action: "confirm_address_missing_district",

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,
      availability_confirmed: availabilityConfirmed,
      duration_minutes: durationMinutes,
      calendar_id: calendarId
    },

    execution_context: {
      ...executionContext,
      lead_id: leadId,
      channel,
      phone,
      action: "confirm_address",
      address: normalizedAddress,
      service_address: normalizedAddress,
      address_reference: addressReference,
      address_confirmed: false,

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,
      availability_confirmed: availabilityConfirmed,
      duration_minutes: durationMinutes,
      calendar_id: calendarId
    },

    context_packet: contextPacket,
    decision,
    execution_meta: executionMeta,

    execution_result: {
      success: true,
      action: "confirm_address",
      message_sent: false,
      state_updated: true,
      db_records_created: ["messages", "lead_state"],
      notes: ["missing_district"]
    },

    notes: ["missing_district"]
  }];
}

return [{
  lead_id: leadId,
  channel,
  phone,

  service_interest: serviceInterest,
  vehicle_type: vehicleType,
  district,

  address: normalizedAddress,
  service_address: normalizedAddress,
  address_reference: addressReference,
  address_confirmed: true,

  booking_date: bookingDate,
  booking_time: bookingTime,
  slot_id: slotId,
  availability_confirmed: availabilityConfirmed,
  duration_minutes: durationMinutes,
  calendar_id: calendarId,

  message_to_send:
    bookingDate && bookingTime
      ? (`Perfecto, dejo registrada la direccion: ${normalizedAddress}` +
        `${addressReference ? `, referencia: ${addressReference}` : ""}. ` +
        `Quieres que confirme la reserva ahora para el ${(function(d) { try { const dt = new Date(d+"T12:00:00"); return dt.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Santiago" }); } catch(e) { return d; } })(bookingDate)} a las ${bookingTime}?`)
      : (`Perfecto, dejo registrada la direccion: ${normalizedAddress}` +
        `${addressReference ? `, referencia: ${addressReference}` : ""}. ` +
        `Ahora necesito que elijas un horario disponible para continuar.`),

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...stateUpdateInput,

    stage: bookingDate && bookingTime ? "booking_selection" : "booking_selection",
    next_goal: bookingDate && bookingTime ? "confirm_booking" : "send_available_slots",
    last_bot_action: bookingDate && bookingTime ? "confirm_address" : "offer_available_slots_in_progress",
    missing_fields: [],

    service_address: normalizedAddress,
    address_reference: addressReference,
    address_confirmed: true,
    address_confirmed_at: new Date().toISOString(),

    district,
    service_interest: serviceInterest,
    vehicle_type: vehicleType,

    booking_date: bookingDate,
    booking_time: bookingTime,
    slot_id: slotId,
    availability_confirmed: availabilityConfirmed,
    duration_minutes: durationMinutes,
    calendar_id: calendarId
  },

  execution_context: {
    ...executionContext,
    lead_id: leadId,
    channel,
    phone,
    action: "confirm_address",

    address: normalizedAddress,
    service_address: normalizedAddress,
    address_reference: addressReference,
    address_confirmed: true,

    district,
    service_interest: serviceInterest,
    vehicle_type: vehicleType,

    booking_date: bookingDate,
    booking_time: bookingTime,
    slot_id: slotId,
    availability_confirmed: availabilityConfirmed,
    duration_minutes: durationMinutes,
    calendar_id: calendarId
  },

  context_packet: contextPacket,
  decision,
  execution_meta: executionMeta,

  execution_result: {
    success: true,
    action: "confirm_address",
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: ["address_confirmed_and_booking_context_preserved"]
  },

  notes: ["address_confirmed_and_booking_context_preserved"]
}];
