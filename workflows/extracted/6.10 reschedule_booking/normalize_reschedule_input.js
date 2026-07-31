// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        normalize_reschedule_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

const executionContext = input.execution_context || {};
const contextPacket = input.context_packet || {};
const state = contextPacket.state || {};
const stateUpdate = input.state_update || executionContext.state_update || {};
const decision = input.decision || {};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
}

function hasExplicitStateField(key) {
  return Object.prototype.hasOwnProperty.call(stateUpdate, key);
}

const hasExplicitNewSlot = (
  hasExplicitStateField("booking_date")
    ? !!(stateUpdate.booking_date && String(stateUpdate.booking_date).trim())
    : !!firstValue(input.booking_date)
) && (
  hasExplicitStateField("booking_time")
    ? !!(stateUpdate.booking_time && String(stateUpdate.booking_time).trim())
    : !!firstValue(input.booking_time)
);

const genericRescheduleRequest =
  decision.reason === "user_requested_reschedule" ||
  stateUpdate.next_goal === "collect_new_slot" ||
  stateUpdate.intent_last === "reschedule_booking_requested";

const shouldListNewSlots = genericRescheduleRequest && !hasExplicitNewSlot;

const leadId =
  input.lead_id ||
  executionContext.lead_id ||
  contextPacket.lead?.id ||
  null;

const phone =
  input.phone ||
  executionContext.phone ||
  contextPacket.lead?.phone ||
  null;

const channel =
  input.channel ||
  executionContext.channel ||
  contextPacket.lead?.channel ||
  "whatsapp";

if (!leadId) {
  throw new Error("Missing lead_id in reschedule_booking");
}

return [{
  ...input,

  lead_id: leadId,
  phone,
  channel,

  calendar_id:
    input.calendar_id ||
    executionContext.calendar_id ||
    state.calendar_id ||
    "0806113eec0244bd64e4ef9658d05e6238f5e9e90c33621efb2fbb52150ee3eb@group.calendar.google.com",

  agent_id:
    input.agent_id ||
    executionContext.agent_id ||
    null,

  booking_date: shouldListNewSlots
    ? null
    : firstValue(input.booking_date, stateUpdate.booking_date, executionContext.booking_date, state.booking_date),

  booking_time: shouldListNewSlots
    ? null
    : firstValue(input.booking_time, stateUpdate.booking_time, executionContext.booking_time, state.booking_time),

  slot_id: shouldListNewSlots
    ? null
    : firstValue(input.slot_id, stateUpdate.slot_id, executionContext.slot_id, state.slot_id),

  duration_minutes: Number(
    input.duration_minutes ||
    executionContext.duration_minutes ||
    state.duration_minutes ||
    120
  ),

  service_interest:
    input.service_interest ||
    executionContext.service_interest ||
    state.service_interest ||
    null,

  vehicle_type:
    input.vehicle_type ||
    executionContext.vehicle_type ||
    state.vehicle_type ||
    null,

  district:
    input.district ||
    executionContext.district ||
    state.district ||
    null,

  availability_window:
    input.availability_window ||
    executionContext.availability_window ||
    state.availability_window ||
    "this_week",

  availability_label:
    input.availability_label ||
    stateUpdate.availability_label ||
    executionContext.availability_label ||
    state.availability_label ||
    "los proximos dias",

  days_ahead: Number(
    input.days_ahead ||
    executionContext.days_ahead ||
    state.days_ahead ||
    7
  ),

  start_offset_days: Number(
    input.start_offset_days ||
    executionContext.start_offset_days ||
    state.start_offset_days ||
    0
  ),

  max_slots: Number(
    input.max_slots ||
    executionContext.max_slots ||
    state.max_slots ||
    3
  ),

  reschedule_reason:
    input.reschedule_reason ||
    executionContext.reschedule_reason ||
    input.decision?.reason ||
    "user_requested_reschedule",

  execution_context: {
    ...executionContext,
    lead_id: leadId,
    phone,
    channel,
    action: "reschedule_booking"
  },

  context_packet: contextPacket,
  state_update: {
    ...stateUpdate,
    booking_date: shouldListNewSlots ? null : stateUpdate.booking_date,
    booking_time: shouldListNewSlots ? null : stateUpdate.booking_time,
    slot_id: shouldListNewSlots ? null : stateUpdate.slot_id,
    availability_confirmed: shouldListNewSlots ? false : stateUpdate.availability_confirmed,
    next_goal: shouldListNewSlots ? "collect_selected_slot" : stateUpdate.next_goal,
    last_bot_action: shouldListNewSlots ? "reschedule_booking_in_progress" : stateUpdate.last_bot_action
  },
  decision: input.decision || {},
  execution_meta: input.execution_meta || {},

  notes: [
    ...(input.notes || []),
    "reschedule_input_normalized"
  ]
}];
