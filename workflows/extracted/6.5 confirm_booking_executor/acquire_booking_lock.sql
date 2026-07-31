-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
-- Nodo:        acquire_booking_lock
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.lead_state
SET stage = 'booked_pending', updated_at = NOW()
WHERE lead_id = '{{ $json.execution_context.lead_id }}'::uuid
  AND (stage NOT IN ('booked','booked_pending','post_service')
    OR (stage='booked_pending' AND updated_at < NOW() - INTERVAL '5 minutes'))
RETURNING lead_id::text AS lock_lead_id;
