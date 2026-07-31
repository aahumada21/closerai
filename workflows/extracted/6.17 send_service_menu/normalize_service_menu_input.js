// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.17 send_service_menu  (workflow id e974cd1e-5cf1-4634-9e86-9628cab0c1a5)
// Nodo:        normalize_service_menu_input
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
  throw new Error("Missing lead_id in send_service_menu");
}

if (!channel) {
  throw new Error("Missing channel in send_service_menu");
}

const normalizedExecutionContext = {
  ...ctx,
  lead_id: leadId,
  channel,
  phone,
  action: "send_service_menu",

  service_interest: firstValue(ctx.service_interest, state.service_interest),
  vehicle_type: firstValue(ctx.vehicle_type, state.vehicle_type),
  district: firstValue(ctx.district, state.district)
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
