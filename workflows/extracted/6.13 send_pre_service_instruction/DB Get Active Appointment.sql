-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.13 send_pre_service_instruction  (workflow id a9a040b3-31c0-459b-9c5e-aead2f7b9d28)
-- Nodo:        DB Get Active Appointment
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
  address_reference
FROM public.appointments
WHERE conversation_id = NULLIF('{{ $json.lead_id }}', '')::uuid
  AND status IN ('confirmed', 'pending')
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
