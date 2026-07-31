// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
// Nodo:        build_cancel_booking_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const eventId = $json.event_id || $json.appointment?.event_id || null;
const hasOfferedSlots = !!$json.combined_cancel_message;
const defaultMsg =
  "Listo, deje cancelada tu reserva. Si mas adelante quieres reagendar, me escribes y revisamos un nuevo horario.";
const msg = $json.combined_cancel_message || defaultMsg;

return [
  {
    json: {
      ...$json,
      success: true,
      action: "cancel_booking",
      outcome: "active_appointment_found",
      active_appointment_found: true,

      message_to_send: msg,

      db_operations: ["appointments", "followups", "messages", "lead_state"],

      state_update: hasOfferedSlots
        ? {
            ...($json.state_update || {}),
            cancellation_reason:
              $json.execution_context?.cancellation_reason || "cancelled_by_client",
            last_appointment_event_id: eventId
          }
        : {
            ...($json.state_update || {}),
            stage: "cancelled",
            next_goal: "reactivate_later",
            last_bot_action: "cancel_booking",
            cancellation_reason:
              $json.execution_context?.cancellation_reason || "cancelled_by_client",
            last_appointment_event_id: eventId,
            missing_fields: []
          },

      execution_result: {
        success: true,
        action: "cancel_booking",
        outcome: "active_appointment_found",
        bot: msg,
        message_sent: false,
        state_updated: true,
        db_records_created: ["appointments", "followups", "messages", "lead_state"],
        notes: [
          "booking_cancelled",
          eventId ? `event_id:${eventId}` : "event_id_missing"
        ]
      },

      notes: [...($json.notes || []), "booking_cancelled"]
    }
  }
];
