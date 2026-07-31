// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_fresh_google_calendar_token  (workflow id J3IJloxxmbHiaJgf)
// Nodo:        finalize_refreshed
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const built = $("build_token_update_query").first().json;
const dbResult = $json || {};
const auth = $("decide_refresh_needed").first().json;

return [{
  json: {
    connected: true,
    access_token: dbResult.access_token || built.new_access_token,
    google_email: dbResult.google_email || null,
    calendar_id: auth.calendar_id || null
  }
}];
