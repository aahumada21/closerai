-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
-- Nodo:        DB_Create_Rescheduled_Appointment_Followups
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO public.followups (
  lead_id,
  followup_type,
  message_template_key,
  scheduled_for,
  status,
  metadata,
  dedupe_key,
  created_at
)
VALUES
(
  '{{ $json.lead_id }}'::uuid,
  'pre_service_instructions_24h',
  'pre_service_instructions_24h',
  '{{ $json.slot_start_at }}'::timestamptz - interval '24 hours',
  'pending',
  jsonb_build_object(
    'source', 'reschedule_booking',
    'appointment_event_id', '{{ $json.active_appointment.event_id }}'
  ),
  '{{ $json.lead_id }}__pre_service_instructions_24h__{{ $json.active_appointment.event_id }}__rescheduled',
  NOW()
),
(
  '{{ $json.lead_id }}'::uuid,
  'appointment_reminder_1h',
  'appointment_reminder_1h',
  '{{ $json.slot_start_at }}'::timestamptz - interval '1 hour',
  'pending',
  jsonb_build_object(
    'source', 'reschedule_booking',
    'appointment_event_id', '{{ $json.active_appointment.event_id }}'
  ),
  '{{ $json.lead_id }}__appointment_reminder_1h__{{ $json.active_appointment.event_id }}__rescheduled',
  NOW()
),
(
  '{{ $json.lead_id }}'::uuid,
  'post_service_review_24h',
  'post_service_review_24h',
  '{{ $json.slot_end_at }}'::timestamptz + interval '24 hours',
  'pending',
  jsonb_build_object(
    'source', 'reschedule_booking',
    'appointment_event_id', '{{ $json.active_appointment.event_id }}'
  ),
  '{{ $json.lead_id }}__post_service_review_24h__{{ $json.active_appointment.event_id }}__rescheduled',
  NOW()
)
ON CONFLICT (dedupe_key) DO NOTHING;
