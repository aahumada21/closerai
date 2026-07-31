-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: get_valid_calendar_token  (workflow id bP1pWj4IkF5wbjMN)
-- Nodo:        DB mark_disconnected
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE agents SET google_calendar_connected=false, updated_at=NOW() WHERE id='{{ $("check_token_validity").first().json.agent_id }}'::uuid;
