-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
-- Nodo:        update_payment_confirmed
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE lead_state SET payment_status='paid', last_bot_action='payment_confirmed', updated_at=NOW() WHERE lead_id='{{ $json.lead_id }}' AND payment_status IS DISTINCT FROM 'paid'
