// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.18 recommend_service  (workflow id dd796016-14dd-4845-8d96-84722bcf7bc5)
// Nodo:        normalize_recommend_service_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback = {}) {
  if (value && typeof value === "object") return value;

  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

const input = parseMaybeJson($json.payload, $json);

const ctx = input.execution_context || {};
const contextPacket = input.context_packet || {};
const lead = contextPacket.lead || {};
const state = contextPacket.state || {};
const conversation = contextPacket.conversation || {};
const decision = input.decision || {};
const decisionStateUpdate = decision.state_update || {};
const inputStateUpdate = input.state_update || {};

const leadId = firstValue(
  ctx.lead_id,
  lead.id,
  input.lead_id
);

const channel = firstValue(
  ctx.channel,
  lead.channel,
  input.channel,
  "whatsapp"
);

const phone = firstValue(
  ctx.phone,
  lead.phone,
  input.phone
);

if (!leadId) {
  throw new Error("Missing lead_id in recommend_service");
}

if (!channel) {
  throw new Error("Missing channel in recommend_service");
}

const normalizedExecutionContext = {
  ...ctx,

  lead_id: leadId,
  channel,
  phone,
  action: "recommend_service",

  service_interest: firstValue(
    ctx.service_interest,
    decisionStateUpdate.service_interest,
    inputStateUpdate.service_interest,
    state.service_interest
  ),

  vehicle_type: firstValue(
    ctx.vehicle_type,
    decisionStateUpdate.vehicle_type,
    inputStateUpdate.vehicle_type,
    state.vehicle_type
  ),

  district: firstValue(
    ctx.district,
    decisionStateUpdate.district,
    inputStateUpdate.district,
    state.district
  ),

  customer_need: firstValue(
    ctx.customer_need,
    decision.customer_need,
    decisionStateUpdate.customer_need,
    inputStateUpdate.customer_need,
    conversation.latest_user_message
  )
};

return [{
  ...input,

  lead_id: leadId,
  channel,
  phone,

  execution_context: normalizedExecutionContext,
  context_packet: contextPacket,
  decision,

  state_update: {
    ...decisionStateUpdate,
    ...inputStateUpdate
  }
}];
