-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 8.0 human_handof  (workflow id 2360b175-88ae-483d-8551-b2aa36c1c625)
-- Nodo:        update_handoff_notification_status
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.handoff_cases
SET
  notification_sent = true,
  notification_sent_at = NOW(),
  notified_at = NOW(),
  notification_channel = 'email',
  updated_at = NOW()
WHERE id = '{{ $("insert_handoff_case").first().json.id }}'
RETURNING *;
