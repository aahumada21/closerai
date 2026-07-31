// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_valid_calendar_token  (workflow id bP1pWj4IkF5wbjMN)
// Nodo:        build_token_update
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
return [{ json: { access_token: $json.access_token, expires_at: expiresAt, agent_id: $('check_token_validity').first().json.agent_id }}];
