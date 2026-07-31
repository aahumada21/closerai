// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: webchat_inbound_adapter  (workflow id 28uyrvO73tVxgdM2)
// Nodo:        attach_channel_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const normalized = $('CODE validate_and_normalize_webchat').item.json || {};
const resolved = $json || {};
const routing = resolved.routing || {};
const sourceMetadata = {
  ...(normalized.source_metadata || {}),
  provider: routing.provider || normalized.provider || 'webchat_widget',
  external_channel_id: routing.external_channel_id || normalized.external_channel_id || null,
  widget_id: routing.external_channel_id || normalized.widget_id || null,
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
