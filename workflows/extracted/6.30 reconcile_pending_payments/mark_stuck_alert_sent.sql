-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.30 reconcile_pending_payments  (workflow id nRnyi0HdNMaYFFeC)
-- Nodo:        mark_stuck_alert_sent
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.lead_state
SET payment_stuck_alert_sent_at = NOW()
WHERE lead_id = '{{ $("find_pending_payments").item.json.lead_id }}'::uuid;
