-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
-- Nodo:        DB buscar respuesta outbound chat
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH lead_ref AS (
  SELECT id
  FROM public.leads
  WHERE
    phone = '{{ $("build_normalized_event").first().json.phone }}'
    OR external_id = '{{ $("build_normalized_event").first().json.phone }}'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  m.content,
  m.created_at,
  m.status,
  m.channel
FROM public.messages m
JOIN lead_ref l ON l.id = m.lead_id
WHERE
  m.direction = 'outbound'
  AND m.channel = 'n8n_chat'
  AND m.created_at >= NOW() - INTERVAL '2 minutes'
ORDER BY m.created_at DESC
LIMIT 1;
