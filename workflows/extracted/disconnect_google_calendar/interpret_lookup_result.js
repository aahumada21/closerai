// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: disconnect_google_calendar  (workflow id 2FtwTlOI0mzbrXqR)
// Nodo:        interpret_lookup_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $("validate_disconnect_request").first().json;
const lookup = $json || {};

function toBool(value) {
  return value === true || value === "t" || value === "true";
}

const agentValid = toBool(lookup.agent_valid);
const hasConnection = toBool(lookup.has_connection);

let error = ctx.error;
if (!error && !agentValid) error = "agent_not_found";
else if (!error && !hasConnection) error = "no_connection";

return [{
  json: {
    valid: !error,
    error,
    agent_id: ctx.agent_id,
    organization_id: ctx.organization_id,
    refresh_token: lookup.refresh_token || null
  }
}];
