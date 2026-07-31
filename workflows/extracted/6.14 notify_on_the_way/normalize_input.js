// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.14 notify_on_the_way  (workflow id 213c2fee-a79a-479d-9210-3792201fa1b2)
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

return [{
  ...$json,

  execution_context: parseMaybeJson($json.execution_context, $json.execution_context || {}),
  context_packet: parseMaybeJson($json.context_packet, $json.context_packet || {}),
  decision: parseMaybeJson($json.decision, $json.decision || {}),
  state_update: parseMaybeJson($json.state_update, $json.state_update || {}),
  execution_meta: parseMaybeJson($json.execution_meta, $json.execution_meta || {}),

  lead_id: $json.lead_id || null,
  channel: $json.channel || "whatsapp",
  phone: $json.phone || null,

  calendar_id: $json.calendar_id || null,
  service_interest: $json.service_interest || null,
  vehicle_type: $json.vehicle_type || null,
  district: $json.district || null,

  booking_date: $json.booking_date || null,
  booking_time: $json.booking_time || null,
  slot_id: $json.slot_id || null,

  service_address: $json.service_address || null,
  address_reference: $json.address_reference || null,
  eta_minutes: $json.eta_minutes || null
}];
