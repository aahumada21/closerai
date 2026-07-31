// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_booking_already_in_progress
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;
return [{
  ...input,
  message_to_send: "Tu reserva ya quedo registrada. Te escribire antes de la visita con los detalles.",
  db_operations: ["messages"],
  state_update: {
    ...(input.state_update || {}),
    last_bot_action: "confirm_booking",
    next_goal: "service_prepared"
  },
  notes: [...(input.notes || []), "booking_lock_not_acquired_already_confirmed"]
}];
