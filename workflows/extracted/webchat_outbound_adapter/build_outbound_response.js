// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: webchat_outbound_adapter  (workflow id FQ876D7itp35JrSt)
// Nodo:        build_outbound_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $('CODE validate_and_normalize_outbound_request').first().json;
const rows = $input.all().map((item) => item.json);

const messages = rows
  .filter((row) => row && row.id)
  .map((row) => ({
    id: row.id,
    text: row.content || '',
    created_at: row.created_at,
    from: 'bot'
  }));

return [{
  json: {
    messages,
    since: input.since,
    polled_at: new Date().toISOString()
  }
}];
