// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        cancel_booking
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;

// Forzar limpieza de los campos de reserva sin importar si la decision vino
// de una regla determinista (que ya declara fields_to_clear) o del LLM (que
// no conoce esa convencion y puede reusar valores viejos de booking_date/
// booking_time del contexto). Sin esto, COALESCE en 6.24 persist_and_audit
// preserva el valor viejo en la columna y el bot sigue "recordando" una
// reserva ya cancelada.
const incomingStateUpdate = data.state_update || {};
const forcedClearFields = ["booking_date", "booking_time", "slot_id", "booking_options", "availability_confirmed"];
const existingFieldsToClear = Array.isArray(incomingStateUpdate.fields_to_clear) ? incomingStateUpdate.fields_to_clear : [];
const mergedFieldsToClear = Array.from(new Set([...existingFieldsToClear, ...forcedClearFields]));

const stateUpdate = {
  ...incomingStateUpdate,
  booking_date: null,
  booking_time: null,
  slot_id: null,
  availability_confirmed: false,
  booking_options: [],
  fields_to_clear: mergedFieldsToClear
};

const targetAppointmentId =
  data.decision?.state_update?.target_appointment_id ||
  data.execution_context?.state_update?.target_appointment_id ||
  incomingStateUpdate.target_appointment_id ||
  data.execution_context?.target_appointment_id ||
  null;

return [{
  lead_id: data.execution_context?.lead_id,
  channel: data.execution_context?.channel || "whatsapp",
  phone: data.execution_context?.phone || data.context_packet?.lead?.phone || null,
  calendar_id: data.execution_context?.calendar_id || null,
  target_appointment_id: targetAppointmentId,

  cancellation_reason:
    data.execution_context?.cancellation_reason ||
    data.decision?.cancellation_reason ||
    data.decision?.reason ||
    "cancelled_by_client",

  execution_context: {
    ...(data.execution_context || {}),
    target_appointment_id: targetAppointmentId
  },
  context_packet: data.context_packet || {},
  decision: data.decision || {},
  state_update: stateUpdate,
  execution_meta: data.execution_meta || {},

  notes: [
    ...(data.notes || []),
    "cancel_booking_parent_payload_prepared"
  ]
}];
