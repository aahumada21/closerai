// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        build_reschedule_no_active_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  message_to_send:
    "No encontre una reserva activa para reprogramar. Si quieres, puedo ayudarte a agendar una nueva.",
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    last_bot_action: "reschedule_no_active_appointment",
    next_goal: "offer_booking",
    missing_fields: []
  },
  notes: [
    ...($json.notes || []),
    "reschedule_blocked_no_active_appointment"
  ]
}];
