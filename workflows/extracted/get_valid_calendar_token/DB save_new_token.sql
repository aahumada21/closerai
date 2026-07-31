-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: get_valid_calendar_token  (workflow id bP1pWj4IkF5wbjMN)
-- Nodo:        DB save_new_token
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE agents SET google_access_token='{{ $json.access_token }}', google_token_expires_at='{{ $json.expires_at }}'::timestamptz, updated_at=NOW() WHERE id='{{ $json.agent_id }}'::uuid;
