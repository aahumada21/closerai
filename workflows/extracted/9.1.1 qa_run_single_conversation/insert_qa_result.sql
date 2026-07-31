-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
-- Nodo:        insert_qa_result
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO public.qa_test_results (
  run_id,
  scenario_id,
  scenario_name,
  step_index,
  text_sent,
  passed,
  errors,
  lead_id,
  state_snapshot,
  bot_response,
  audit_snapshot,
  created_at
)
VALUES (
  NULLIF('{{ ($json.run_id || "").replace(/'/g, "''") }}', ''),

  NULLIF('{{ ($json.scenario_id || "").replace(/'/g, "''") }}', ''),

  NULLIF('{{ ($json.scenario_name || "").replace(/'/g, "''") }}', ''),

  {{ Number($json.step_index || 0) }},

  NULLIF('{{ ($json.text_sent || "").replace(/'/g, "''") }}', ''),

  {{ $json.passed === true ? 'true' : 'false' }},

  '{{ JSON.stringify($json.errors || []).replace(/'/g, "''") }}'::jsonb,

  NULLIF('{{ ($json.lead_id || "").replace(/'/g, "''") }}', '')::uuid,

  '{{ JSON.stringify($json.state_snapshot || {}).replace(/'/g, "''") }}'::jsonb,

  NULLIF('{{ ($json.bot_response || "").replace(/'/g, "''") }}', ''),

  '{{ JSON.stringify($json.audit_snapshot || {}).replace(/'/g, "''") }}'::jsonb,

  NOW()
)
RETURNING
  id,
  run_id,
  scenario_id,
  step_index,
  passed,
  created_at;
