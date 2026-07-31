// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        expand_steps
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const scenario = $json;
const triggerData = (() => { try { return $("9.1.1 qa_run_single_conversation").first().json; } catch { return {}; } })();
const scenarioDefaults = scenario.defaults || scenario.qa_defaults || {};

return scenario.steps.map((step, index) => ({
  json: {
    run_id: scenario.run_id,
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    phone: step.phone || scenario.phone,
    step_index: index + 1,
    total_steps: scenario.steps.length,
    text: step.text,
    message_id: step.message_id || scenarioDefaults.message_id || null,
    message_type: step.message_type || scenarioDefaults.message_type || "text",
    attachments: step.attachments || scenarioDefaults.attachments || [],
    lead: step.lead || scenarioDefaults.lead || null,
    expect: step.expect || {},
    source_metadata: {
      ...(scenarioDefaults.source_metadata || {}),
      ...(step.source_metadata || {})
    },
    routing: step.routing || scenarioDefaults.routing || null,
    organization: step.organization || scenarioDefaults.organization || null,
    agent: step.agent || scenarioDefaults.agent || null,
    channel_config: step.channel_config || scenarioDefaults.channel_config || null,
    whatsapp_number: step.whatsapp_number || scenarioDefaults.whatsapp_number || null,
    wait_ms: step.wait_ms || scenarioDefaults.wait_ms || 3500,
    expected_outcome: scenario.expected_outcome || triggerData.expected_outcome || null
  }
}));
