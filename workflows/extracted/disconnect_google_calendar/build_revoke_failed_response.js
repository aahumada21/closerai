// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: disconnect_google_calendar  (workflow id 2FtwTlOI0mzbrXqR)
// Nodo:        build_revoke_failed_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

return [{
  json: {
    ok: false,
    error: "revoke_failed",
    message: input.revoke_error_message || "Google rechazo la revocacion del token."
  }
}];
