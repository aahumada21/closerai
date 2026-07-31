-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
-- Nodo:        DB_Create_Quote_Followups
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
VALUES
(
  '{{ $json.execution_context.lead_id }}',
  'quote_no_reply_24h',
  'quote_no_reply_24h',
  NOW() + interval '24 hours',
  'pending',
  jsonb_build_object(
    'source', 'action_executor',
    'trigger_action', 'send_quote',
    'quote_id', '{{ $json.quote_db_id || "" }}',
    'service_interest', '{{ $json.execution_context.service_interest || "" }}',
    'vehicle_type', '{{ $json.execution_context.vehicle_type || "" }}',
    'district', '{{ $json.execution_context.district || "" }}'
  ),
  '{{ $json.execution_context.lead_id }}__quote_no_reply_24h__{{ $json.quote_db_id || "no_quote_id" }}',
  NOW()
),
(
  '{{ $json.execution_context.lead_id }}',
  'quote_no_reply_48h',
  'quote_no_reply_48h',
  NOW() + interval '48 hours',
  'pending',
  jsonb_build_object(
    'source', 'action_executor',
    'trigger_action', 'send_quote',
    'quote_id', '{{ $json.quote_db_id || "" }}',
    'service_interest', '{{ $json.execution_context.service_interest || "" }}',
    'vehicle_type', '{{ $json.execution_context.vehicle_type || "" }}',
    'district', '{{ $json.execution_context.district || "" }}'
  ),
  '{{ $json.execution_context.lead_id }}__quote_no_reply_48h__{{ $json.quote_db_id || "no_quote_id" }}',
  NOW()
)
ON CONFLICT (dedupe_key) DO NOTHING;
