// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        cancel_booking
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;

return [{
  lead_id: data.execution_context?.lead_id,
  channel: data.execution_context?.channel || "whatsapp",
  phone: data.execution_context?.phone || data.context_packet?.lead?.phone || null,
  calendar_id: data.execution_context?.calendar_id || null,

  cancellation_reason:
    data.execution_context?.cancellation_reason ||
    data.decision?.cancellation_reason ||
    data.decision?.reason ||
    "cancelled_by_client",

  execution_context: data.execution_context || {},
  context_packet: data.context_packet || {},
  decision: data.decision || {},
  state_update: data.state_update || {},
  execution_meta: data.execution_meta || {},

  notes: [
    ...(data.notes || []),
    "cancel_booking_parent_payload_prepared"
  ]
}];
