-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Get_Due_Followups
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  f.id,
  f.lead_id,
  f.scheduled_for,
  f.status,
  f.created_at
FROM followups f
WHERE f.status = 'pending'
  AND f.scheduled_for <= NOW()
ORDER BY f.scheduled_for ASC
LIMIT 100;
