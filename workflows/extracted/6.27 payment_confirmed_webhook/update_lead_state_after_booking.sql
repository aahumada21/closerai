-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
-- Nodo:        update_lead_state_after_booking
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE lead_state SET stage = 'booked', last_bot_action = 'booking_confirmed_after_payment', pending_booking_data = NULL, payment_status = 'paid', updated_at = NOW() WHERE lead_id = '{{ \.execution_context.lead_id }}'::uuid
