// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        confirm_booking
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};

// El config global del negocio (agent_business_config) SIEMPRE manda sobre
// cualquier valor pegado en lead_state de una reserva anterior -- payment_mode
// es una decision de negocio, no algo que deba quedar fijo por lead para
// siempre. Antes, un lead que ya habia reservado una vez quedaba atascado
// usando el payment_mode VIEJO aunque el negocio cambiara su configuracion,
// incluso para una reserva nueva/distinta (bug real: 2do auto de un cliente
// use prepago_only heredado en vez de prepago_required, el modo activo real).
const paymentMode = (data.context_packet && data.context_packet.agent_business_config &&
   data.context_packet.agent_business_config.config &&
   data.context_packet.agent_business_config.config.payment_mode) ||
  ctx.payment_mode ||
  (data.context_packet && data.context_packet.state && data.context_packet.state.payment_mode) ||
  "both";

const isPrepagoreRequired = paymentMode === "prepago_required";

const bookingData = {
  lead_id: ctx.lead_id,
  channel: ctx.channel,
  service_interest: ctx.service_interest,
  vehicle_type: ctx.vehicle_type,
  district: ctx.district,
  booking_date: ctx.booking_date,
  booking_time: ctx.booking_time,
  slot_id: ctx.slot_id,
  availability_confirmed: ctx.availability_confirmed,
  duration_minutes: ctx.duration_minutes || 120,
  calendar_id: ctx.calendar_id || "primary",
  service_address: ctx.service_address || ctx.address || null,
  address_reference: ctx.address_reference || null,
  address_confirmed: ctx.address_confirmed === true
};

if (isPrepagoreRequired) {
  // Skip GCal booking — send payment link first via 6.26
  // GCal event will be created by 6.27 when Flow confirms payment
  const payloadObject = {
    ...data,
    db_operations: ["messages", "lead_state"],
    skip_calendar_booking: true,
    pending_booking_data: bookingData,
    booking_request: bookingData,
    state_update: {
      ...(ctx.state_update || {}),
      last_bot_action: "payment_link_pending",
      payment_mode: "prepago_required",
      payment_preference: "prepago",
      pending_booking_data: bookingData,
    }
  };
  return [{ ...payloadObject, payload: JSON.stringify(payloadObject) }];
}

// Normal booking flow (prepago_only, postpago_only, both)
const payloadObject = {
  ...data,
  db_operations: ["appointments", "messages", "lead_state"],
  booking_request: bookingData,
  state_update: {
    ...(ctx.state_update || {}),
    last_bot_action: "confirm_booking_in_progress"
  }
};

return [{
  ...payloadObject,
  payload: JSON.stringify(payloadObject)
}];
