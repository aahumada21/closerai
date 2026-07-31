// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_create_agent  (workflow id OnHysjH5lvf77zbJ)
// Nodo:        interpret_create_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const upstream = $("build_create_agent_query").first().json;
const dbResult = $json || {};

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlUuidOrNull(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  return isUuid ? "'" + text + "'" : "NULL";
}

const isMember = dbResult.is_member === true || dbResult.is_member === "t" || dbResult.is_member === "true";
const agentId = dbResult.agent_id || null;

let status = "ok";
if (!isMember) status = "forbidden";
else if (!agentId) status = "creation_failed";

const channel = upstream.channel && typeof upstream.channel === "object" ? upstream.channel : null;
let channelInsertQuery = null;

if (status === "ok" && channel && channel.channel && channel.provider && channel.external_channel_id) {
  channelInsertQuery = `
INSERT INTO agent_channels (organization_id, agent_id, channel, provider, external_channel_id, display_name, is_active)
VALUES (
  ${sqlUuidOrNull(dbResult.organization_id)},
  ${sqlUuidOrNull(agentId)},
  ${sqlText(channel.channel)},
  ${sqlText(channel.provider)},
  ${sqlText(channel.external_channel_id)},
  ${sqlText(channel.display_name || upstream.agent_name)},
  true
)
RETURNING id;
`;
}

return [{
  json: {
    status,
    agent_id: agentId,
    organization_id: dbResult.organization_id || upstream.organization_id || null,
    slug: upstream.slug || null,
    agent_name: upstream.agent_name || null,
    business_config_id: dbResult.business_config_id || null,
    pricing_version_id: dbResult.pricing_version_id || null,
    prices_created: dbResult.prices_created || 0,
    channel_insert_query: channelInsertQuery
  }
}];
