-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
-- Nodo:        check_existing_calendar
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

=SELECT (SELECT calendar_id FROM public.google_calendar_connections WHERE agent_id = '{{ $("check_agent_valid").first().json.agent_id }}'::uuid) AS existing_calendar_id;
