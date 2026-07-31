// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        validate_input
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
const event = asObject(input.event);
const lead = asObject(input.lead);
const leadState = asObject(input.lead_state);
const meta = asObject(input.meta);

if (!decision.action) {
  throw new Error("Missing decision.action");
}

if (!contextPacket || Object.keys(contextPacket).length === 0) {
  throw new Error("Missing context_packet");
}

return [
  {
    json: {
      ...input,

      event,
      lead,
      lead_state: leadState,
      decision,
      context_packet: contextPacket,

      execution_meta: {
        ...(input.execution_meta || {}),
        execution_id:
          input.execution_meta?.execution_id ||
          Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "6_action_executor"
      },

      meta: {
        ...meta,
        received_by: "6_action_executor",
        original_action: decision.action
      }
    }
  }
];
