const scenario = $json;
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
    wait_ms: step.wait_ms || scenarioDefaults.wait_ms || 3500
  }
}));
