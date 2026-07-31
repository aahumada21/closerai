// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.20 offer_booking  (workflow id 1b5873b4-fe9b-4a9e-b207-1ee23790b51c)
// Nodo:        offer_booking
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  message_to_send: $json.execution_context.message,
  db_operations: ["messages"],
  state_update: {
    ...$json.execution_context.state_update,
    stage: "closing",
    next_goal: "book_appointment",
    last_bot_action: "offer_booking"
  }
}];
