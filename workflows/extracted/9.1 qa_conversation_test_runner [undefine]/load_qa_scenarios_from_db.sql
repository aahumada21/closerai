-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1 qa_conversation_test_runner  (workflow id undefined)
-- Nodo:        load_qa_scenarios_from_db
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  scenario_key AS id,
  name,
  suite,
  priority,
  tags,
  steps,
  expected_outcome
FROM public.qa_test_scenarios
WHERE enabled = true
  AND (
    '{{$json.scenario_key}}' = ''
    OR scenario_key = '{{$json.scenario_key}}'
  )
ORDER BY
  priority ASC,
  scenario_key ASC;
