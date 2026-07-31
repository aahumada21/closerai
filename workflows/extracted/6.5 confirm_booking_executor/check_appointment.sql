-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
-- Nodo:        check_appointment
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  description,
  status,
  created_at
FROM public.appointments
WHERE conversation_id = $1
  AND status IN ('confirmed', 'pending')
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
