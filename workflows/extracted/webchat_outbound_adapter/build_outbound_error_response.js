// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: webchat_outbound_adapter  (workflow id FQ876D7itp35JrSt)
// Nodo:        build_outbound_error_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

return [{
  json: {
    messages: [],
    error: input.error || 'invalid_request'
  }
}];
