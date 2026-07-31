// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 1 whatsapp_inbound_adapter  (workflow id a5202fbc-eded-44b4-a98a-492a742c1368)
// Nodo:        normalize_whatsapp_event
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const body = $json.body || $json;
const value = body?.entry?.[0]?.changes?.[0]?.value;

if (!value) {
  return [];
}

const metadata = value.metadata || {};
const phoneNumberId = metadata.phone_number_id || null;
const displayPhoneNumber = metadata.display_phone_number || null;
const provider = 'meta_whatsapp_cloud_api';
const channel = 'whatsapp';
const externalChannelId = phoneNumberId;

function baseSourceMetadata() {
  return {
    provider,
    phone_number_id: phoneNumberId,
    external_channel_id: externalChannelId,
    display_phone_number: displayPhoneNumber
  };
}

function statusIdempotencyKey(statusEvent) {
  return [
    'wa_status',
    phoneNumberId || 'unknown_phone',
    statusEvent.id || 'unknown_message',
    statusEvent.status || 'unknown_status',
    statusEvent.timestamp || 'unknown_ts'
  ].join('__');
}

function messageIdempotencyKey(message) {
  return [
    'wa_msg',
    phoneNumberId || 'unknown_phone',
    message.id || 'unknown_message'
  ].join('__');
}

if (Array.isArray(value.statuses) && value.statuses.length > 0) {
  return value.statuses.map((statusEvent) => {
    const messageId = statusEvent.id || null;
    const status = statusEvent.status || 'unknown';
    const recipientId = statusEvent.recipient_id || null;

    return {
      json: {
        event_type: 'status',
        channel,
        provider,
        external_channel_id: externalChannelId,
        phone_number_id: phoneNumberId,
        display_phone_number: displayPhoneNumber,
        message_id: messageId,
        status,
        timestamp: statusEvent.timestamp || null,
        recipient_id: recipientId,
        lead_id: recipientId ? 'wa_' + recipientId : null,
        idempotency_key: statusIdempotencyKey(statusEvent),
        normalized_ok: ['sent', 'delivered', 'read', 'failed'].includes(status),
        source_metadata: baseSourceMetadata(),
        raw_status: statusEvent,
        raw: body
      }
    };
  });
}

const messages = Array.isArray(value.messages) ? value.messages : [];
if (messages.length === 0) {
  return [];
}

return messages
  .filter((msg) => !!msg?.from)
  .map((msg) => {
    const contact = Array.isArray(value.contacts)
      ? value.contacts.find((item) => item?.wa_id === msg.from) || value.contacts[0]
      : null;
    const profileName = contact?.profile?.name || null;
    const attachments = [];
    let normalizedText = '';

    switch (msg.type) {
      case 'text':
        normalizedText = msg.text?.body || '';
        break;
      case 'image':
        normalizedText = msg.image?.caption || '';
        attachments.push({ type: 'image', id: msg.image?.id || null, mime_type: msg.image?.mime_type || null, sha256: msg.image?.sha256 || null, caption: msg.image?.caption || null });
        break;
      case 'document':
        normalizedText = msg.document?.caption || '';
        attachments.push({ type: 'document', id: msg.document?.id || null, mime_type: msg.document?.mime_type || null, sha256: msg.document?.sha256 || null, filename: msg.document?.filename || null, caption: msg.document?.caption || null });
        break;
      case 'audio':
        attachments.push({ type: 'audio', id: msg.audio?.id || null, mime_type: msg.audio?.mime_type || null, sha256: msg.audio?.sha256 || null, voice: msg.audio?.voice || false });
        break;
      case 'button':
        normalizedText = msg.button?.text || msg.button?.payload || '';
        attachments.push({ type: 'button', payload: msg.button?.payload || null, text: msg.button?.text || null });
        break;
      case 'interactive':
        normalizedText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
        attachments.push({ type: 'interactive', button_reply: msg.interactive?.button_reply || null, list_reply: msg.interactive?.list_reply || null });
        break;
      case 'video':
        normalizedText = msg.video?.caption || '';
        attachments.push({ type: 'video', id: msg.video?.id || null, mime_type: msg.video?.mime_type || null, sha256: msg.video?.sha256 || null, caption: msg.video?.caption || null });
        break;
      case 'location':
        normalizedText = 'El usuario envio una ubicacion';
        attachments.push({ type: 'location', latitude: msg.location?.latitude || null, longitude: msg.location?.longitude || null, name: msg.location?.name || null, address: msg.location?.address || null });
        break;
      default:
        attachments.push({ type: msg.type || 'unknown', raw: msg });
        break;
    }

    return {
      json: {
        event_type: 'message',
        channel,
        provider,
        external_channel_id: externalChannelId,
        phone_number_id: phoneNumberId,
        display_phone_number: displayPhoneNumber,
        waba_id: body?.entry?.[0]?.id || null,
        lead_id: 'wa_' + msg.from,
        from: msg.from,
        name: profileName,
        message_id: msg.id || null,
        timestamp: msg.timestamp || null,
        message_type: msg.type || 'unknown',
        text: normalizedText,
        attachments,
        contact: {
          wa_id: contact?.wa_id || msg.from,
          name: profileName
        },
        source_metadata: baseSourceMetadata(),
        idempotency_key: messageIdempotencyKey(msg),
        normalized_ok: true,
        raw_message: msg,
        raw: body
      }
    };
  });
