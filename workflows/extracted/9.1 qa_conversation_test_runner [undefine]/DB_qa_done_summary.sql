-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1 qa_conversation_test_runner  (workflow id undefined)
-- Nodo:        DB_qa_done_summary
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT count(DISTINCT scenario_id) FILTER (WHERE llm_passed) AS passed, count(DISTINCT scenario_id) AS total FROM public.qa_test_results WHERE run_id LIKE '{{ $json.run_prefix }}%';
