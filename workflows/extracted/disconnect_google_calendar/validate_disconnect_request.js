// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: disconnect_google_calendar  (workflow id 2FtwTlOI0mzbrXqR)
// Nodo:        validate_disconnect_request
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const body = input.body || input;
const headers = input.headers || {};

function header(name) {
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key] || "") : "";
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

const expectedToken = $env.DISCONNECT_GOOGLE_CALENDAR_TOKEN;
const providedToken = header("x-disconnect-token");

const agentId = String(body.agent_id || "").trim();
const organizationId = String(body.organization_id || "").trim();

let error = null;
if (!expectedToken) error = "missing_disconnect_token_config";
else if (!providedToken || providedToken !== expectedToken) error = "invalid_disconnect_token";
else if (!isUuid(agentId) || !isUuid(organizationId)) error = "invalid_request";

const lookupQuery = (!error)
  ? `
SELECT
  EXISTS(SELECT 1 FROM public.agents WHERE id = '${agentId}'::uuid AND organization_id = '${organizationId}'::uuid AND is_active = true) AS agent_valid,
  EXISTS(SELECT 1 FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS has_connection,
  (SELECT refresh_token FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS refresh_token;
`
  : "SELECT false AS agent_valid, false AS has_connection, NULL AS refresh_token;";

return [{
  json: {
    valid: !error,
    error,
    agent_id: agentId || null,
    organization_id: organizationId || null,
    lookup_query: lookupQuery
  }
}];
