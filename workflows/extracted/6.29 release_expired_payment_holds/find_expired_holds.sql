-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        find_expired_holds
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT a.id AS appointment_id, a.event_id, a.conversation_id AS lead_id,
       a.start_at, a.end_at, l.phone, l.channel
FROM public.appointments a
JOIN public.leads l ON l.id = a.conversation_id
WHERE a.status = 'pending_payment'
  AND a.created_at < NOW() - INTERVAL '30 minutes';
