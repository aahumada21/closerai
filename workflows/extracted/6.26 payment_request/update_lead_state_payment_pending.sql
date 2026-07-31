-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
-- Nodo:        update_lead_state_payment_pending
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE lead_state SET payment_status='pending', flow_order_id='{{ $("build_payment_message").first().json.flow_order_id }}', flow_payment_url='{{ $("build_payment_message").first().json.payment_url }}', last_bot_action='payment_link_sent', updated_at=NOW() WHERE lead_id='{{ $("build_payment_message").first().json.execution_context.lead_id }}'::uuid;
