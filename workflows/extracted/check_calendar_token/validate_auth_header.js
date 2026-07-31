// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: check_calendar_token  (workflow id lqVjuXxseowt8UKo)
// Nodo:        validate_auth_header
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const token = $input.first().json.headers?.['x-check-token'] || '';
const expected = 'e56650a74a76c1bf53626385b93acfa1a1af6f924904dae65848716bccb94f5e';
if (token !== expected) throw new Error('unauthorized');
const body = $input.first().json.body || {};
return [{ json: { agent_id: body.agent_id, organization_id: body.organization_id } }];
