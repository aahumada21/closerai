-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
-- Nodo:        DB_Check_Active_Appointment_For_Reschedule
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  description,
  status,
  service_address,
  address_reference
FROM public.appointments
WHERE status IN ('confirmed', 'pending')
  AND start_at >= NOW()
  AND (
    conversation_id = NULLIF('{{ $json.lead_id }}', '')::uuid
    OR (
      NULLIF('{{ $json.slot_id }}', '') IS NOT NULL
      AND event_id = NULLIF('{{ $json.slot_id }}', '')
    )
    OR (
      NULLIF('{{ $json.lead_id }}', '') IS NOT NULL
      AND COALESCE(description, '') ILIKE '%' || NULLIF('{{ $json.lead_id }}', '') || '%'
    )
  )
ORDER BY
  CASE
    WHEN conversation_id = NULLIF('{{ $json.lead_id }}', '')::uuid THEN 0
    WHEN NULLIF('{{ $json.slot_id }}', '') IS NOT NULL AND event_id = NULLIF('{{ $json.slot_id }}', '') THEN 1
    ELSE 2
  END,
  start_at ASC
LIMIT 1;
