-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        clear_lead_state_pending_hold
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.lead_state
SET booking_date = NULL,
    booking_time = NULL,
    slot_id = NULL,
    availability_confirmed = false,
    flow_order_id = NULL,
    flow_payment_url = NULL,
    payment_status = NULL,
    pending_booking_data = NULL,
    last_bot_action = 'payment_hold_expired',
    updated_at = NOW()
WHERE lead_id = '{{ $("find_expired_holds").item.json.lead_id }}'::uuid;
