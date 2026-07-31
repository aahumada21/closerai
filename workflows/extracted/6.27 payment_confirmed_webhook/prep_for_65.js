// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
// Nodo:        prep_for_65
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $json;
const ctx = d.execution_context || {};
const pending = d.pending_booking || {};
const payloadObj = {
  ...d,
  execution_context: {
    lead_id: ctx.lead_id || pending.lead_id,
    channel: ctx.channel || pending.channel || "whatsapp",
    phone: ctx.phone || pending.phone,
    action: "confirm_booking",
    booking_date: ctx.booking_date || pending.booking_date,
    booking_time: ctx.booking_time || pending.booking_time,
    slot_id: ctx.slot_id || pending.slot_id,
    service_interest: ctx.service_interest || pending.service_interest,
    vehicle_type: ctx.vehicle_type || pending.vehicle_type,
    district: ctx.district || pending.district,
    duration_minutes: ctx.duration_minutes || pending.duration_minutes || 120,
    calendar_id: ctx.calendar_id || pending.calendar_id || "primary",
    service_address: ctx.service_address || pending.service_address,
    address_reference: ctx.address_reference || pending.address_reference,
    address_confirmed: true,
    availability_confirmed: true,
    state_update: { payment_status: "paid", pending_booking_data: null },
    original_payment_message: d.message_to_send
  },
  db_operations: ["appointments", "messages", "lead_state"]
};
return [{ ...payloadObj, payload: JSON.stringify(payloadObj) }];
