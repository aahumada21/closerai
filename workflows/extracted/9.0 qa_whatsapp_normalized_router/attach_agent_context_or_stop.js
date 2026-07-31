// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.0 qa_whatsapp_normalized_router  (workflow id 1badeb35-0335-4aaa-96a6-2e021376db8a)
// Nodo:        attach_agent_context_or_stop
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const payload = $("build_commercial_payload").item.json;
const row = $json || {};

function asObject(value, fallback = null) {
  if (!value) return fallback;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function asBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (String(value).toLowerCase() === "true") return true;
  return false;
}

const shouldProcess = asBool(row.should_process);
const routing = asObject(row.routing, payload.routing || {}) || {};
const organization = asObject(row.organization, payload.organization || null);
const agent = asObject(row.agent, payload.agent || null);
const channelConfig = asObject(row.channel_config, payload.channel_config || null);

return [{
  json: {
    ...payload,
    organization,
    agent,
    channel_config: channelConfig,
    should_process: shouldProcess,
    not_processed_reason: shouldProcess ? null : (row.error_code || "agent_channel_not_found_or_inactive"),
    routing: {
      ...(payload.routing || {}),
      ...routing,
      organization_id: routing.organization_id || organization?.id || null,
      agent_id: routing.agent_id || agent?.id || null
    },
    source_metadata: {
      ...(payload.source_metadata || {}),
      agent_resolution: row.legacy_mode === true || String(row.legacy_mode).toLowerCase() === "true" ? "legacy" : "agent_channels",
      agent_resolution_error: row.error_code || null
    }
  }
}];
