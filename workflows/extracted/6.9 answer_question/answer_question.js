// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.9 answer_question  (workflow id efe50346-2d38-4d11-8cd0-3694db16a8e3)
// Nodo:        answer_question
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  message_to_send: $json.execution_context.message,
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.execution_context.state_update || {}),
    last_bot_action: "answer_question",
    missing_fields: Array.isArray($json.execution_context.state_update?.missing_fields)
      ? $json.execution_context.state_update.missing_fields
      : []
  }
}];
