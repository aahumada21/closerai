// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: instagram_inbound_adapter  (workflow id cu0EZm9q1wNAVlZN)
// Nodo:        CODE normalize_instagram_event
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const body = $json.body || $json;
const receivedAt = new Date().toISOString();
const outputs = [];

function toIso(ts) {
  if (!ts) return receivedAt;
  const num = Number(ts);
  if (Number.isFinite(num)) {
    const millis = num > 9999999999 ? num : num * 1000;
    return new Date(millis).toISOString();
  }
  const parsed = new Date(ts);
  return Number.isNaN(parsed.getTime()) ? receivedAt : parsed.toISOString();
}

function cleanText(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

function attachmentInfo(attachment) {
  const payload = attachment?.payload || {};
  return {
    type: attachment?.type || 'unknown',
    url: payload.url || null,
    sticker_id: payload.sticker_id || null,
    reusable_attachment: payload.reusable_attachment || null,
    raw: attachment || {}
  };
}

function getEventType(messagingEvent) {
  if (messagingEvent.message) return 'message';
  if (messagingEvent.postback) return 'message';
  if (messagingEvent.delivery) return 'status';
  if (messagingEvent.read) return 'status';
  return 'other';
}

for (const entry of body.entry || []) {
  const instagramBusinessAccountId = String(entry.id || '');
  for (const messagingEvent of entry.messaging || []) {
    const senderId = String(messagingEvent.sender?.id || '');
    const recipientId = String(messagingEvent.recipient?.id || instagramBusinessAccountId || '');
    const externalChannelId = instagramBusinessAccountId || recipientId || null;
    const eventType = getEventType(messagingEvent);
    const message = messagingEvent.message || null;
    const postback = messagingEvent.postback || null;
    const attachments = Array.isArray(message?.attachments) ? message.attachments.map(attachmentInfo) : [];
    const quickReply = message?.quick_reply || null;
    const messageId = String(message?.mid || postback?.mid || messagingEvent.delivery?.mids?.[0] || messagingEvent.read?.mid || '');
    const text = cleanText(
      message?.text ||
      quickReply?.payload ||
      postback?.title ||
      postback?.payload ||
      ''
    );
    const messageType = message?.text
      ? 'text'
      : attachments[0]?.type || (quickReply ? 'quick_reply' : postback ? 'postback' : eventType);

    if (eventType === 'message') {
      outputs.push({
        json: {
          event_type: 'message',
          channel: 'instagram',
          provider: 'instagram_graph_api',
          external_channel_id: externalChannelId,
          instagram_business_account_id: externalChannelId,
          lead_id: senderId ? 'ig_' + senderId : null,
          from: senderId || null,
          message_id: messageId || null,
          timestamp: toIso(messagingEvent.timestamp),
          message_type: messageType || 'unknown',
          text,
          attachments,
          contact: {
            external_id: senderId || null,
            username: ''
          },
          source_metadata: {
            provider: 'instagram_graph_api',
            external_channel_id: externalChannelId,
            instagram_business_account_id: externalChannelId,
            sender_id: senderId || null,
            recipient_id: recipientId || null
          },
          idempotency_key: ['ig_msg', externalChannelId || 'unknown_account', messageId || senderId || 'unknown_message'].join('__'),
          normalized_ok: !!externalChannelId && !!senderId,
          raw_message: messagingEvent,
          raw: body
        }
      });
      continue;
    }

    if (eventType === 'status') {
      const status = messagingEvent.delivery ? 'delivered' : 'read';
      outputs.push({
        json: {
          event_type: 'status',
          channel: 'instagram',
          provider: 'instagram_graph_api',
          external_channel_id: externalChannelId,
          instagram_business_account_id: externalChannelId,
          message_id: messageId || null,
          status,
          timestamp: toIso(messagingEvent.timestamp),
          recipient_id: senderId || null,
          lead_id: senderId ? 'ig_' + senderId : null,
          source_metadata: {
            provider: 'instagram_graph_api',
            external_channel_id: externalChannelId,
            instagram_business_account_id: externalChannelId,
            sender_id: senderId || null,
            recipient_id: recipientId || null
          },
          idempotency_key: ['ig_status', externalChannelId || 'unknown_account', messageId || senderId || 'unknown_message', status].join('__'),
          normalized_ok: !!externalChannelId,
          raw_status: messagingEvent,
          raw: body
        }
      });
      continue;
    }

    outputs.push({
      json: {
        event_type: 'other',
        channel: 'instagram',
        provider: 'instagram_graph_api',
        external_channel_id: externalChannelId,
        instagram_business_account_id: externalChannelId,
        lead_id: senderId ? 'ig_' + senderId : null,
        message_id: messageId || null,
        timestamp: toIso(messagingEvent.timestamp),
        source_metadata: {
          provider: 'instagram_graph_api',
          external_channel_id: externalChannelId,
          instagram_business_account_id: externalChannelId,
          sender_id: senderId || null,
          recipient_id: recipientId || null
        },
        idempotency_key: ['ig_other', externalChannelId || 'unknown_account', senderId || 'unknown_sender', String(messagingEvent.timestamp || Date.now())].join('__'),
        normalized_ok: !!externalChannelId,
        raw_event: messagingEvent,
        raw: body
      }
    });
  }
}

if (outputs.length === 0) {
  outputs.push({
    json: {
      event_type: 'other',
      channel: 'instagram',
      provider: 'instagram_graph_api',
      external_channel_id: null,
      lead_id: null,
      message_id: null,
      timestamp: receivedAt,
      source_metadata: {
        provider: 'instagram_graph_api',
        external_channel_id: null
      },
      idempotency_key: 'ig_empty__' + receivedAt,
      normalized_ok: false,
      not_processed_reason: 'empty_instagram_payload',
      raw: body
    }
  });
}

return outputs;
