-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
-- Nodo:        DB_Check_Active_Appointment_For_Cancel
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH sleep_if_needed AS (
  SELECT pg_sleep(
    CASE WHEN stage = 'booked_pending' THEN 8 ELSE 0 END
  )
  FROM public.lead_state
  WHERE lead_id = $1::uuid
  LIMIT 1
)
SELECT
  a.id,
  a.event_id,
  a.conversation_id,
  a.start_at,
  a.end_at,
  a.summary,
  a.description,
  a.status
FROM public.appointments a
CROSS JOIN sleep_if_needed
WHERE a.conversation_id = $1
  AND a.status IN ('confirmed', 'pending')
  AND a.start_at >= NOW()
  AND ($2::int IS NULL OR a.id = $2::int)
ORDER BY a.start_at ASC
LIMIT 1;
