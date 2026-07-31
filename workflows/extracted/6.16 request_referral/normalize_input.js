// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.16 request_referral  (workflow id 6c7c781d-08ff-41b8-ae57-33b4ad456249)
// Nodo:        normalize_input
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

const phone =
  $json.phone ||
  execution_context.phone ||
  context_packet?.lead?.phone ||
  null;

const channel =
  $json.channel ||
  execution_context.channel ||
  context_packet?.lead?.channel ||
  "whatsapp";

if (!lead_id) {
  throw new Error("Missing lead_id in request_referral");
}

if (!phone) {
  throw new Error("Missing phone in request_referral");
}

return [{
  lead_id,
  phone,
  channel,

  calendar_id: $json.calendar_id || execution_context.calendar_id || context_packet?.state?.calendar_id || null,

  service_interest:
    $json.service_interest ||
    execution_context.service_interest ||
    context_packet?.state?.service_interest ||
    null,

  vehicle_type:
    $json.vehicle_type ||
    execution_context.vehicle_type ||
    context_packet?.state?.vehicle_type ||
    null,

  district:
    $json.district ||
    execution_context.district ||
    context_packet?.state?.district ||
    null,

  booking_date:
    $json.booking_date ||
    execution_context.booking_date ||
    context_packet?.state?.booking_date ||
    null,

  booking_time:
    $json.booking_time ||
    execution_context.booking_time ||
    context_packet?.state?.booking_time ||
    null,

  slot_id:
    $json.slot_id ||
    execution_context.slot_id ||
    context_packet?.state?.slot_id ||
    null,

  referral_message:
    $json.referral_message ||
    decision.referral_message ||
    decision.message ||
    "",

  execution_context: {
    ...execution_context,
    lead_id,
    phone,
    channel,
    action: "request_referral"
  },

  context_packet,
  decision,
  state_update,
  execution_meta,

  notes: [
    ...($json.notes || []),
    "request_referral_input_normalized"
  ]
}];
