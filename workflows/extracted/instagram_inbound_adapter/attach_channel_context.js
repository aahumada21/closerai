// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: instagram_inbound_adapter  (workflow id cu0EZm9q1wNAVlZN)
// Nodo:        attach_channel_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const normalized = $('CODE normalize_instagram_event').item.json || {};
const resolved = $json || {};
const routing = resolved.routing || {};
const sourceMetadata = {
  ...(normalized.source_metadata || {}),
  provider: routing.provider || normalized.provider || 'instagram_graph_api',
  external_channel_id: routing.external_channel_id || normalized.external_channel_id || null,
  instagram_business_account_id: routing.external_channel_id || normalized.instagram_business_account_id || null,
  organization_id: routing.organization_id || null,
  agent_id: routing.agent_id || null,
  channel_resolution_reason: resolved.not_processed_reason || null
};

return [{
  json: {
    ...normalized,
    should_process: resolved.should_process === true,
    not_processed_reason: resolved.not_processed_reason || normalized.not_processed_reason || null,
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
