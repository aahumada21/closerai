// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 2.1 channel_config_resolver  (workflow id gYYvc3jTVgDnAB8K)
// Nodo:        normalize_resolver_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function compactRaw(value) {
  if (!value || typeof value !== 'object') return {};
  return {
    source: value.source || null,
    channel: value.channel || value.normalized_event?.channel || null,
    provider: value.provider || value.routing?.provider || null,
    external_channel_id: value.external_channel_id || value.phone_number_id || value.routing?.external_channel_id || value.routing?.phone_number_id || value.normalized_event?.external_channel_id || value.normalized_event?.phone_number_id || null,
    message_id: value.message_id || value.normalized_event?.message_id || value.event?.message_id || null,
    lead_id: value.lead_id || value.normalized_event?.lead_id || value.event?.lead_id || null
  };
}

const normalizedEvent = input.normalized_event || {};
const routing = input.routing || {};
const event = input.event || {};
const sourceMetadata = input.source_metadata || event.source_metadata || normalizedEvent.source_metadata || {};
const metaPayload = input.body || input;
const metadata = metaPayload?.entry?.[0]?.changes?.[0]?.value?.metadata || {};

const externalChannelId = firstValue(
  input.external_channel_id,
  routing.external_channel_id,
  normalizedEvent.external_channel_id,
  sourceMetadata.external_channel_id,
  input.phone_number_id,
  routing.phone_number_id,
  normalizedEvent.phone_number_id,
  sourceMetadata.phone_number_id,
  metadata.phone_number_id
);

const phoneNumberId = firstValue(
  input.phone_number_id,
  routing.phone_number_id,
  normalizedEvent.phone_number_id,
  sourceMetadata.phone_number_id,
  metadata.phone_number_id,
  externalChannelId
);

const displayPhoneNumber = firstValue(
  input.display_phone_number,
  routing.display_phone_number,
  normalizedEvent.display_phone_number,
  sourceMetadata.display_phone_number,
  metadata.display_phone_number
);

const channel = firstValue(input.channel, normalizedEvent.channel, event.channel, 'whatsapp');
const provider = firstValue(input.provider, routing.provider, sourceMetadata.provider, 'meta_whatsapp_cloud_api');
const leadId = firstValue(input.lead_id, normalizedEvent.lead_id, event.lead_id, normalizedEvent.from, event.from);
const messageId = firstValue(input.message_id, normalizedEvent.message_id, event.message_id);

return [{
  json: {
    ...input,
    resolver_input: {
      channel,
      provider,
      external_channel_id: externalChannelId || null,
      phone_number_id: phoneNumberId || null,
      display_phone_number: displayPhoneNumber || null,
      lead_id: leadId || null,
      message_id: messageId || null,
      raw: compactRaw(input)
    }
  }
}];
