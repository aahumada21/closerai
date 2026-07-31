// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 1 whatsapp_inbound_adapter  (workflow id a5202fbc-eded-44b4-a98a-492a742c1368)
// Nodo:        attach_channel_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const normalized = $('normalize_whatsapp_event').item.json || {};
const resolved = $json || {};
const routing = resolved.routing || {};
const sourceMetadata = {
  ...(normalized.source_metadata || {}),
  provider: routing.provider || normalized.provider || normalized.source_metadata?.provider || 'meta_whatsapp_cloud_api',
  external_channel_id: routing.external_channel_id || normalized.external_channel_id || normalized.phone_number_id || null,
  phone_number_id: routing.phone_number_id || normalized.phone_number_id || null,
  display_phone_number: normalized.display_phone_number || normalized.source_metadata?.display_phone_number || null,
  organization_id: routing.organization_id || null,
  agent_id: routing.agent_id || null,
  channel_resolution_reason: resolved.not_processed_reason || null
};

return [{
  json: {
    ...normalized,
    should_process: resolved.should_process === true,
    not_processed_reason: resolved.not_processed_reason || null,
    organization: resolved.organization || {},
    agent: resolved.agent || {},
    channel_config: resolved.channel_config || {},
    routing,
    source_metadata: sourceMetadata,
    channel_resolution: {
      should_process: resolved.should_process === true,
      not_processed_reason: resolved.not_processed_reason || null,
      audit: resolved.audit || null
    },
    event: normalized,
    normalized_event: normalized
  }
}];
