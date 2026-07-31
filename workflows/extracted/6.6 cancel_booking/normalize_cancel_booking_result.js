// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
// Nodo:        normalize_cancel_booking_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = (() => {
  try {
    return $("cancel_booking").first().json;
  } catch {
    return {};
  }
})();

const { error: _discardedError, ...$jsonSafe } = $json;
const data = {
  ...original,
  ...$jsonSafe,
  execution_context: {
    ...(original.execution_context || {}),
    ...($json.execution_context || {})
  },
  context_packet: $json.context_packet || original.context_packet || {},
  decision: $json.decision || original.decision || {}
};

const outcome =
  data.outcome ||
  data.execution_result?.outcome ||
  data.result?.outcome ||
  (
    data.active_appointment_found === false ||
    data.active_appointment === null ||
    data.appointment === null
      ? "no_active_appointment"
      : "active_appointment_found"
  );

const finalMessage =
  data.message_to_send ||
  data.message ||
  (
    outcome === "no_active_appointment"
      ? "Revise y no encontre una reserva activa asociada a este numero. Si quieres, te puedo ayudar a agendar una nueva hora."
      : "Listo, deje cancelada tu reserva. Si mas adelante quieres reagendar, te puedo ayudar por aqui."
  );

return [{
  ...data,

  action: "cancel_booking",
  outcome,

  message_to_send: finalMessage,
  message: finalMessage,

  db_operations: ["messages", "lead_state"],

  state_update: data.combined_cancel_message
    ? {
        ...(data.state_update || {}),
        missing_fields: Array.isArray(data.state_update?.missing_fields)
          ? data.state_update.missing_fields
          : []
      }
    : {
        ...(data.state_update || {}),
        stage: outcome === "active_appointment_found"
          ? "qualified"
          : data.context_packet?.state?.stage,
        intent_last: outcome,
        next_goal: outcome === "no_active_appointment"
          ? "clarify_or_book"
          : "reactivation",
        last_bot_action: outcome === "no_active_appointment"
          ? "cancel_no_active_appointment"
          : "cancel_booking",
        // Limpiar el horario cancelado: si no, un "ok"/"si" suelto despues
        // puede ser malinterpretado como confirmar esa misma reserva de nuevo.
        booking_date: outcome === "active_appointment_found" ? null : data.state_update?.booking_date,
        booking_time: outcome === "active_appointment_found" ? null : data.state_update?.booking_time,
        slot_id: outcome === "active_appointment_found" ? null : data.state_update?.slot_id,
        availability_confirmed: outcome === "active_appointment_found" ? false : data.state_update?.availability_confirmed,
        booking_options: outcome === "active_appointment_found" ? [] : data.state_update?.booking_options,
        fields_to_clear: outcome === "active_appointment_found"
          ? ["booking_date", "booking_time", "slot_id", "booking_options", "availability_confirmed"]
          : (Array.isArray(data.state_update?.fields_to_clear) ? data.state_update.fields_to_clear : []),
        missing_fields: []
      },

  execution_result: {
    ...(data.execution_result || {}),
    success: true,
    action: "cancel_booking",
    outcome,
    bot: finalMessage
  },

  notes: [
    ...(data.notes || []),
    `cancel_booking_outcome_${outcome}`
  ]
}];
