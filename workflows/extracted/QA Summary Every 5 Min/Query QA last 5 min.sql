-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: QA Summary Every 5 Min  (workflow id tL57zrWhC3irrlTB)
-- Nodo:        Query QA last 5 min
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT count(*)::int AS total_completados, count(*) FILTER (WHERE llm_passed = true)::int AS total_pasados, count(*) FILTER (WHERE llm_passed = false AND llm_notes NOT LIKE '%No se pudo%')::int AS total_fallidos FROM qa_test_results WHERE created_at > NOW() - INTERVAL '5 minutes' AND llm_passed IS NOT NULL;
