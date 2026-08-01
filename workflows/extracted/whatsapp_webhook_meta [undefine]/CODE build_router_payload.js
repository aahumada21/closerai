// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: whatsapp_webhook_meta  (workflow id undefined)
// Nodo:        CODE build_router_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $json.normalized_event || {};
const routing = $json.routing || {};
return [{ json: {
  source: 'meta_whatsapp_cloud_api',
  normalized_event: event,
  routing: {
    phone_number_id: String(event.phone_number_id || routing.phone_number_id || ''),
    environment: String($json.environment || routing.environment || 'production'),
    default_agent: $json.default_agent || null,
    business_name: $json.business_name || null
  }
} }];
