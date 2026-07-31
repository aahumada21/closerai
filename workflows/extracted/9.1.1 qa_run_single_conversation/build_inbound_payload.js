// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        build_inbound_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const now = new Date().toISOString();
const generatedMessageId = `qa_${$json.scenario_id}_${$json.step_index}_${Date.now()}`;
const qaMessageId = String($json.message_id || "").trim() || generatedMessageId;

const sourceMetadata = $json.source_metadata || {};
const routing = $json.routing || null;
const organization = $json.organization || null;
const agent = $json.agent || null;
const channelConfig = $json.channel_config || null;
const whatsappNumber = $json.whatsapp_number || null;
const messageType = String($json.message_type || "text").trim() || "text";
const attachments = Array.isArray($json.attachments) ? $json.attachments : [];
const leadInput = $json.lead || {};

const payload = {
  channel: "whatsapp",
  message_id: qaMessageId,
  timestamp: now,
  text: $json.text,
  message_type: messageType,
  attachments,
  source_metadata: {
    ...sourceMetadata,
    test_mode: true,
    qa_run_id: $json.run_id,
    scenario_id: $json.scenario_id,
    step_index: $json.step_index
  },
  routing,
  organization,
  agent,
  channel_config: channelConfig,
  whatsapp_number: whatsappNumber,
  lead: {
    name: leadInput.name || "Cliente QA",
    phone: leadInput.phone || $json.phone,
    external_id: leadInput.external_id || $json.phone,
    channel: leadInput.channel || "whatsapp"
  }
};

return [
  {
    json: {
      ...$json,
      qa_message_id: qaMessageId,
      sent_at: now,
      inbound_payload: payload
    }
  }
];
