// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.23 offer_available_slots  (workflow id 135d7590-2dab-4032-a3c8-ba36a0ef33d7)
// Nodo:        build_available_slots_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $json.execution_context || {};

const slots =
  Array.isArray($json.slots) ? $json.slots :
  Array.isArray($json.available_slots) ? $json.available_slots :
  Array.isArray($json.booking_options) ? $json.booking_options :
  [];

function serviceLabel(service) {
  const map = {
    lavado_basico: "lavado basico",
    lavado_premium: "lavado premium",
    encerado_full: "encerado full",

    lavado_profundo: "lavado premium",
    lavado_esencial: "lavado basico",
  };

  return map[service] || "el servicio";
}

function formatSlot(slot) {
  const rawStart =
    slot.slot_start_at ||
    slot.start_at ||
    slot.start ||
    slot.datetime ||
    null;

  if (!rawStart) {
    return slot.label || "horario disponible";
  }

  const start = new Date(rawStart);

  const fecha = start.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });

  const hora = start.toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return `${fecha} a las ${hora}`;
}

function labelFromWindow(window) {
  switch (window) {
    case "next_day":
      return "el proximo dia";
    case "next_week":
      return "la proxima semana";
    case "next_14_days":
      return "las proximas dos semanas";
    case "next_30_days":
      return "las proximas semanas";
    case "this_week":
    default:
      return "los proximos dias";
  }
}

function hasEncodingNoise(value) {
  const text = String(value || "");
  return /prxim/i.test(text) || /[^\x00-\x7F]/.test(text);
}

function cleanLabel(value, window) {
  const fallback = labelFromWindow(window);
  const label = String(value || "").trim();
  if (!label || hasEncodingNoise(label)) return fallback;
  return label.replace(/\s+/g, " ").trim();
}

const availabilityWindow =
  $json.availability_window ||
  ctx.availability_window ||
  "this_week";
const availabilityLabel = cleanLabel(
  $json.availability_label ||
  ctx.availability_label ||
  labelFromWindow(availabilityWindow),
  availabilityWindow
);

const service =
  ctx.service_interest ||
  $json.service_interest ||
  "lavado_premium";

if (slots.length === 0) {
  const noSlotsMessage =
    `Por ahora no encontre horarios disponibles para ${availabilityLabel}. ` +
    `Si quieres, te puedo derivar para revisar manualmente una hora.`;

  return [{
    ...$json,
    message_to_send: noSlotsMessage,
    message: noSlotsMessage,
    db_operations: ["messages", "lead_state"],
    state_update: {
      ...($json.state_update || {}),
      stage: "booking_selection",
      intent_last: "availability_requested",
      next_goal: "manual_availability_review",
      last_bot_action: "no_available_slots_found",
      missing_fields: [],
      booking_options: [],
      availability_window: availabilityWindow,
      availability_label: availabilityLabel
    },
    notes: [
      ...($json.notes || []),
      "no_available_slots_found"
    ]
  }];
}

const lines = slots.map((slot, index) => {
  return `${index + 1}. ${formatSlot(slot)}`;
});

const optionNumbers =
  slots.length === 1
    ? "1"
    : slots.length === 2
      ? "1 o 2"
      : `${slots.slice(0, -1).map((_, index) => index + 1).join(", ")} o ${slots.length}`;

const wasSpecificSlotUnavailable =
  $json.unavailable_specific_slot === true ||
  $json.state_update?.intent_last === "manual_slot_unavailable";

const isPrepago = (ctx.payment_preference || $json.state_update?.payment_preference) === "prepago";
const isPostpago = (ctx.payment_preference || $json.state_update?.payment_preference) === "postpago";
const prepagoNote = isPrepago
  ? "Perfecto! Al confirmar tu turno te mando el link de pago por Flow.\n\n"
  : isPostpago
    ? "Perfecto! Queda anotado pago al terminar (efectivo o transferencia).\n\n"
    : "";

const intro = wasSpecificSlotUnavailable
  ? `Ese horario no aparece disponible. Tengo estas opciones cercanas para ${serviceLabel(service)}:\n\n`
  : `${prepagoNote}Tengo estos horarios disponibles para ${serviceLabel(service)} durante ${availabilityLabel}:\n\n`;

const finalMessage =
  intro +
  `${lines.join("\n")}\n\n` +
  `Cual te acomoda? Puedes responder con ${optionNumbers}.`;

return [{
  ...$json,
  message_to_send: finalMessage,
  message: finalMessage,
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "booking_selection",
    intent_last: "availability_options_sent",
    next_goal: "collect_selected_slot",
    last_bot_action: "offer_available_slots",
    missing_fields: [],
    booking_options: slots,
    availability_window: availabilityWindow,
    availability_label: availabilityLabel
  },
  notes: [
    ...($json.notes || []),
    "available_slots_sent"
  ]
}];
