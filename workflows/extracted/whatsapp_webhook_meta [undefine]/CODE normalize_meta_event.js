// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: whatsapp_webhook_meta  (workflow id undefined)
// Nodo:        CODE normalize_meta_event
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function toIso(ts) {
  if (!ts) return new Date().toISOString();
  const num = Number(ts);
  if (Number.isFinite(num)) return new Date(num * 1000).toISOString();
  return new Date().toISOString();
}
function cleanText(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}
function messageText(msg) {
  if (msg.text && msg.text.body) return msg.text.body;
  if (msg.button) return msg.button.text || msg.button.payload || '';
  if (msg.interactive) {
    const i = msg.interactive;
    return i.button_reply?.title || i.button_reply?.id || i.list_reply?.title || i.list_reply?.id || '';
  }
  if (msg.image) return msg.image.caption || '';
  if (msg.document) return msg.document.caption || msg.document.filename || '';
  return '';
}
const body = $json.body || $json;
const receivedAt = new Date().toISOString();
const outputs = [];
for (const entry of body.entry || []) {
  const wabaId = String(entry.id || '');
  for (const change of entry.changes || []) {
    const value = change.value || {};
    const metadata = value.metadata || {};
    const phoneNumberId = String(metadata.phone_number_id || '');
    const displayPhoneNumber = String(metadata.display_phone_number || '');
    const contactsByWaId = {};
    for (const contact of value.contacts || []) {
      contactsByWaId[String(contact.wa_id || '')] = contact.profile?.name || '';
    }
    for (const msg of value.messages || []) {
      const from = String(msg.from || '');
      const type = ['text','image','audio','document','interactive','button'].includes(msg.type) ? msg.type : 'unknown';
      const messageId = String(msg.id || '');
      const normalized = {
        event_type: 'message',
        channel: 'whatsapp',
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        display_phone_number: displayPhoneNumber,
        lead_id: 'wa_' + from,
        from,
        name: String(contactsByWaId[from] || ''),
        message_id: messageId,
        timestamp: toIso(msg.timestamp),
        message_type: type,
        text: cleanText(messageText(msg)),
        raw: msg
      };
      normalized.idempotency_key = 'wa_msg_' + (messageId || (phoneNumberId + '_' + from + '_' + String(msg.timestamp || '0')));
      const audit = { event_received_at: receivedAt, event_type: 'message', phone_number_id: phoneNumberId, message_id: messageId, lead_id: normalized.lead_id, normalized_ok: true, error: null };
      outputs.push({ json: { source: 'meta_whatsapp_cloud_api', normalized_event: normalized, routing: { phone_number_id: phoneNumberId, environment: 'production' }, audit } });
    }
    for (const status of value.statuses || []) {
      const messageId = String(status.id || '');
      const normalized = {
        event_type: 'status',
        channel: 'whatsapp',
        phone_number_id: phoneNumberId,
        message_id: messageId,
        status: String(status.status || 'unknown'),
        timestamp: toIso(status.timestamp),
        recipient_id: String(status.recipient_id || ''),
        raw: status
      };
      normalized.idempotency_key = 'wa_status_' + (messageId || (phoneNumberId + '_' + normalized.recipient_id + '_' + String(status.timestamp || '0')));
      const audit = { event_received_at: receivedAt, event_type: 'status', phone_number_id: phoneNumberId, message_id: messageId, lead_id: null, normalized_ok: true, error: null };
      outputs.push({ json: { source: 'meta_whatsapp_cloud_api', normalized_event: normalized, routing: { phone_number_id: phoneNumberId, environment: 'production' }, audit } });
    }
    if ((!value.messages || value.messages.length === 0) && (!value.statuses || value.statuses.length === 0)) {
      const normalized = { event_type: 'other', channel: 'whatsapp', waba_id: wabaId, phone_number_id: phoneNumberId, display_phone_number: displayPhoneNumber, raw: value };
      normalized.idempotency_key = 'wa_other_' + phoneNumberId + '_' + receivedAt;
      const audit = { event_received_at: receivedAt, event_type: 'other', phone_number_id: phoneNumberId, message_id: null, lead_id: null, normalized_ok: true, error: null };
      outputs.push({ json: { source: 'meta_whatsapp_cloud_api', normalized_event: normalized, routing: { phone_number_id: phoneNumberId, environment: 'production' }, audit } });
    }
  }
}
if (outputs.length === 0) {
  const normalized = { event_type: 'other', channel: 'whatsapp', phone_number_id: '', raw: body, idempotency_key: 'wa_other_empty_' + receivedAt };
  const audit = { event_received_at: receivedAt, event_type: 'other', phone_number_id: '', message_id: null, lead_id: null, normalized_ok: false, error: 'empty_payload' };
  outputs.push({ json: { source: 'meta_whatsapp_cloud_api', normalized_event: normalized, routing: { phone_number_id: '', environment: 'production' }, audit } });
}
return outputs;
