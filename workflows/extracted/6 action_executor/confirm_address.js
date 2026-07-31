// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        confirm_address
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

const address = firstValue(
  ctx.address,
  data.decision?.address,
  data.decision?.state_update?.address,
  data.decision?.state_update?.service_address,
  state.service_address,
  conversation.latest_user_message
);

const addressReference = firstValue(
  ctx.address_reference,
  data.decision?.address_reference,
  data.decision?.state_update?.address_reference,
  state.address_reference
);

return [{
  lead_id: ctx.lead_id,
  channel: ctx.channel || "whatsapp",
  phone: ctx.phone || data.context_packet?.lead?.phone || null,

  address,
  address_reference: addressReference,

  service_interest: ctx.service_interest || state.service_interest || null,
  vehicle_type: ctx.vehicle_type || state.vehicle_type || null,
  district: ctx.district || state.district || null,

  execution_context: ctx,
  context_packet: data.context_packet || {},
  decision: data.decision || {},
  state_update: data.state_update || {},
  execution_meta: data.execution_meta || {},

  notes: [
    ...(data.notes || []),
    "confirm_address_parent_payload_prepared"
  ]
}];
