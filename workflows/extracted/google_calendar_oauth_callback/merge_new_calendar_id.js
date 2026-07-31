// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        merge_new_calendar_id
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const response = $json || {};

if (!response.id) {
  throw new Error("No se pudo crear el calendario dedicado en Google: " + JSON.stringify(response));
}

return [{ json: { calendar_id: response.id } }];
