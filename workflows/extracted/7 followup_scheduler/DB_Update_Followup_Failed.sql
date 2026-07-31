-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Update_Followup_Failed
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE followups
SET
  status = 'failed',
  skipped_reason = 'send_outbound_message_failed',
  failed_at = NOW()
WHERE id = '{{ $json.followup_id }}';
