-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1 qa_conversation_test_runner  (workflow id e52fdb10-dbcb-4f10-97f2-ef6248ca2982)
-- Nodo:        load_qa_scenarios_from_temp
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
FROM public.qa_test_scenarios_temp
WHERE enabled = true
  AND (
    '{{$json.scenario_key}}' = ''
    OR scenario_key = '{{$json.scenario_key}}'
  )
  AND (
    '{{$json.scenario_key}}' <> ''
    OR scenario_key LIKE '{{$json.temp_prefix}}%'
  )
ORDER BY
  priority ASC,
  scenario_key ASC;
