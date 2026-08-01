// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: whatsapp_register_number  (workflow id WKgS2yBfoSQD88xZ)
// Nodo:        CODE normalize_register_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const raw = $json;
const error = raw.error || raw.body?.error || raw.response?.error;
if (error) {
  return [{ json: {
    success: false,
    error_code: String(error.code || error.type || 'meta_register_error'),
    error_message: String(error.message || 'register failed'),
    raw
  } }];
}
return [{ json: {
  success: true,
  phone_number_id: $('CODE prepare_register_request').first().json.phone_number_id,
  registered_at: new Date().toISOString(),
  raw
} }];
