-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: get_valid_calendar_token  (workflow id bP1pWj4IkF5wbjMN)
-- Nodo:        DB read_agent_tokens
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT google_access_token, google_refresh_token, google_token_expires_at FROM agents WHERE id = '{{ $json.agent_id }}'::uuid LIMIT 1;
