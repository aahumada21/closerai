-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 2 lead_loader  (workflow id f5383ae7-dd2e-4177-9875-c6dcff27e3d5)
-- Nodo:        db_load_active_appointment
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT id, status, start_at, summary, cancelled_at
FROM public.appointments
WHERE conversation_id = '{{ $node["db_upsert_lead"].json["id"] }}'::uuid
  AND status IN ('confirmed', 'pending', 'booked')
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
