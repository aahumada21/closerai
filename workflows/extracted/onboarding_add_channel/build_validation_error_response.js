// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_add_channel  (workflow id 0rz0ue6OkEKRlqUG)
// Nodo:        build_validation_error_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
return [{ json: { ok: false, error: input.error || "invalid_request", channel_id: null } }];
