-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.0 qa_whatsapp_normalized_router  (workflow id 1badeb35-0335-4aaa-96a6-2e021376db8a)
-- Nodo:        audit_not_processed
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO public.audit_logs (
  flow_name,
  lead_id,
  channel,
  stage_before,
  latest_user_message,
  allowed_actions,
  decision,
  meta,
  llm,
  idempotency_key,
  inbound_message_id,
  created_at
)
VALUES (
  'qa_whatsapp_normalized_router',
  NULLIF('{{ String($json.source_metadata?.qa_db_lead_id || "").replace(/'/g, "''") }}', ''),
  '{{ String($json.channel || "whatsapp").replace(/'/g, "''") }}',
  NULL,
  '{{ String($json.text || "").replace(/'/g, "''") }}',
  '[]'::jsonb,
  jsonb_build_object(
    'action', 'not_processed',
    'source', 'channel_config_resolver',
    'reason', '{{ String($json.not_processed_reason || "agent_channel_not_found_or_inactive").replace(/'/g, "''") }}',
    'confidence', 1
  ),
  jsonb_build_object(
    'event_type', 'discarded_inbound_event',
    'reason', '{{ String($json.not_processed_reason || "agent_channel_not_found_or_inactive").replace(/'/g, "''") }}',
    'phone_number_id', NULLIF('{{ String($json.source_metadata?.phone_number_id || $json.routing?.phone_number_id || "").replace(/'/g, "''") }}', ''),
    'provider', '{{ String($json.source_metadata?.provider || $json.routing?.provider || "meta_whatsapp_cloud_api").replace(/'/g, "''") }}',
    'message_id', '{{ String($json.message_id || "").replace(/'/g, "''") }}',
    'lead_id', NULLIF('{{ String($json.source_metadata?.qa_db_lead_id || "").replace(/'/g, "''") }}', ''),
    'agent_resolution_error', '{{ String($json.source_metadata?.agent_resolution_error || $json.not_processed_reason || "agent_channel_not_found_or_inactive").replace(/'/g, "''") }}',
    'should_process', false,
    'source', '9.0 qa_whatsapp_normalized_router'
  ),
  NULL,
  '{{ ("qa_discard__" + String($json.source_metadata?.phone_number_id || $json.routing?.phone_number_id || "unknown") + "__" + String($json.message_id || Date.now())).replace(/'/g, "''") }}',
  '{{ String($json.message_id || "").replace(/'/g, "''") }}',
  NOW()
)
RETURNING
  true AS ok,
  false AS processed,
  '{{ String($json.not_processed_reason || "agent_channel_not_found_or_inactive").replace(/'/g, "''") }}' AS reason,
  'qa_whatsapp_normalized_router' AS source,
  'QA event not processed because no active agent channel was found.' AS message;
