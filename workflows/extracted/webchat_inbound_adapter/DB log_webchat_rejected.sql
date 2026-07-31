-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: webchat_inbound_adapter  (workflow id 28uyrvO73tVxgdM2)
-- Nodo:        DB log_webchat_rejected
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
  NULL,
  NULL,
  'webchat',
  'webchat_widget',
  NULLIF('{{ String($json.external_channel_id || "").replace(/'/g, "''") }}', ''),
  'webchat_rejected',
  NULLIF('{{ String($json.message_id || "").replace(/'/g, "''") }}', ''),
  NULLIF('{{ String($json.lead_id || "").replace(/'/g, "''") }}', ''),
  '{{ String($json.idempotency_key || "").replace(/'/g, "''") }}',
  false,
  NULLIF('{{ String($json.not_processed_reason || "webchat_rejected").replace(/'/g, "''") }}', ''),
  '{{ JSON.stringify($json || {}).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.raw || {}).replace(/'/g, "''") }}'::jsonb
)
ON CONFLICT (idempotency_key) DO UPDATE SET
  normalized_ok = false,
  error = EXCLUDED.error,
  normalized_event = EXCLUDED.normalized_event,
  raw = EXCLUDED.raw,
  event_received_at = now()
RETURNING id, event_type, normalized_ok, error;
