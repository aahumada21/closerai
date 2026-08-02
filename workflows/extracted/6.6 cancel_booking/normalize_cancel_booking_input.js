// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
// Nodo:        normalize_cancel_booking_input
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

const execution_context = parseMaybeJson($json.execution_context, {});
const context_packet = parseMaybeJson($json.context_packet, {});
const decision = parseMaybeJson($json.decision, {});
const state_update = parseMaybeJson($json.state_update, {});
const execution_meta = parseMaybeJson($json.execution_meta, {});

const lead_id =
  $json.lead_id ||
  execution_context.lead_id ||
  context_packet?.lead?.id ||
  null;

const channel =
  $json.channel ||
  execution_context.channel ||
  context_packet?.lead?.channel ||
  "whatsapp";

const phone =
  $json.phone ||
  execution_context.phone ||
  context_packet?.lead?.phone ||
  null;

const calendar_id =
  $json.calendar_id ||
  execution_context.calendar_id ||
  null;

const cancellation_reason =
  $json.cancellation_reason ||
  execution_context.cancellation_reason ||
  decision.cancellation_reason ||
  decision.reason ||
  "cancelled_by_client";

const target_appointment_id =
  $json.target_appointment_id ||
  execution_context.target_appointment_id ||
  state_update.target_appointment_id ||
  null;

const agent_id =
  $json.agent_id ||
  execution_context.agent_id ||
  context_packet?.routing?.agent_id ||
  context_packet?.agent?.id ||
  null;

if (!lead_id) {
  throw new Error("Missing lead_id in cancel_booking");
}

return [
  {
    json: {
      lead_id,
      channel,
      phone,
      calendar_id,
      cancellation_reason,
      target_appointment_id,
      agent_id,

      execution_context: {
        ...execution_context,
        lead_id,
        channel,
        phone,
        calendar_id,
        cancellation_reason,
        target_appointment_id,
        agent_id,
        action: "cancel_booking"
      },

      context_packet,
      decision,
      state_update,
      execution_meta,

      notes: ["cancel_booking_input_normalized"]
    }
  }
];
