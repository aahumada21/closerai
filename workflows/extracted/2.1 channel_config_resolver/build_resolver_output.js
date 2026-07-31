// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 2.1 channel_config_resolver  (workflow id gYYvc3jTVgDnAB8K)
// Nodo:        build_resolver_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const row = $json || {};

function asObject(value, fallback = {}) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function asBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  const text = String(value || '').toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return false;
}

function safePart(value, fallback) {
  const text = String(value || fallback || '').trim();
  return text.replace(/[^a-zA-Z0-9_.:-]/g, '_') || fallback;
}

const input = asObject(row.input, {});
const organization = asObject(row.organization, {});
const agent = asObject(row.agent, {});
const channelConfig = asObject(row.channel_config, {});
const routing = asObject(row.routing, {});
const shouldProcess = asBool(row.should_process);
const notProcessedReason = shouldProcess ? null : (row.not_processed_reason || row.error_code || 'channel_not_processable');
const channel = routing.channel || input.channel || 'whatsapp';
const provider = routing.provider || input.provider || 'meta_whatsapp_cloud_api';
const externalChannelId = routing.external_channel_id || input.external_channel_id || input.phone_number_id || null;
const leadId = input.lead_id || null;
const messageId = input.message_id || null;
const idempotencyKey = [
  'channel_config',
  safePart(provider, 'provider'),
  safePart(externalChannelId, 'missing_external_channel_id'),
  safePart(messageId || leadId, 'no_message')
].join('__');

return [{
  json: {
    should_process: shouldProcess,
    not_processed_reason: notProcessedReason,
    organization,
    agent,
    channel_config: channelConfig,
    routing: {
      channel,
      provider,
      external_channel_id: externalChannelId,
      phone_number_id: routing.phone_number_id || input.phone_number_id || null,
      organization_id: routing.organization_id || organization.id || null,
      agent_id: routing.agent_id || agent.id || null,
      environment: routing.environment || channelConfig.config?.environment || 'production',
      resolution_source: routing.resolution_source || channelConfig.resolution_source || null
    },
    input,
    error_code: shouldProcess ? null : (row.error_code || notProcessedReason),
    error_message: shouldProcess ? null : (row.error_message || notProcessedReason),
    audit: {
      event_type: shouldProcess ? 'channel_config_resolved' : 'channel_config_discarded',
      reason_code: notProcessedReason,
      idempotency_key: idempotencyKey,
      normalized_ok: shouldProcess,
      channel,
      provider,
      external_channel_id: externalChannelId,
      lead_id: leadId,
      message_id: messageId,
      organization_id: routing.organization_id || organization.id || null,
      agent_id: routing.agent_id || agent.id || null,
      resolved_at: new Date().toISOString()
    }
  }
}];
