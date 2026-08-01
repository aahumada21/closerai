// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_add_channel  (workflow id 0rz0ue6OkEKRlqUG)
// Nodo:        build_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

if (input.status === "forbidden") {
  return [{ json: { ok: false, error: "forbidden", message: "El usuario no pertenece a esa organizacion.", channel_id: null } }];
}
if (input.status === "agent_not_found") {
  return [{ json: { ok: false, error: "agent_not_found", message: "El agente no existe o no pertenece a esa organizacion.", channel_id: null } }];
}
if (input.status === "creation_failed") {
  return [{ json: { ok: false, error: "creation_failed", message: "No se pudo vincular el canal. Revisa external_channel_id o intenta de nuevo.", channel_id: null } }];
}

return [{
  json: {
    ok: true,
    channel_id: input.channel_id,
    agent_id: input.agent_id,
    organization_id: input.organization_id,
    channel: input.channel,
    provider: input.provider,
    external_channel_id: input.external_channel_id,
    whatsapp_business_account_id: input.whatsapp_business_account_id || null
  }
}];
