// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: webchat_inbound_adapter  (workflow id 28uyrvO73tVxgdM2)
// Nodo:        CODE validate_and_normalize_webchat
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const body = input.body || input;
const headers = input.headers || {};
const query = input.query || {};
const receivedAt = new Date().toISOString();

function header(name) {
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key] || '') : '';
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function cleanText(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

function safePart(value, fallback) {
  const text = String(value || fallback || '').trim();
  return text.replace(/[^a-zA-Z0-9_.:-]/g, '_') || fallback;
}

function hashText(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

const expectedToken = firstValue($env.WEBCHAT_WIDGET_TOKEN, $env.WEBCHAT_SHARED_SECRET);
const authHeader = header('authorization');
const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
const providedToken = firstValue(header('x-webchat-token'), bearerToken, query.token, body.token);
const widgetId = firstValue(body.widget_id, body.widgetId, query.widget_id, query.widgetId);
const visitorId = firstValue(body.visitor_id, body.visitorId, body.contact?.external_id, query.visitor_id, query.visitorId);
const sessionId = firstValue(body.session_id, body.sessionId, query.session_id, query.sessionId);
const text = cleanText(body.text || body.message || body.body);
const messageId = firstValue(body.message_id, body.messageId, ['web', widgetId, visitorId || sessionId, hashText(text), body.timestamp || receivedAt].join('_'));
const leadKey = visitorId || sessionId;
const leadId = leadKey ? 'web_' + leadKey : null;
const idempotencyKey = ['web_msg', safePart(widgetId, 'missing_widget'), safePart(messageId, 'missing_message')].join('__');

let error = null;
if (!expectedToken) error = 'missing_webchat_token_config';
else if (!providedToken || providedToken !== expectedToken) error = 'invalid_webchat_token';
else if (!widgetId) error = 'missing_widget_id';
else if (!leadKey) error = 'missing_visitor_or_session_id';
else if (!text) error = 'missing_text';

const normalized = {
  event_type: error ? 'discarded' : 'message',
  channel: 'webchat',
  provider: 'webchat_widget',
  external_channel_id: widgetId || null,
  widget_id: widgetId || null,
  lead_id: leadId,
  message_id: messageId,
  timestamp: firstValue(body.timestamp, receivedAt),
  message_type: 'text',
  text,
  contact: {
    external_id: leadKey || null,
    visitor_id: visitorId || null,
    session_id: sessionId || null,
    name: firstValue(body.name, body.contact?.name) || null,
    email: firstValue(body.email, body.contact?.email) || null,
    phone: firstValue(body.phone, body.contact?.phone) || null
  },
  source_metadata: {
    provider: 'webchat_widget',
    external_channel_id: widgetId || null,
    widget_id: widgetId || null,
    visitor_id: visitorId || null,
    session_id: sessionId || null,
    page_url: firstValue(body.page_url, body.pageUrl, body.url) || null,
    referrer: firstValue(body.referrer, headers.referer, headers.referrer) || null,
    user_agent: header('user-agent') || null,
    ip: firstValue(header('x-forwarded-for'), header('x-real-ip')) || null,
    utm: body.utm || {}
  },
  idempotency_key: idempotencyKey,
  normalized_ok: !error,
  not_processed_reason: error,
  raw: body
};

return [{ json: normalized }];
