-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 2.1 channel_config_resolver  (workflow id gYYvc3jTVgDnAB8K)
-- Nodo:        log_channel_event_resolution
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO public.channel_event_logs (
  organization_id,
  agent_id,
  channel,
  provider,
  external_channel_id,
  event_type,
  message_id,
  lead_id,
  idempotency_key,
  normalized_ok,
  error,
  normalized_event,
  raw
)
VALUES (
  NULLIF('{{ String($json.routing?.organization_id || "").replace(/'/g, "''") }}', '')::uuid,
  NULLIF('{{ String($json.routing?.agent_id || "").replace(/'/g, "''") }}', '')::uuid,
  '{{ String($json.routing?.channel || "whatsapp").replace(/'/g, "''") }}',
  '{{ String($json.routing?.provider || "meta_whatsapp_cloud_api").replace(/'/g, "''") }}',
  NULLIF('{{ String($json.routing?.external_channel_id || "").replace(/'/g, "''") }}', ''),
  '{{ String($json.audit?.event_type || "channel_config_discarded").replace(/'/g, "''") }}',
  NULLIF('{{ String($json.audit?.message_id || "").replace(/'/g, "''") }}', ''),
  NULLIF('{{ String($json.audit?.lead_id || "").replace(/'/g, "''") }}', ''),
  '{{ String($json.audit?.idempotency_key || "").replace(/'/g, "''") }}',
  {{ $json.should_process ? 'true' : 'false' }},
  NULLIF('{{ String($json.not_processed_reason || "").replace(/'/g, "''") }}', ''),
  '{{ JSON.stringify($json).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.input?.raw || {}).replace(/'/g, "''") }}'::jsonb
)
ON CONFLICT (idempotency_key) DO UPDATE SET
  normalized_ok = EXCLUDED.normalized_ok,
  error = EXCLUDED.error,
  normalized_event = EXCLUDED.normalized_event,
  raw = EXCLUDED.raw,
  event_received_at = now()
RETURNING id, event_type, normalized_ok, error;
