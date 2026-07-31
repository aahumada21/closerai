-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
-- Nodo:        db BuscarNumero
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT *
FROM public.test_chat_sessions
WHERE chat_session_id = '{{ $json.chat_session_id.replace(/'/g, "''") }}'
LIMIT 1;
