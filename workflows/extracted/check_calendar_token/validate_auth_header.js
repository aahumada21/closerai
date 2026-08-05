// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: check_calendar_token  (workflow id lqVjuXxseowt8UKo)
// Nodo:        validate_auth_header
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const token = $input.first().json.headers?.['x-check-token'] || '';
// Sin hardcodear: el valor vive en el entorno del servidor. Si la variable no
// esta seteada, expected queda vacio y no matchea nada -> falla cerrado.
const expected = $env.CHECK_CALENDAR_TOKEN || '';
if (token !== expected) throw new Error('unauthorized');
const body = $input.first().json.body || {};
return [{ json: { agent_id: body.agent_id, organization_id: body.organization_id } }];
