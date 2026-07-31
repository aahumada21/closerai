// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.13 send_pre_service_instruction  (workflow id a9a040b3-31c0-459b-9c5e-aead2f7b9d28)
// Nodo:        Normalize Input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

function parseMaybeJson(value, fallback = {}) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

return [{
  ...input,

  lead_id: input.lead_id || input.execution_context?.lead_id || null,
  phone: input.phone || input.execution_context?.phone || null,
  channel: input.channel || input.execution_context?.channel || "whatsapp",

  service_interest: input.service_interest || input.execution_context?.service_interest || null,
  vehicle_type: input.vehicle_type || input.execution_context?.vehicle_type || null,
  district: input.district || input.execution_context?.district || null,

  booking_date: input.booking_date || input.execution_context?.booking_date || null,
  booking_time: input.booking_time || input.execution_context?.booking_time || null,
  slot_id: input.slot_id || input.execution_context?.slot_id || null,

  execution_context: parseMaybeJson(input.execution_context, {}),
  context_packet: parseMaybeJson(input.context_packet, {}),
  decision: parseMaybeJson(input.decision, {}),
  state_update: parseMaybeJson(input.state_update, {}),
  execution_meta: parseMaybeJson(input.execution_meta, {})
}];
