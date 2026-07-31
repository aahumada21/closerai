// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        recommend_service
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = data.context_packet?.state || {};
const conversation = data.context_packet?.conversation || {};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

const payloadObject = {
  ...data,

  execution_context: {
    ...ctx,

    lead_id: firstValue(ctx.lead_id, data.context_packet?.lead?.id, data.lead_id),
    phone: firstValue(ctx.phone, data.context_packet?.lead?.phone, data.phone),
    channel: firstValue(ctx.channel, data.context_packet?.lead?.channel, data.channel, "whatsapp"),

    action: "recommend_service",

    service_interest: firstValue(
      ctx.service_interest,
      data.decision?.state_update?.service_interest,
      state.service_interest
    ),

    vehicle_type: firstValue(
      ctx.vehicle_type,
      data.decision?.state_update?.vehicle_type,
      state.vehicle_type
    ),

    district: firstValue(
      ctx.district,
      data.decision?.state_update?.district,
      state.district
    ),

    customer_need: firstValue(
      data.decision?.customer_need,
      data.decision?.state_update?.customer_need,
      conversation.latest_user_message
    )
  },

  db_operations: ["messages", "lead_state"]
};

return [{
  ...payloadObject,
  payload: JSON.stringify(payloadObject)
}];
