// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: disconnect_google_calendar  (workflow id 2FtwTlOI0mzbrXqR)
// Nodo:        check_revoke_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

const statusCode = input.statusCode ?? input.status ?? null;
const hasError = !!input.error || (statusCode !== null && Number(statusCode) >= 300);

return [{
  json: {
    revoke_ok: !hasError,
    revoke_error_message: hasError ? JSON.stringify(input.error || input) : null
  }
}];
