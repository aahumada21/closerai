const normalized = $("normalize_qa_payload").item.json;
const db = $json;

const phone = String(
  normalized.lead?.phone ||
  normalized.lead?.external_id ||
  ""
).trim();

const body = $json.body || {};
const event = normalized.event || {};
const sourceMetadata = event.source_metadata || {};

return [
  {
    json: {
      channel: normalized.event.channel || "whatsapp",
      lead_id: phone,
      message_id: normalized.event.message_id,
      timestamp: normalized.event.timestamp,
      text: normalized.event.text,
      message_type: normalized.event.message_type || "text",
      attachments: normalized.event.attachments || [],
      contact: {
        wa_id: phone,
        name: normalized.lead?.name || "Cliente QA"
      },
      source_metadata: {
        ...sourceMetadata,
        test_mode: true,
        raw_type: "qa_normalized",
        qa_router: true,
        qa_db_lead_id: db.lead_id,
        qa_message_db_id: db.message_db_id
      },
      routing: body.routing || null,
      organization: body.organization || null,
      agent: body.agent || null,
      channel_config: body.channel_config || null,
      whatsapp_number: body.whatsapp_number || null
    }
  }
];
