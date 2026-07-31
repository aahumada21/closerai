// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        ask_payment_preference_prep
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = (data.context_packet && data.context_packet.state) || {};
function firstValue() {
  for (var i = 0; i < arguments.length; i++) {
    var v = arguments[i];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}
const payloadObject = {
  ...data,
  execution_context: {
    ...ctx,
    lead_id: firstValue(ctx.lead_id, data.context_packet && data.context_packet.lead && data.context_packet.lead.id, data.lead_id),
    phone: firstValue(ctx.phone, data.context_packet && data.context_packet.lead && data.context_packet.lead.phone, data.phone),
    channel: firstValue(ctx.channel, data.context_packet && data.context_packet.lead && data.context_packet.lead.channel, data.channel, "whatsapp"),
    action: "ask_payment_preference",
    service_interest: firstValue(ctx.service_interest, data.decision && data.decision.state_update && data.decision.state_update.service_interest, state.service_interest),
    vehicle_type: firstValue(ctx.vehicle_type, data.decision && data.decision.state_update && data.decision.state_update.vehicle_type, state.vehicle_type),
    district: firstValue(ctx.district, data.decision && data.decision.state_update && data.decision.state_update.district, state.district),
    quoted_price: firstValue(ctx.quoted_price, state.quoted_price),
    state_update: (data.decision && data.decision.state_update) || {}
  },
  db_operations: ["messages", "lead_state"]
};
return [{ ...payloadObject, payload: JSON.stringify(payloadObject) }];
