// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: disconnect_google_calendar  (workflow id 2FtwTlOI0mzbrXqR)
// Nodo:        build_error_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

return [{
  json: {
    ok: false,
    error: input.error || "unknown_error"
  }
}];
