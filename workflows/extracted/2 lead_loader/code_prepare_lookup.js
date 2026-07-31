// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 2 lead_loader  (workflow id f5383ae7-dd2e-4177-9875-c6dcff27e3d5)
// Nodo:        code_prepare_lookup
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const event = input.event || input.normalized_event || input;

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

if (!event.channel) {
  throw new Error('Missing required field: channel');
}

if (!event.lead_id) {
  throw new Error('Missing required field: lead_id');
}

if (!event.timestamp) {
  throw new Error('Missing required field: timestamp');
}

const routing = input.routing || event.routing || {};
const organization = input.organization || event.organization || null;
const agent = input.agent || event.agent || null;
const channelConfig = input.channel_config || event.channel_config || null;
const whatsappNumber = input.whatsapp_number || event.whatsapp_number || null;

const organizationId = firstValue(input.organization_id, routing.organization_id, organization?.id, event.organization_id);
const agentId = firstValue(input.agent_id, routing.agent_id, agent?.id, event.agent_id);
const phone = event.contact?.wa_id || event.lead_id || null;
const name = event.contact?.name || null;

return [{
  json: {
    event,
    lookup: {
      channel: String(event.channel),
      external_id: String(event.lead_id),
      phone: phone ? String(phone) : null,
      name: name || null,
      organization_id: organizationId,
      agent_id: agentId
    },
    organization,
    agent,
    channel_config: channelConfig,
    whatsapp_number: whatsappNumber,
    routing: {
      ...routing,
      organization_id: organizationId,
      agent_id: agentId
    },
    meta: {
      ...(input.meta || {}),
      loader_version: '1.2.0',
      agent_context_present: !!agentId
    }
  }
}];
