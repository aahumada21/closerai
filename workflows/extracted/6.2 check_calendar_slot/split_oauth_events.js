// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.2 check_calendar_slot  (workflow id 9b16489e-ce39-4213-ab5d-270d035fa1e0)
// Nodo:        split_oauth_events
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const response = $json || {};
const items = Array.isArray(response.items) ? response.items : [];

if (items.length === 0) {
  // Sin esto, n8n deja de propagar la ejecucion cuando el calendario
  // dedicado esta vacio (0 items de salida = nodos siguientes no corren).
  return [{ json: { id: null, summary: null, start: null, end: null, status: null } }];
}

return items.map((event) => ({
  json: {
    id: event.id || null,
    summary: event.summary || null,
    start: event.start || null,
    end: event.end || null,
    status: event.status || null,
    htmlLink: event.htmlLink || null
  }
}));
