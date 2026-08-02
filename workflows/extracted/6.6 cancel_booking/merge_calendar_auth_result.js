// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
// Nodo:        merge_calendar_auth_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("merge_cancel_context_with_appointment").first().json;
const auth = $json || {};

return [{
  json: {
    ...original,
    oauth_connected: auth.connected === true,
    oauth_access_token: auth.access_token || null,
    oauth_calendar_id: auth.calendar_id || null
  }
}];
