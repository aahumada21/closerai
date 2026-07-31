-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
-- Nodo:        find_lead_by_order
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT ls.lead_id, l.phone, l.channel, ls.pending_booking_data, ls.payment_mode, ls.payment_preference, ls.payment_status FROM lead_state ls JOIN leads l ON ls.lead_id = l.id WHERE ls.flow_order_id = '{{ $json.flowOrder }}' LIMIT 1
