-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
-- Nodo:        DB_Cancel_Old_Appointment_Followups
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.followups
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  skipped_reason = 'appointment_rescheduled'
WHERE lead_id = '{{ $json.lead_id }}'::uuid
  AND status = 'pending'
  AND metadata->>'appointment_event_id' = '{{ $json.active_appointment.event_id }}';
