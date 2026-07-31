// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        build_reschedule_slots_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = (() => {
  try {
    return $("normalize_reschedule_input").first().json;
  } catch {
    return {};
  }
})();

const slots = Array.isArray($json.slots) ? $json.slots : [];
const availabilityLabel =
  original.availability_label ||
  $json.availability_label ||
  "los proximos dias";

function formatSlot(slot) {
  const start = new Date(slot.slot_start_at);

  const fecha = start.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "2-digit",
    month: "long"
  });

  const hora = start.toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit"
  });

  return fecha + " a las " + hora;
}

function buildCommonPayload(message, stateUpdate, extraNotes) {
  const decision = {
    ...(original.decision || {}),
    action: "reschedule_booking",
    reason: stateUpdate.last_bot_action || "reschedule_slots_offered",
    source: "reschedule_booking",
    rule_name: "reschedule_booking_slots",
    confidence: 1,
    message,
    state_update: stateUpdate,
    requires_message_builder: false
  };

  return {
    ...original,
    ...$json,
    message_to_send: message,
    message,
    db_operations: ["messages", "lead_state"],
    action: "reschedule_booking",
    outcome: stateUpdate.last_bot_action,
    decision,
    state_update: stateUpdate,
    execution_context: {
      ...(original.execution_context || {}),
      action: "reschedule_booking",
      state_update: stateUpdate,
      idempotency_key: null,
      inbound_message_id: null
    },
    idempotency_key: null,
    inbound_message_id: null,
    execution_result: {
      success: true,
      action: "reschedule_booking",
      outcome: stateUpdate.last_bot_action,
      bot: message,
      message_sent: false,
      state_updated: false,
      db_records_created: []
    },
    notes: [
      ...(original.notes || []),
      ...($json.notes || []),
      ...extraNotes
    ]
  };
}

if (slots.length === 0) {
  const stateUpdate = {
    ...(original.state_update || {}),
    stage: "reschedule",
    intent_last: "reschedule_no_available_slots",
    next_goal: "manual_availability_review",
    last_bot_action: "reschedule_no_slots_found",
    missing_fields: [],
    booking_options: []
  };

  const message =
    "Claro, podemos reprogramar, pero por ahora no encontre horarios disponibles para " +
    availabilityLabel +
    ". Te puedo ayudar a revisar otra alternativa.";

  return [buildCommonPayload(message, stateUpdate, ["reschedule_no_available_slots"])]
}

const lines = slots.map((slot, index) => String(index + 1) + ". " + formatSlot(slot));
const optionNumbers = slots.map((_, index) => index + 1).join(", ");

const stateUpdate = {
  ...(original.state_update || {}),
  stage: "reschedule",
  intent_last: "reschedule_requested",
  next_goal: "collect_selected_slot",
  last_bot_action: "offer_reschedule_slots",
  missing_fields: [],
  booking_date: null,
  booking_time: null,
  slot_id: null,
  availability_confirmed: false,
  booking_options: slots,
  availability_window: original.availability_window || $json.availability_window || "this_week",
  availability_label: availabilityLabel
};

const message =
  "Claro, podemos reprogramar. Tengo estos horarios disponibles para " +
  availabilityLabel +
  ":\n\n" +
  lines.join("\n") +
  "\n\n" +
  "Cual te acomoda? Puedes responder con " + optionNumbers + ".";

return [buildCommonPayload(message, stateUpdate, ["reschedule_slots_sent"])]
