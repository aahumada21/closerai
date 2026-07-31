-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
-- Nodo:        DB_Cancel_Appointment_Followups
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH updated AS (
UPDATE public.followups
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  skipped_reason = 'appointment_cancelled'
WHERE lead_id = '{{ $json.execution_context.lead_id }}'::uuid
  AND status = 'pending'
  AND (
    metadata->>'appointment_event_id' = '{{ $json.event_id }}'
    OR followup_type IN (
      'appointment_reminder_1d',
      'appointment_reminder_1h',
      'pre_service_instructions_24h',
      'notify_on_the_way_30m',
      'post_service_review_24h',
      'post_service_referral_72h'
    )
  )
RETURNING id, lead_id, followup_type, status, cancelled_at
)
SELECT count(*) AS cancelled_followups_count FROM updated;
