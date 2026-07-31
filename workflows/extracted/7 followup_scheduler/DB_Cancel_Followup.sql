-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Cancel_Followup
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE followups
SET
  status = '{{ $json.next_status || "cancelled" }}',
  skipped_reason = '{{ $json.skip_reason }}',
  cancelled_at = CASE
    WHEN '{{ $json.next_status || "cancelled" }}' = 'cancelled' THEN NOW()
    ELSE cancelled_at
  END
WHERE id = '{{ $json.followup_id }}'
  AND '{{ $json.skip_reason }}' <> 'outside_allowed_hours';
