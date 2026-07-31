// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        normalize_confirm_booking_input
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

const input = parseMaybeJson($json.payload, $json);

const ctx = input.execution_context || {};
const state = input.context_packet?.state || {};
const lead = input.context_packet?.lead || {};
const decisionStateUpdate = input.decision?.state_update || {};
const stateUpdate = ctx.state_update || input.state_update || decisionStateUpdate || {};

const leadId = firstValue(
  ctx.lead_id,
  lead.id,
  state.lead_id,
  input.lead_id
);

const channel = firstValue(
  ctx.channel,
  lead.channel,
  input.channel,
  "whatsapp"
);

const phone = firstValue(
  ctx.phone,
  lead.phone,
  input.phone
);

const bookingDate = firstValue(
  ctx.booking_date,
  decisionStateUpdate.booking_date,
  state.booking_date,
  input.booking_date
);

const bookingTime = firstValue(
  ctx.booking_time,
  decisionStateUpdate.booking_time,
  state.booking_time,
  input.booking_time
);

const slotId = firstValue(
  ctx.slot_id,
  decisionStateUpdate.slot_id,
  state.slot_id,
  bookingDate && bookingTime ? `${bookingDate}_${bookingTime}` : null
);

const serviceAddress = firstValue(
  ctx.service_address,
  ctx.address,
  decisionStateUpdate.service_address,
  decisionStateUpdate.address,
  state.service_address,
  state.address
);

const addressReference = firstValue(
  ctx.address_reference,
  decisionStateUpdate.address_reference,
  state.address_reference
);

const addressConfirmed =
  ctx.address_confirmed === true ||
  decisionStateUpdate.address_confirmed === true ||
  state.address_confirmed === true;

if (!leadId) {
  throw new Error("Missing execution_context.lead_id");
}

if (!channel) {
  throw new Error("Missing execution_context.channel");
}

if (!bookingDate) {
  throw new Error("Missing execution_context.booking_date");
}

if (!bookingTime) {
  throw new Error("Missing execution_context.booking_time");
}

const normalizedExecutionContext = {
  ...ctx,
  lead_id: leadId,
  phone,
  channel,
  action: "confirm_booking",

  service_interest: firstValue(ctx.service_interest, state.service_interest),
  vehicle_type: firstValue(ctx.vehicle_type, state.vehicle_type),
  district: firstValue(ctx.district, state.district),

  booking_date: bookingDate,
  booking_time: bookingTime,
  slot_id: slotId,
  availability_confirmed:
    ctx.availability_confirmed ??
    decisionStateUpdate.availability_confirmed ??
    state.availability_confirmed ??
    true,

  duration_minutes: Number(ctx.duration_minutes || state.duration_minutes || 120),
  calendar_id: firstValue(ctx.calendar_id, state.calendar_id, "primary"),

  service_address: serviceAddress,
  address: serviceAddress,
  address_reference: addressReference,
  address_confirmed: addressConfirmed,

  state_update: stateUpdate
};

return [{
  ...input,

  execution_context: normalizedExecutionContext,

  db_operations: ["appointments", "messages", "lead_state"],

  booking_request: {
    lead_id: leadId,
    channel,
    service_interest: normalizedExecutionContext.service_interest,
    vehicle_type: normalizedExecutionContext.vehicle_type,
    district: normalizedExecutionContext.district,
    booking_date: bookingDate,
    booking_time: bookingTime,
    slot_id: slotId,
    availability_confirmed: normalizedExecutionContext.availability_confirmed,
    duration_minutes: normalizedExecutionContext.duration_minutes,
    calendar_id: normalizedExecutionContext.calendar_id,
    service_address: serviceAddress,
    address_reference: addressReference,
    address_confirmed: addressConfirmed
  },

  state_update: {
    ...stateUpdate,
    last_bot_action: "confirm_booking_in_progress"
  }
}];
