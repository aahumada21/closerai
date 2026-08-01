-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        mark_appointment_cancelled
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.appointments
SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'payment_hold_expired'
WHERE id = {{ $("find_expired_holds").item.json.appointment_id }};
