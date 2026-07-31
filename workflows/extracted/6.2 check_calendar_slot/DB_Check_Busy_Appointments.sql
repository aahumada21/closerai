-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.2 check_calendar_slot  (workflow id 9b16489e-ce39-4213-ab5d-270d035fa1e0)
-- Nodo:        DB_Check_Busy_Appointments
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  COALESCE(
    jsonb_agg(
      jsonb_build_object('event_id', event_id, 'start_at', start_at, 'end_at', end_at, 'status', status)
    ),
    '[]'::jsonb
  ) AS busy_events
FROM public.appointments
WHERE status IN ('confirmed', 'pending')
  AND start_at < '{{ $json.slot_end_at }}'::timestamptz
  AND end_at > '{{ $json.slot_start_at }}'::timestamptz;
