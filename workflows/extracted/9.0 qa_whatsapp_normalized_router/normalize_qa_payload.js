// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.0 qa_whatsapp_normalized_router  (workflow id 1badeb35-0335-4aaa-96a6-2e021376db8a)
// Nodo:        normalize_qa_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const body = $json.body || $json;

const phone = String(
  body.lead?.phone ||
  body.lead?.external_id ||
  body.lead_id ||
  ""
).trim();

if (!phone) {
  throw new Error("QA payload missing lead.phone");
}

const text = String(body.text || "").trim();

if (!text) {
  throw new Error("QA payload missing text");
}

const now = new Date().toISOString();

return [
  {
    json: {
      event: {
        channel: body.channel || "whatsapp",
        message_id: body.message_id || `qa_${Date.now()}`,
        timestamp: body.timestamp || now,
        text,
        message_type: body.message_type || "text",
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        source_metadata: {
          ...(body.source_metadata || {}),
          test_mode: true,
          raw_type: "qa_normalized"
        }
      },
      lead: {
        name: body.lead?.name || "Cliente QA",
        phone,
        external_id: phone,
        channel: body.lead?.channel || body.channel || "whatsapp"
      }
    }
  }
];
