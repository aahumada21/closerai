// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
// Nodo:        merge_after_prices
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const prior = $("merge_after_config_write").first().json;
const dbResult = $json || {};

return [{
  json: {
    ...prior,
    prices_written_count: Array.isArray($input.all()) ? $input.all().length : 0,
  }
}];
