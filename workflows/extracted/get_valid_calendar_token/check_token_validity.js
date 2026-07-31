// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_valid_calendar_token  (workflow id bP1pWj4IkF5wbjMN)
// Nodo:        check_token_validity
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const row = $input.first().json;
const expiresAt = row.google_token_expires_at ? new Date(row.google_token_expires_at) : null;
const now = new Date();
const fiveMin = 5 * 60 * 1000;
const needsRefresh = !expiresAt || !row.google_access_token || (expiresAt - now) < fiveMin;
return [{ json: {
  needs_refresh: needsRefresh,
  access_token: row.google_access_token,
  refresh_token: row.google_refresh_token,
  agent_id: $('When Executed by Another Workflow').first().json.agent_id
}}];
