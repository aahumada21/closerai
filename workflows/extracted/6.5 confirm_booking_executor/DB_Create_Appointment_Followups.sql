-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
-- Nodo:        DB_Create_Appointment_Followups
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO followups (
  lead_id,
  followup_type,
  message_template_key,
  scheduled_for,
  status,
  metadata,
  dedupe_key,
  created_at
)
SELECT *
FROM (
  VALUES
  (
    '{{ $json.execution_context.lead_id }}'::uuid,
    'appointment_reminder_1d',
    'appointment_reminder_1d',
    '{{ $json.appointment_payload.start_at }}'::timestamptz - interval '24 hours',
    'pending',
    jsonb_build_object(
      'source', 'confirm_booking',
      'appointment_event_id', '{{ $json.appointment_payload.event_id }}',
      'appointment_start_at', '{{ $json.appointment_payload.start_at }}'
    ),
    '{{ $json.execution_context.lead_id }}__appointment_reminder_1d__{{ $json.appointment_payload.event_id }}',
    NOW()
  ),
  (
    '{{ $json.execution_context.lead_id }}'::uuid,
    'appointment_reminder_1h',
    'appointment_reminder_1h',
    '{{ $json.appointment_payload.start_at }}'::timestamptz - interval '1 hour',
    'pending',
    jsonb_build_object(
      'source', 'confirm_booking',
      'appointment_event_id', '{{ $json.appointment_payload.event_id }}',
      'appointment_start_at', '{{ $json.appointment_payload.start_at }}'
    ),
    '{{ $json.execution_context.lead_id }}__appointment_reminder_1h__{{ $json.appointment_payload.event_id }}',
    NOW()
  ),
  (
    '{{ $json.execution_context.lead_id }}'::uuid,
    'post_service_review_24h',
    'post_service_review_24h',
    '{{ $json.appointment_payload.end_at }}'::timestamptz + interval '24 hours',
    'pending',
    jsonb_build_object(
      'source', 'confirm_booking',
      'appointment_event_id', '{{ $json.appointment_payload.event_id }}',
      'appointment_end_at', '{{ $json.appointment_payload.end_at }}'
    ),
    '{{ $json.execution_context.lead_id }}__post_service_review_24h__{{ $json.appointment_payload.event_id }}',
    NOW()
  )
) AS v(
  lead_id,
  followup_type,
  message_template_key,
  scheduled_for,
  status,
  metadata,
  dedupe_key,
  created_at
)
WHERE scheduled_for > NOW()
ON CONFLICT (dedupe_key) DO NOTHING;
