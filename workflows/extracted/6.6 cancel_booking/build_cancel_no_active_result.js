// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
// Nodo:        build_cancel_no_active_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const msg = "No encontre una reserva activa a tu nombre. Si quieres, puedo ayudarte a agendar una nueva.";

return [
  {
    json: {
      ...$json,
      success: true,
      action: "cancel_booking",
      outcome: "no_active_appointment",
      active_appointment_found: false,
      appointment: null,
      message_to_send: msg,
      db_operations: ["messages", "lead_state"],
      state_update: {
        ...($json.state_update || {}),
        last_bot_action: "cancel_booking_no_active_appointment",
        next_goal: "offer_booking",
        missing_fields: []
      },
      execution_result: {
        success: true,
        action: "cancel_booking",
        outcome: "no_active_appointment",
        bot: msg,
        message_sent: false,
        state_updated: true,
        db_records_created: ["messages", "lead_state"],
        notes: ["cancel_booking_no_active_appointment"]
      },
      notes: [...($json.notes || []), "cancel_booking_no_active_appointment"]
    }
  }
];
