// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        merge_resolved_audit_channel
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("persist_results").first().json;
const row = $json || {};

return [{
  json: {
    ...original,
    resolved_outbound_phone_number_id: row.external_channel_id || null
  }
}];
