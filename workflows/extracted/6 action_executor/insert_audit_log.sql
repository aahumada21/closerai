-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
-- Nodo:        insert_audit_log
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
  outbound_message_id,
  created_at
)
VALUES (
  '{{ ($json.flow_name || "action_executor").replace(/'/g, "''") }}',

  NULLIF('{{ String($json.lead_id || "").replace(/'/g, "''") }}', '')::uuid,

  NULLIF('{{ String($json.channel || "").replace(/'/g, "''") }}', ''),

  NULLIF('{{ String($json.stage_before || "").replace(/'/g, "''") }}', ''),

  NULLIF('{{ String($json.latest_user_message || "").replace(/'/g, "''") }}', ''),

  '{{ JSON.stringify($json.allowed_actions || []).replace(/'/g, "''") }}'::jsonb,

  '{{ JSON.stringify($json.decision || {}).replace(/'/g, "''") }}'::jsonb,

  '{{ JSON.stringify($json.meta || {}).replace(/'/g, "''") }}'::jsonb,

  NULL,

  NULLIF('{{ String($json.idempotency_key || "").replace(/'/g, "''") }}', ''),

  NULLIF('{{ String($json.inbound_message_id || $json.execution_context?.inbound_message_id || "").replace(/'/g, "''") }}', ''),

  NULLIF('{{ String($json.outbound_message_id || "").replace(/'/g, "''") }}', '')::uuid,

  NOW()
)
ON CONFLICT (idempotency_key) DO UPDATE
SET
  decision = EXCLUDED.decision,
  meta = EXCLUDED.meta,
  outbound_message_id = COALESCE(EXCLUDED.outbound_message_id, audit_logs.outbound_message_id),
  inbound_message_id = COALESCE(EXCLUDED.inbound_message_id, audit_logs.inbound_message_id)
RETURNING
  id,
  flow_name,
  decision,
  meta,
  idempotency_key,
  inbound_message_id,
  outbound_message_id,
  created_at;
