// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.7 ask_missing_data  (workflow id 6c5dad2d-492a-4ce1-966f-e36147b43100)
// Nodo:        ask_missing_data
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const validationMissing = Array.isArray($json.validation?.missing_fields)
  ? $json.validation.missing_fields
  : [];

const decisionMissing = Array.isArray($json.execution_context?.state_update?.missing_fields)
  ? $json.execution_context.state_update.missing_fields
  : [];

const fallbackMissing = Array.isArray($json.state_update?.missing_fields)
  ? $json.state_update.missing_fields
  : [];

const missingFields =
  validationMissing.length > 0
    ? validationMissing
    : decisionMissing.length > 0
      ? decisionMissing
      : fallbackMissing;

return [
  {
    ...$json,
    message_to_send: $json.execution_context.message,
    db_operations: ["messages", "lead_state"],
    state_update: {
      ...($json.execution_context.state_update || {}),
      missing_fields: missingFields,
      last_bot_action: "ask_missing_data",
    },
  },
];
