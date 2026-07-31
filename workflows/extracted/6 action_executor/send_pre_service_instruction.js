// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        send_pre_service_instruction
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = data.context_packet?.state || {};

return [{
  lead_id: ctx.lead_id,
  channel: ctx.channel || "whatsapp",
  phone: ctx.phone || data.context_packet?.lead?.phone || null,

  calendar_id: ctx.calendar_id || state.calendar_id || null,

  service_interest: ctx.service_interest || state.service_interest || null,
  vehicle_type: ctx.vehicle_type || state.vehicle_type || null,
  district: ctx.district || state.district || null,

  booking_date: ctx.booking_date || state.booking_date || null,
  booking_time: ctx.booking_time || state.booking_time || null,
  slot_id: ctx.slot_id || state.slot_id || null,

  execution_context: ctx,
  context_packet: data.context_packet || {},
  decision: data.decision || {},
  state_update: data.state_update || {},
  execution_meta: data.execution_meta || {},

  notes: [
    ...(data.notes || []),
    "send_pre_service_instructions_parent_payload_prepared"
  ]
}];
