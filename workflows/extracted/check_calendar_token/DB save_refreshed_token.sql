-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: check_calendar_token  (workflow id lqVjuXxseowt8UKo)
-- Nodo:        DB save_refreshed_token
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE google_calendar_connections SET access_token='{{ $json.access_token }}', access_token_expires_at=NOW()+INTERVAL '1 hour', updated_at=NOW() WHERE agent_id='{{ $("validate_auth_header").first().json.agent_id }}'::uuid;
