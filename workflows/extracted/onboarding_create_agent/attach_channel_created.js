// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_create_agent  (workflow id OnHysjH5lvf77zbJ)
// Nodo:        attach_channel_created
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const base = $("interpret_create_result").first().json;
const channelRow = $json || {};

return [{
  json: {
    ...base,
    channel_created: true,
    channel_id: channelRow.id || null
  }
}];
