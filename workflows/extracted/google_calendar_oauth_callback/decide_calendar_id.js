// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        decide_calendar_id
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const existing = $json.existing_calendar_id || null;

return [{
  json: {
    needs_new_calendar: !existing,
    existing_calendar_id: existing
  }
}];
