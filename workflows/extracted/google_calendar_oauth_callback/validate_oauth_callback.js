// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        validate_oauth_callback
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const query = input.query || {};

const code = query.code || null;
const stateRaw = query.state || "";
const oauthError = query.error || null;

function parseState(raw) {
  try {
    const decoded = Buffer.from(String(raw), "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

const state = parseState(stateRaw);
const agentId = state?.agent_id || null;
const organizationId = state?.organization_id || null;

let error = null;
if (oauthError) error = "google_oauth_denied";
else if (!code) error = "missing_code";
else if (!isUuid(agentId) || !isUuid(organizationId)) error = "invalid_state";

return [{
  json: {
    valid: !error,
    error,
    code,
    agent_id: agentId,
    organization_id: organizationId
  }
}];
