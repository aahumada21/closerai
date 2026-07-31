// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: webchat_outbound_adapter  (workflow id FQ876D7itp35JrSt)
// Nodo:        CODE validate_and_normalize_outbound_request
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const headers = input.headers || {};
const query = input.query || {};

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

const expectedToken = firstValue($env.WEBCHAT_WIDGET_TOKEN, $env.WEBCHAT_SHARED_SECRET);
const authHeader = header('authorization');
const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
const providedToken = firstValue(header('x-webchat-token'), bearerToken, query.token);

const widgetId = firstValue(query.widget_id, query.widgetId);
const sessionId = firstValue(query.session_id, query.sessionId);
const visitorId = firstValue(query.visitor_id, query.visitorId);
const leadKey = visitorId || sessionId;

// Buscar por cualquier identificador disponible: si el frontend mando
// visitor_id en el inbound pero solo session_id al hacer polling (o
// viceversa), igual debe encontrar el lead correcto.
const leadKeyCandidates = [...new Set([visitorId, sessionId].filter(Boolean))];

const rawSince = firstValue(query.since);
const sinceDate = rawSince && !Number.isNaN(Date.parse(rawSince)) ? new Date(rawSince) : new Date(0);

let error = null;
if (!expectedToken) error = 'missing_webchat_token_config';
else if (!providedToken || providedToken !== expectedToken) error = 'invalid_webchat_token';
else if (!widgetId) error = 'missing_widget_id';
else if (!leadKey) error = 'missing_visitor_or_session_id';

return [{
  json: {
    valid: !error,
    error,
    widget_id: widgetId || null,
    session_id: sessionId || null,
    visitor_id: visitorId || null,
    lead_external_ids: leadKeyCandidates.map((key) => 'web_' + key),
    since: sinceDate.toISOString()
  }
}];
