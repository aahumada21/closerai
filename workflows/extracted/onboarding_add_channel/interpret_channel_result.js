// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_add_channel  (workflow id 0rz0ue6OkEKRlqUG)
// Nodo:        interpret_channel_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const upstream = $("build_channel_query").first().json;
const dbResult = $json || {};

const isMember = dbResult.is_member === true || dbResult.is_member === "t" || dbResult.is_member === "true";
const agentBelongs = dbResult.agent_belongs === true || dbResult.agent_belongs === "t" || dbResult.agent_belongs === "true";
const channelId = dbResult.channel_id || null;

let status = "ok";
if (!isMember) status = "forbidden";
else if (!agentBelongs) status = "agent_not_found";
else if (!channelId) status = "creation_failed";

return [{
  json: {
    status,
    channel_id: channelId,
    agent_id: upstream.agent_id,
    organization_id: upstream.organization_id,
    channel: upstream.channel,
    provider: upstream.provider,
    external_channel_id: upstream.external_channel_id,
    whatsapp_business_account_id: upstream.whatsapp_business_account_id
  }
}];
