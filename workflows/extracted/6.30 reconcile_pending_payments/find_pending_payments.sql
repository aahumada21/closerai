-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.30 reconcile_pending_payments  (workflow id nRnyi0HdNMaYFFeC)
-- Nodo:        find_pending_payments
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT ls.lead_id, ls.flow_order_id, ls.flow_payment_url, ls.payment_mode,
       ls.payment_stuck_alert_sent_at, l.phone, l.channel,
       m.sent_at,
       EXTRACT(EPOCH FROM (NOW() - m.sent_at)) / 86400.0 AS age_days
FROM public.lead_state ls
JOIN public.leads l ON l.id = ls.lead_id
JOIN LATERAL (
  SELECT MAX(created_at) AS sent_at
  FROM public.messages
  WHERE lead_id = ls.lead_id AND direction = 'outbound' AND content ILIKE '%Monto: $%'
) m ON true
WHERE ls.flow_order_id IS NOT NULL AND ls.flow_order_id <> ''
  AND ls.payment_status = 'pending'
  AND m.sent_at IS NOT NULL;
