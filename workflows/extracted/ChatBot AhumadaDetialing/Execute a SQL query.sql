-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: ChatBot AhumadaDetialing  (workflow id 2b2069db-55b3-4530-8b62-9e2c07a34651)
-- Nodo:        Execute a SQL query
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO appointments
(event_id, conversation_id, start_at, end_at, summary, description, status)
VALUES
($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (event_id)
DO UPDATE SET
  conversation_id = EXCLUDED.conversation_id,
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  status = EXCLUDED.status;
