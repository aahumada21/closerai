-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: webchat_outbound_adapter  (workflow id FQ876D7itp35JrSt)
-- Nodo:        DB poll_outbound_messages
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH lead_ref AS (
  SELECT id
  FROM public.leads
  WHERE channel = 'webchat'
    AND external_id = ANY(ARRAY[{{ ($json.lead_external_ids || []).map(id => "'" + String(id).replace(/'/g, "''") + "'").join(',') }}]::text[])
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT m.id, m.content, m.created_at
FROM public.messages m
JOIN lead_ref l ON l.id = m.lead_id
WHERE m.direction = 'outbound'
  AND m.channel = 'webchat'
  AND m.created_at > '{{ $json.since }}'::timestamptz
ORDER BY m.created_at ASC
LIMIT 50;
