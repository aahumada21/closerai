-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
-- Nodo:        Execute a SQL query
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.appointments
SET
  start_at = '{{ $json.slot_start_at }}'::timestamptz,
  end_at = '{{ $json.slot_end_at }}'::timestamptz,
  status = 'confirmed',
  rescheduled_at = NOW(),
  rescheduled_from_event_id = COALESCE(rescheduled_from_event_id, event_id)
WHERE id = {{ $json.active_appointment.id }}
RETURNING *;
