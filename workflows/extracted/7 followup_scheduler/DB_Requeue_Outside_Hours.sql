-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Requeue_Outside_Hours
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE followups
SET
  status = 'pending',
  scheduled_for = CASE
    WHEN (NOW() AT TIME ZONE 'America/Santiago')::time < time '09:00'
    THEN ((NOW() AT TIME ZONE 'America/Santiago')::date + time '09:00') AT TIME ZONE 'America/Santiago'
    ELSE (((NOW() AT TIME ZONE 'America/Santiago')::date + 1) + time '09:00') AT TIME ZONE 'America/Santiago'
  END,
  skipped_reason = 'rescheduled_outside_allowed_hours'
WHERE id = '{{ $json.followup_id }}'
  AND '{{ $json.skip_reason }}' = 'outside_allowed_hours';
