// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        collect_scenario_info
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const scenario = $("expand_steps").first().json;

return [{
  json: {
    run_id: scenario.run_id,
    scenario_id: scenario.scenario_id,
    scenario_name: scenario.scenario_name,
    expected_outcome: scenario.expected_outcome || null,
    has_expected_outcome: !!scenario.expected_outcome
  }
}];
