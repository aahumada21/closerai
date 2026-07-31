-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 8.1 reactivate_bot_after_handoff  (workflow id 0d6e1092-a477-4935-8607-10fa8e6947f0)
-- Nodo:        DB_Insert_Reactivation_Audit_Log
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
  created_at
)
VALUES (
  '{{ ($json.flow_name || "reactivate_bot_after_handoff").replace(/'/g, "''") }}',
  NULLIF('{{ ($json.lead_id || "").replace(/'/g, "''") }}', ''),
  '{{ ($json.channel || "internal").replace(/'/g, "''") }}',
  NULLIF('{{ ($json.stage_before || "").replace(/'/g, "''") }}', ''),
  NULL,
  '{{ JSON.stringify($json.allowed_actions || []).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.decision || {}).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.meta || {}).replace(/'/g, "''") }}'::jsonb,
  NULL,
  NULLIF('{{ ($json.idempotency_key || "").replace(/'/g, "''") }}', ''),
  NOW()
)
RETURNING id;
