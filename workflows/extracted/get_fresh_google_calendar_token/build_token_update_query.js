// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_fresh_google_calendar_token  (workflow id J3IJloxxmbHiaJgf)
// Nodo:        build_token_update_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const agentId = $("validate_token_input").first().json.agent_id;
const tokens = $json || {};

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlUuid(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  if (!isUuid) throw new Error("Invalid agent_id uuid: " + text);
  return "'" + text + "'::uuid";
}

const expiresAt = new Date(Date.now() + (Number(tokens.expires_in || 3600) * 1000)).toISOString();

const query = `
UPDATE public.google_calendar_connections
SET access_token = ${sqlText(tokens.access_token)},
    access_token_expires_at = ${sqlText(expiresAt)}::timestamptz,
    updated_at = now()
WHERE agent_id = ${sqlUuid(agentId)}
RETURNING agent_id, google_email, access_token;
`;

return [{ json: { update_query: query, new_access_token: tokens.access_token } }];
