// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        build_stop_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  stopped: true,
  route: $json.route || {},
  rule_result: $json.rule_result || {},
  rule_trace: $json.rule_trace || [],
  config_used: $json.config_used || {},
  reason: $json.rule_result?.reason || 'stopped_by_rules_engine'
}];
