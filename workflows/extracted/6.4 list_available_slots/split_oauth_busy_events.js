// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        split_oauth_busy_events
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
    status: event.status || null
  }
}));
