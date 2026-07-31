-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Lock_Followup
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE followups
SET
  status = 'processing',
  processing_started_at = NOW()
WHERE id = '{{ $json.id }}'
  AND status = 'pending'
RETURNING
  id AS followup_id,
  lead_id,
  scheduled_for,
  status;
