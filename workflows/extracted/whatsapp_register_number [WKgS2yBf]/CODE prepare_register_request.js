// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: whatsapp_register_number  (workflow id WKgS2yBfoSQD88xZ)
// Nodo:        CODE prepare_register_request
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json.body || $json;
const phoneNumberId = String(input.phone_number_id || '').trim();
const pin = String(input.pin || $env.DEFAULT_PIN || '').trim();
const graphVersion = String($env.META_GRAPH_VERSION || 'v20.0').trim();
if (!phoneNumberId) throw new Error('phone_number_id is required');
if (!pin) throw new Error('pin is required');
if (!$env.META_ACCESS_TOKEN) throw new Error('META_ACCESS_TOKEN is required');
return [{ json: {
  phone_number_id: phoneNumberId,
  pin,
  graph_version: graphVersion,
  graph_url: 'https://graph.facebook.com/' + graphVersion + '/' + encodeURIComponent(phoneNumberId) + '/register',
  requested_at: new Date().toISOString()
} }];
