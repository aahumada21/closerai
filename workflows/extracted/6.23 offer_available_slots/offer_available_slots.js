// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.23 offer_available_slots  (workflow id 135d7590-2dab-4032-a3c8-ba36a0ef33d7)
// Nodo:        offer_available_slots
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $json.execution_context || {};
const stateUpdate = ctx.state_update || {};

function getAvailabilityConfig(window) {
  switch (window) {
    case "this_week":
      return {
        days_ahead: 7,
        start_offset_days: 0,
        availability_label: "los proximos dias",
        max_slots: 3
      };

    case "next_week":
      return {
        days_ahead: 7,
        start_offset_days: 7,
        availability_label: "la proxima semana",
        max_slots: 5
      };

    case "next_14_days":
      return {
        days_ahead: 14,
        start_offset_days: 0,
        availability_label: "las proximas dos semanas",
        max_slots: 6
      };

    case "next_30_days":
      return {
        days_ahead: 30,
        start_offset_days: 0,
        availability_label: "las proximas semanas",
        max_slots: 8
      };

    default:
      return {
        days_ahead: 7,
        start_offset_days: 0,
        availability_label: "los proximos dias",
        max_slots: 3
      };
  }
}

const bookingDate = ctx.booking_date || stateUpdate.booking_date || null;
const bookingTime = ctx.booking_time || stateUpdate.booking_time || null;
const slotId = ctx.slot_id || stateUpdate.slot_id || (
  bookingDate && bookingTime ? `${bookingDate}_${bookingTime}` : null
);

const isSpecificSlotCheck =
  ctx.next_goal === "check_specific_slot_availability" ||
  stateUpdate.next_goal === "check_specific_slot_availability" ||
  (
    !!bookingDate &&
    !!bookingTime &&
    ctx.availability_confirmed !== true &&
    stateUpdate.availability_confirmed !== true
  );

const config = getAvailabilityConfig(ctx.availability_window || stateUpdate.availability_window || "this_week");

return [{
  ...$json,
  db_operations: ["messages", "lead_state"],

  availability_request: {
    lead_id: ctx.lead_id,
    service_interest: ctx.service_interest,
    vehicle_type: ctx.vehicle_type,
    district: ctx.district,
    duration_minutes: ctx.duration_minutes || 120,
    calendar_id: ctx.calendar_id || "primary",
    agent_id: ctx.agent_id || null,
    staff_id: ctx.staff_id || null,
    schedule: Array.isArray(ctx.schedule) ? ctx.schedule : [],

    check_type: isSpecificSlotCheck ? "specific_slot" : "list_slots",

    booking_date: bookingDate,
    booking_time: bookingTime,
    slot_id: slotId,

    availability_window: ctx.availability_window || stateUpdate.availability_window || "this_week",
    availability_label: ctx.availability_label || stateUpdate.availability_label || config.availability_label,

    days_ahead: Number(ctx.days_ahead || stateUpdate.days_ahead || config.days_ahead),
    start_offset_days: Number(ctx.start_offset_days || stateUpdate.start_offset_days || config.start_offset_days),
    max_slots: Number(ctx.max_slots || stateUpdate.max_slots || config.max_slots)
  },

  state_update: {
    ...(ctx.state_update || {}),

    stage: "booking_selection",
    intent_last: isSpecificSlotCheck ? "manual_slot_requested" : "availability_requested",
    next_goal: isSpecificSlotCheck ? "check_specific_slot_availability" : "show_available_slots",
    last_bot_action: "offer_available_slots_in_progress",

    booking_date: bookingDate,
    booking_time: bookingTime,
    slot_id: slotId,
    availability_confirmed: false,

    availability_window: ctx.availability_window || stateUpdate.availability_window || "this_week",
    availability_label: ctx.availability_label || stateUpdate.availability_label || config.availability_label,

    missing_fields: []
  }
}];
