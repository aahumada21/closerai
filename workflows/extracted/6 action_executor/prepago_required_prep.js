// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        prepago_required_prep
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = (data.context_packet && data.context_packet.state) || {};
const pending = data.pending_booking_data || {};
function fv() {
  for (var i = 0; i < arguments.length; i++) {
    var v = arguments[i];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}
const lead_id = fv(ctx.lead_id, data.context_packet && data.context_packet.lead && data.context_packet.lead.id);
const phone = fv(ctx.phone, data.context_packet && data.context_packet.lead && data.context_packet.lead.phone);
const channel = fv(ctx.channel, "whatsapp");
const bookingDate = fv(pending.booking_date, ctx.booking_date, state.booking_date);
const bookingTime = fv(pending.booking_time, ctx.booking_time, state.booking_time);
const payloadObject = {
  ...data, payment_for_mode: "prepago_required",
  execution_context: {
    ...ctx, lead_id, phone, channel, action: "payment_request",
    service_interest: fv(pending.service_interest, ctx.service_interest, state.service_interest),
    vehicle_type: fv(pending.vehicle_type, ctx.vehicle_type, state.vehicle_type),
    district: fv(pending.district, ctx.district, state.district),
    booking_date: bookingDate, booking_time: bookingTime,
    slot_id: fv(pending.slot_id, ctx.slot_id),
    calendar_id: fv(pending.calendar_id, ctx.calendar_id),
    duration_minutes: fv(pending.duration_minutes, ctx.duration_minutes) || 120,
    service_address: fv(pending.service_address, ctx.service_address, ctx.address),
    quoted_price: fv(ctx.quoted_price, state.quoted_price),
    payment_mode: "prepago_required", payment_preference: "prepago",
    state_update: { ...(data.state_update || {}), pending_booking_data: pending,
      payment_mode: "prepago_required", payment_preference: "prepago", last_bot_action: "payment_link_pending" }
  },
  db_operations: ["messages", "lead_state"]
};
return [{ ...payloadObject, payload: JSON.stringify(payloadObject) }];
