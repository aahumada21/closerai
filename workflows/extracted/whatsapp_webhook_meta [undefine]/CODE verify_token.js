// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: whatsapp_webhook_meta  (workflow id undefined)
// Nodo:        CODE verify_token
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const query = $json.query || {};
const expected = String($env.META_VERIFY_TOKEN || '');
const mode = String(query['hub.mode'] || '');
const token = String(query['hub.verify_token'] || '');
const challenge = String(query['hub.challenge'] || '');
const ok = mode === 'subscribe' && expected.length > 0 && token === expected;
return [{ json: { response_code: ok ? 200 : 403, response_body: ok ? challenge : 'Invalid verify token' } }];
