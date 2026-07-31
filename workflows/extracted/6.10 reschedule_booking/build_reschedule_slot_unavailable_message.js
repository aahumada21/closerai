// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        build_reschedule_slot_unavailable_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  message_to_send:
    "Ese horario ya no esta disponible. Te puedo proponer otro horario para reprogramar.",
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "reschedule",
    next_goal: "collect_new_slot",
    last_bot_action: "reschedule_slot_unavailable",
    availability_confirmed: false,
    missing_fields: []
  },
  notes: [
    ...($json.notes || []),
    "reschedule_slot_unavailable"
  ]
}];
