-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
-- Nodo:        DB_Update_Appointment_Cancelled
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.appointments
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  cancel_reason = NULLIF('{{ ($json.execution_context.cancellation_reason || "cancelled_by_client").replace(/'/g, "''") }}', '')
WHERE id = {{ $json.id }}
RETURNING
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  description,
  status,
  cancelled_at,
  cancel_reason;
