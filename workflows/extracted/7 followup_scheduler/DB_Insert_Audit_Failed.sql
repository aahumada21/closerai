-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Insert_Audit_Failed
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO audit_logs (
  flow_name,
  lead_id,
  channel,
  meta,
  created_at
)
VALUES (
  'followup_scheduler',
  '{{ $json.lead_id || null }}',
  '{{ $json.channel || null }}',
  jsonb_build_object(
    'type', 'followup_failed',
    'followup_id', '{{ $json.followup_id || null }}',
    'reason', 'send_outbound_message_failed'
  ),
  NOW()
);
