// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        normalize_reschedule_booking_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = (() => {
  try {
    return $("reschedule_booking").first().json;
  } catch {
    return {};
  }
})();

const mergedExecutionContext = {
  ...(original.execution_context || {}),
  ...($json.execution_context || {})
};

const data = {
  ...original,
  ...$json,
  execution_context: mergedExecutionContext,
  context_packet: $json.context_packet || original.context_packet || {},
  decision: $json.decision || original.decision || {}
};

const hasMessage = !!String(data.message_to_send || data.message || "").trim();
const hasBookingOptions = Array.isArray(data.state_update?.booking_options) && data.state_update.booking_options.length > 0;
const isSlotListResponse = hasMessage && hasBookingOptions;
const isSlotUnavailable = data.state_update?.last_bot_action === "reschedule_slot_unavailable";
const isNoActive = data.state_update?.last_bot_action === "reschedule_no_active_appointment";
const isSuccess = data.state_update?.last_bot_action === "reschedule_booking";

const outcome =
  isSlotListResponse ? "reschedule_slots_offered" :
  isSlotUnavailable ? "reschedule_slot_unavailable" :
  isNoActive ? "no_active_appointment" :
  isSuccess ? "reschedule_confirmed" :
  data.outcome ||
  data.execution_result?.outcome ||
  data.result?.outcome ||
  "reschedule_processed";

const finalMessage =
  data.message_to_send ||
  data.message ||
  (
    outcome === "no_active_appointment"
      ? "Revise y no encontre una reserva activa asociada a este numero. Si quieres, puedo ayudarte a agendar una nueva hora."
      : "Perfecto, te ayudo a reprogramar tu reserva. Te mostrare los horarios disponibles."
  );

const preservedStateUpdate = data.state_update || {};
const finalStateUpdate = {
  ...preservedStateUpdate,
  stage: preservedStateUpdate.stage || "reschedule",
  intent_last:
    preservedStateUpdate.intent_last ||
    (isSlotListResponse ? "reschedule_requested" : outcome),
  next_goal:
    preservedStateUpdate.next_goal ||
    (isNoActive ? "book_appointment" : isSlotListResponse ? "collect_selected_slot" : "show_available_slots"),
  last_bot_action:
    preservedStateUpdate.last_bot_action ||
    (isSlotListResponse ? "offer_reschedule_slots" : isNoActive ? "reschedule_no_active_appointment" : "reschedule_booking"),
  missing_fields: Array.isArray(preservedStateUpdate.missing_fields)
    ? preservedStateUpdate.missing_fields
    : []
};

const finalDecision = data.decision?.action
  ? {
      ...data.decision,
      state_update: {
        ...(data.decision.state_update || {}),
        ...finalStateUpdate
      }
    }
  : {
      action: "reschedule_booking",
      reason: outcome,
      source: "reschedule_booking",
      message: finalMessage,
      rule_name: "reschedule_booking_result",
      confidence: 1,
      state_update: finalStateUpdate,
      requires_message_builder: false
    };

return [{
  ...data,

  action: "reschedule_booking",
  outcome,

  message_to_send: finalMessage,
  message: finalMessage,

  db_operations: ["messages", "lead_state"],

  state_update: finalStateUpdate,
  decision: finalDecision,

  execution_context: {
    ...mergedExecutionContext,
    action: "reschedule_booking",
    state_update: finalStateUpdate,
    idempotency_key: null,
    inbound_message_id: null
  },
  idempotency_key: null,
  inbound_message_id: null,

  execution_result: {
    ...(data.execution_result || {}),
    success: true,
    action: "reschedule_booking",
    outcome,
    bot: finalMessage,
    message_sent: false,
    state_updated: false,
    db_records_created: []
  },

  notes: [
    ...(data.notes || []),
    `reschedule_booking_outcome_${outcome}`
  ]
}];
