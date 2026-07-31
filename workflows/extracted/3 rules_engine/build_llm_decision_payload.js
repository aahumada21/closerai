// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        build_llm_decision_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function asObject(value, fallback = {}) {
  if (!value) return fallback;

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

const input = $json;

const decision = asObject(input.decision);
const contextPacket = asObject(input.context_packet);
const meta = asObject(input.meta);

if (!decision.action) {
  throw new Error("Missing decision.action from llm_decision");
}

const event = {
  channel:
    contextPacket.lead?.channel ||
    contextPacket.event?.channel ||
    "whatsapp",
  message_id:
    contextPacket.conversation?.last_message_id ||
    contextPacket.event?.message_id ||
    null,
  text:
    contextPacket.conversation?.latest_user_message ||
    null,
  message_type: "text",
  attachments: [],
  source_metadata: {
    source: "llm_decision"
  }
};

const lead = {
  id: contextPacket.lead?.id || null,
  name: contextPacket.lead?.name || null,
  phone: contextPacket.lead?.phone || null,
  external_id:
    contextPacket.lead?.external_id ||
    contextPacket.lead?.phone ||
    null,
  channel:
    contextPacket.lead?.channel ||
    event.channel ||
    "whatsapp"
};

const leadState = {
  ...(contextPacket.state || {}),
  lead_id:
    contextPacket.state?.lead_id ||
    contextPacket.lead?.id ||
    null
};

const normalizedDecision = {
  ...decision,
  message:
    typeof decision.message === "string"
      ? decision.message.trim()
      : null,
  state_update: asObject(decision.state_update),
  source: decision.source || "llm_decision"
};

if (!normalizedDecision.message) {
  throw new Error(
    `LLM decision action ${normalizedDecision.action} has empty message`
  );
}

return [
  {
    json: {
      event,
      lead,
      lead_state: leadState,
      decision: normalizedDecision,
      context_packet: contextPacket,
      meta: {
        ...meta,
        source: "llm_decision",
        route: "llm_to_action_executor",
        inbound_message_id: event.message_id
      }
    }
  }
];
