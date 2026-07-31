// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_fresh_google_calendar_token  (workflow id J3IJloxxmbHiaJgf)
// Nodo:        finalize_cached
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

return [{
  json: {
    connected: true,
    access_token: input.access_token,
    google_email: input.google_email || null,
    calendar_id: input.calendar_id || null
  }
}];
