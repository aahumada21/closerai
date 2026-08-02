// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        merge_calendar_auth_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("merge_slot_check_with_context").first().json;
const auth = $json || {};

return [{
  json: {
    ...original,
    oauth_connected: auth.connected === true,
    oauth_access_token: auth.access_token || null,
    oauth_calendar_id: auth.calendar_id || null
  }
}];
