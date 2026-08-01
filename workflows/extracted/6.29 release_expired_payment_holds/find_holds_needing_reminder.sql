-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        find_holds_needing_reminder
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT a.id AS appointment_id, a.conversation_id AS lead_id, l.phone, l.channel, ls.flow_payment_url
FROM public.appointments a
JOIN public.leads l ON l.id = a.conversation_id
JOIN public.lead_state ls ON ls.lead_id = a.conversation_id
WHERE a.status = 'pending_payment'
  AND a.payment_hold_reminder_sent_at IS NULL
  AND a.created_at < NOW() - INTERVAL '15 minutes'
  AND a.created_at >= NOW() - INTERVAL '25 minutes';
