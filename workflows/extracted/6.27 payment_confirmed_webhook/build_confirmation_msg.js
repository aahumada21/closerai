// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
// Nodo:        build_confirmation_msg
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $("find_lead_by_order").first().json;
const leadId = d.lead_id || "";
const phone = d.phone || "";
const channel = d.channel || "whatsapp";

// Check if there is a pending booking to confirm in GCal (prepago_required mode)
const pendingBooking = d.pending_booking_data || null;
const isPrepagoreRequired = d.payment_mode === "prepago_required" || (pendingBooking && pendingBooking.lead_id);

let msg;
let stateUpdate;

if (isPrepagoreRequired && pendingBooking) {
  const dateText = (pendingBooking.booking_date && pendingBooking.booking_time)
    ? " para el " + pendingBooking.booking_date + " a las " + pendingBooking.booking_time
    : "";
  msg = "Pago confirmado! Gracias. Tu turno" + dateText + " esta reservado. Te esperamos!";
  stateUpdate = {
    payment_status: "paid",
    last_bot_action: "booking_confirmed_after_payment",
    pending_booking_data: null
  };
} else {
  msg = "Pago confirmado! Gracias. Tu reserva esta asegurada. Te esperamos en la fecha acordada!";
  stateUpdate = { payment_status: "paid", last_bot_action: "payment_confirmed" };
}

const payloadObj = {
  channel,
  phone,
  message: msg,
  execution_context: {
    lead_id: leadId, phone, channel,
    action: isPrepagoreRequired && pendingBooking ? "confirm_booking_after_payment" : "payment_confirmed",
    message: msg,
    state_update: stateUpdate,
    // Pass booking data for GCal creation (picked up by Call 6.5 if needed)
    booking_date: pendingBooking && pendingBooking.booking_date,
    booking_time: pendingBooking && pendingBooking.booking_time,
    slot_id: pendingBooking && pendingBooking.slot_id,
    service_interest: pendingBooking && pendingBooking.service_interest,
    vehicle_type: pendingBooking && pendingBooking.vehicle_type,
    district: pendingBooking && pendingBooking.district,
    duration_minutes: (pendingBooking && pendingBooking.duration_minutes) || 120,
    calendar_id: pendingBooking && pendingBooking.calendar_id,
    service_address: pendingBooking && pendingBooking.service_address,
    address_reference: pendingBooking && pendingBooking.address_reference,
    address_confirmed: pendingBooking && pendingBooking.address_confirmed,
    availability_confirmed: true
  },
  pending_booking: pendingBooking,
  has_pending_booking: !!(isPrepagoreRequired && pendingBooking),
  message_to_send: msg
};

return [{ ...payloadObj, payload: JSON.stringify(payloadObj) }];
