// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.23 offer_available_slots  (workflow id 135d7590-2dab-4032-a3c8-ba36a0ef33d7)
// Nodo:        build_specific_slot_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const upstream = $("offer_available_slots").first().json;
const ctx = upstream.execution_context || {};
const req = upstream.availability_request || {};

const available =
  $json.available === true ||
  $json.is_available === true ||
  $json.slot_available === true;

const bookingDate =
  $json.booking_date ||
  req.booking_date ||
  ctx.booking_date ||
  null;

const bookingTime =
  $json.booking_time ||
  req.booking_time ||
  ctx.booking_time ||
  null;

const slotId =
  $json.slot_id ||
  req.slot_id ||
  ctx.slot_id ||
  (
    bookingDate && bookingTime
      ? `${bookingDate}_${bookingTime}`
      : null
  );

function formatManualSlot(date, time) {
  if (!date || !time) return "ese horario";

  const start = new Date(`${date}T${time}:00`);

  if (isNaN(start.getTime())) {
    return `${date} a las ${time}`;
  }

  const fecha = start.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });

  return `${fecha} a las ${time}`;
}

const formattedSlot = formatManualSlot(bookingDate, bookingTime);

if (available) {
  const message =
    `Perfecto, ${formattedSlot} esta disponible. ` +
    `Para dejarlo reservado, me compartes la direccion exacta donde seria el servicio?`;

  return [{
    ...upstream,
    ...$json,

    execution_context: ctx,
    availability_request: req,

    message_to_send: message,
    message,

    db_operations: ["messages", "lead_state"],

    state_update: {
      ...($json.state_update || {}),

      stage: "collecting_address",
      intent_last: "manual_slot_available_address_required",
      next_goal: "collect_address",
      last_bot_action: "collect_address",

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,

      availability_confirmed: true,

      booking_options: [],
      missing_fields: ["address"]
    },

    notes: [
      ...($json.notes || []),
      "specific_slot_available_address_requested"
    ]
  }];
}

return [{
  ...upstream,
  ...$json,

  execution_context: ctx,
  availability_request: req,

  unavailable_specific_slot: true,

  state_update: {
    ...($json.state_update || {}),

    stage: "booking_selection",
    intent_last: "manual_slot_unavailable",
    next_goal: "show_nearby_available_slots",
    last_bot_action: "manual_slot_unavailable",

    booking_date: bookingDate,
    booking_time: bookingTime,
    slot_id: slotId,

    availability_confirmed: false,

    availability_label: "opciones cercanas",
    availability_window: "this_week",

    missing_fields: []
  },

  notes: [
    ...($json.notes || []),
    "specific_slot_unavailable"
  ]
}];
