// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        mark_outbound_saved
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const insertedMessage = $("insert_message").first().json || {};

return [{
  ...$json,
  outbound_message_id: insertedMessage.id || null,
  outbound_message_saved: !!insertedMessage.id,
  message_saved: !!insertedMessage.id,
  records: [
    ...($json.records || []),
    "messages"
  ]
}];
