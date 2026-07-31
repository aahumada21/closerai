// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.14 notify_on_the_way  (workflow id 213c2fee-a79a-479d-9210-3792201fa1b2)
// Nodo:        build_notify_on_the_way_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = data.context_packet?.state || {};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

const leadId = firstValue(data.lead_id, ctx.lead_id, data.context_packet?.lead?.id);
const phone = firstValue(data.phone, ctx.phone, data.context_packet?.lead?.phone);
const channel = firstValue(data.channel, ctx.channel, data.context_packet?.lead?.channel, "whatsapp");

const etaMinutes = firstValue(
  data.eta_minutes,
  ctx.eta_minutes,
  data.decision?.eta_minutes
);

let message = "Hola, voy en camino al servicio. Te aviso apenas esta llegando.";

if (etaMinutes) {
  message = `Hola, voy en camino al servicio. Llego aproximadamente en ${etaMinutes} minutos. Te aviso apenas esta llegando.`;
}

return [{
  ...data,

  lead_id: leadId,
  phone,
  channel,

  message_to_send: message,

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...(data.state_update || {}),
    stage: state.stage || "booked",
    next_goal: "complete_service",
    last_bot_action: "notify_on_the_way",
    missing_fields: []
  },

  execution_result: {
    success: true,
    action: "notify_on_the_way",
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: [
      "notify_on_the_way_message_prepared"
    ]
  },

  notes: [
    ...(data.notes || []),
    "notify_on_the_way_subworkflow_completed"
  ]
}];
