-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Insert_Audit_Sent
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
  '{{ $("IF_Send_Success").first().json.lead_id || null }}',
  '{{ $("IF_Send_Success").first().json.channel || null }}',
  jsonb_build_object(
    'type', 'followup_sent',
    'followup_id', '{{ $("IF_Send_Success").first().json.followup_id || null }}',
    'message', '{{ (( $("IF_Send_Success").first().json.outbound_message || $("IF_Send_Success").first().json.message || "" )).replace(/'/g, "''") }}',
    'source', 'followup_scheduler'
  ),
  NOW()
);
