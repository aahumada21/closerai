-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
-- Nodo:        db Guardar Numero
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO public.test_chat_sessions (
  chat_session_id,
  assigned_phone,
  assigned_name,
  channel,
  updated_at
)
VALUES (
  '{{ $json.chat_session_id.replace(/'/g, "''") }}',
  '{{ $json.requested_phone.replace(/'/g, "''") }}',
  'Test Chat {{ $json.requested_phone.replace(/'/g, "''") }}',
  'n8n_chat',
  now()
)
ON CONFLICT (chat_session_id)
DO UPDATE SET
  assigned_phone = EXCLUDED.assigned_phone,
  assigned_name = EXCLUDED.assigned_name,
  updated_at = now()
RETURNING *;
