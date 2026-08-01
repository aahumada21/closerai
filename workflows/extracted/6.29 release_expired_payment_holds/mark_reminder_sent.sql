-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        mark_reminder_sent
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.appointments
SET payment_hold_reminder_sent_at = NOW()
WHERE id = {{ $("find_holds_needing_reminder").item.json.appointment_id }};
