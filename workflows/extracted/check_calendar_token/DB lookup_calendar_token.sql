-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: check_calendar_token  (workflow id lqVjuXxseowt8UKo)
-- Nodo:        DB lookup_calendar_token
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT access_token, refresh_token, access_token_expires_at FROM google_calendar_connections WHERE agent_id = '{{ $json.agent_id }}'::uuid LIMIT 1;
