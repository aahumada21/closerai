// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.15 request_review  (workflow id 5f3cb9ae-9ff3-47ef-a7b9-40bc47c14b49)
// Nodo:        build_request_review_result
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

const input = $json;

const executionContext = parseMaybeJson(input.execution_context, {});
const contextPacket = parseMaybeJson(input.context_packet, {});
const decision = parseMaybeJson(input.decision, {});
const stateUpdate = parseMaybeJson(input.state_update, {});
const executionMeta = parseMaybeJson(input.execution_meta, {});

const state = contextPacket.state || {};

const leadId =
  input.lead_id ||
  executionContext.lead_id ||
  contextPacket.lead?.id ||
  null;

const phone =
  input.phone ||
  executionContext.phone ||
  contextPacket.lead?.phone ||
  null;

const channel =
  input.channel ||
  executionContext.channel ||
  contextPacket.lead?.channel ||
  "whatsapp";

if (!leadId) {
  throw new Error("Missing lead_id in request_review");
}

if (!phone) {
  throw new Error("Missing phone in request_review");
}

const reviewUrl =
  input.review_url ||
  decision.review_url ||
  decision.state_update?.review_url ||
  executionContext.review_url ||
  state.review_url ||
  "";

let message = "";

if (reviewUrl) {
  message =
    `Gracias por confiar en Ahumada Detailing. Si te gust el resultado, nos ayudara mucho que nos dejaras una resea aque:\n\n${reviewUrl}\n\nEso nos ayuda a seguir creciendo y a llegar a mas personas.`;
} else {
  message =
    "Gracias por confiar en Ahumada Detailing. Si te gust el resultado, nos ayudara mucho que nos dejaras una resea. Eso nos ayuda a seguir creciendo y a llegar a mas personas.";
}

return [{
  lead_id: leadId,
  phone,
  channel,

  execution_context: {
    ...executionContext,
    lead_id: leadId,
    phone,
    channel,
    action: "request_review"
  },

  context_packet: contextPacket,
  decision,
  execution_meta: executionMeta,

  message_to_send: message,
  message_type: "text",

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...stateUpdate,
    stage: "post_service",
    intent_last: "review_requested",
    next_goal: "request_referral",
    last_bot_action: "request_review",
    missing_fields: []
  },

  notes: [
    ...(input.notes || []),
    "request_review_message_prepared"
  ]
}];
