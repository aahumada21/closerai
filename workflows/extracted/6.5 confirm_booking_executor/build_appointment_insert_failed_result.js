// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_appointment_insert_failed_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  message_to_send: "La reserva en agenda se cre, pero hubo un problema al registrarla internamente. Lo revisar antes de continuar.",
  db_operations: ["messages"],
  state_update: {
    ...($json.state_update || {}),
    last_bot_action: "appointment_insert_failed",
    next_goal: "manual_review_booking"
  },
  notes: ["appointment_insert_failed"]
}];
