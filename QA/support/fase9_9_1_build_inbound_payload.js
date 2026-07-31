const now = new Date().toISOString();
const qaMessageId = `qa_${$json.scenario_id}_${$json.step_index}_${Date.now()}`;

const sourceMetadata = $json.source_metadata || {};
const routing = $json.routing || null;
const organization = $json.organization || null;
const agent = $json.agent || null;
const channelConfig = $json.channel_config || null;
const whatsappNumber = $json.whatsapp_number || null;

const payload = {
  channel: "whatsapp",
  message_id: qaMessageId,
  timestamp: now,
  text: $json.text,
  message_type: "text",
  attachments: [],
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
    name: "Cliente QA",
    phone: $json.phone,
    external_id: $json.phone,
    channel: "whatsapp"
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
