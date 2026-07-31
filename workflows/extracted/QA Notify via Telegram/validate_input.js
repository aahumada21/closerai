// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: QA Notify via Telegram  (workflow id sfqQan620IQ81UFP)
// Nodo:        validate_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const body = $json.body || $json;
const message = String(body.message || "Notificacion sin contenido.");

return [{ message }];
