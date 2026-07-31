// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
// Nodo:        merge_after_config_write
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const prior = $("compute_new_config_and_prices").first().json;
const dbResult = $json || {};

return [{
  json: {
    ...prior,
    new_config_id: dbResult.new_config_id || null,
    new_version_written: dbResult.new_version_written || null,
    deactivated_count: dbResult.deactivated_count || 0,
  }
}];
