// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.11 collect_address  (workflow id 0c7ab410-ad24-4d54-8a30-0e28b00d3651)
// Nodo:        build_collect_address_result
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

const execution_context = parseMaybeJson($json.execution_context, $json.execution_context || {});
const context_packet = parseMaybeJson($json.context_packet, $json.context_packet || {});
const decision = parseMaybeJson($json.decision, $json.decision || {});
const state_update_input = parseMaybeJson($json.state_update, $json.state_update || {});
const execution_meta = parseMaybeJson($json.execution_meta, $json.execution_meta || {});

const state = context_packet.state || {};

const lead_id =
  $json.lead_id ||
  execution_context.lead_id ||
  context_packet.lead?.id ||
  null;

const phone =
  $json.phone ||
  execution_context.phone ||
  context_packet.lead?.phone ||
  null;

const channel =
  $json.channel ||
  execution_context.channel ||
  context_packet.lead?.channel ||
  "whatsapp";

const district =
  $json.district ||
  execution_context.district ||
  state.district ||
  null;

let message = "Perfecto. Para dejar la reserva bien registrada, me puedes enviar la direccion exacta donde seria el servicio?";

if (district) {
  message = `Perfecto. Para dejar la reserva bien registrada en ${district}, me puedes enviar la direccion exacta donde seria el servicio?`;
}

return [{
  lead_id,
  phone,
  channel,

  message_to_send: message,
  message_type: "text",

  db_operations: ["messages", "lead_state"],

  execution_context: {
    ...execution_context,
    lead_id,
    phone,
    channel,
    action: "collect_address"
  },

  context_packet,
  decision,
  execution_meta,

  state_update: {
    ...state_update_input,
    stage: "collecting_address",
    missing_fields: ["address"],
    next_goal: "collect_address",
    last_bot_action: "collect_address"
  },

  execution_result: {
    success: true,
    action: "collect_address",
    message_sent: false,
    state_updated: false,
    db_records_created: [],
    notes: [
      "collect_address_message_prepared"
    ]
  },

  notes: [
    ...($json.notes || []),
    "collect_address_message_prepared"
  ]
}];
