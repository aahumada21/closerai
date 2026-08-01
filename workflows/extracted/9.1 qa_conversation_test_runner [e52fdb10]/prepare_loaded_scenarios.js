// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1 qa_conversation_test_runner  (workflow id e52fdb10-dbcb-4f10-97f2-ef6248ca2982)
// Nodo:        prepare_loaded_scenarios
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const runStamp = String(Date.now()).slice(-4);

return items.map((item, index) => {
  const scenario = item.json;

  const scenarioNumber = String(index + 1).padStart(3, "0");

  // Si el scenario_key viene como n¿mero telefnico (ej: 56990xxxx), salo tal cual
  const scenarioId = String(scenario.id || "");
  const qaPhone = scenarioId.startsWith("56990")
    ? scenarioId
    : `56901${runStamp}${scenarioNumber}`;

  let steps = scenario.steps;

  if (typeof steps === "string") {
    try {
      steps = JSON.parse(steps);
    } catch {
      steps = [];
    }
  }

  if (!Array.isArray(steps)) {
    steps = [];
  }

  return {
    json: {
      id: scenario.id,
      name: scenario.name,
      suite: scenario.suite,
      priority: scenario.priority,
      tags: scenario.tags || [],
      steps,
      phone: qaPhone,
      run_id: `qa_${new Date().toISOString()}_${scenario.id}`,
      expected_outcome: scenario.expected_outcome || null,
    },
  };
});
