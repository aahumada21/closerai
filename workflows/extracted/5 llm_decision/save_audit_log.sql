-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
-- Nodo:        save_audit_log
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
  created_at
)
VALUES (
  '{{ ($json.flow_name || "").replace(/'/g, "''") }}',
  NULLIF('{{ ($json.lead_id || "").replace(/'/g, "''") }}', ''),
  NULLIF('{{ ($json.channel || "").replace(/'/g, "''") }}', ''),
  NULLIF('{{ ($json.stage_before || "").replace(/'/g, "''") }}', ''),
  NULLIF('{{ ($json.latest_user_message || "").replace(/'/g, "''") }}', ''),

  '{{ JSON.stringify($json.allowed_actions || []).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.decision || null).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.meta || {}).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.llm || {}).replace(/'/g, "''") }}'::jsonb,

  '{{ $json.created_at || new Date().toISOString() }}'::timestamptz
)
RETURNING id;
