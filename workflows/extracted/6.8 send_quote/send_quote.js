// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.8 send_quote  (workflow id 48860882-12ae-40c1-be93-c9778cade549)
// Nodo:        send_quote
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [
  {
    ...$json,
    db_operations: ["messages", "offers_or_quotes"],

    state_update: {
      ...($json.execution_context.state_update || {}),
      missing_fields: []
    },

    internal_status: "send_quote_in_progress"
  }
];
