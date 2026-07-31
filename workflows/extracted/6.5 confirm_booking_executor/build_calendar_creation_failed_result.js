// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_calendar_creation_failed_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  message_to_send: "No pude confirmar la reserva en este momento. Si quieres, lo reviso nuevamente o te propongo otro horario.",
  db_operations: ["messages"],
  state_update: {
    ...($json.state_update || {}),
    last_bot_action: "calendar_creation_failed",
    next_goal: "retry_booking_or_handoff"
  },
  notes: ["calendar_creation_failed"]
}];
